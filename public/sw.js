/**
 * sw.js — Parental Control PWA Service Worker
 *
 * Strategy:
 *   /api/*        → Network-only (never cache live enforcement data)
 *   Everything else → Cache-first with network fallback (app shell)
 */

const CACHE = 'guardian-v1'

const SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
]

// ── Install ────────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  )
})

// ── Activate (prune old caches) ────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

// ── Fetch ──────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only intercept same-origin requests
  if (url.origin !== self.location.origin) return

  // API calls — network only, never cache
  if (url.pathname.startsWith('/api/')) {
    if (request.method !== 'GET') return
    event.respondWith(
      fetch(request).catch(() =>
        new Response(
          JSON.stringify({ error: 'Offline — enforcement agent unreachable' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )
      )
    )
    return
  }

  // Non-GET — pass through
  if (request.method !== 'GET') return

  // App shell — cache first, fall back to network, cache new responses
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone()
          caches.open(CACHE).then((c) => c.put(request, clone))
        }
        return response
      }).catch(() => {
        // Navigation fallback
        if (request.mode === 'navigate') return caches.match('/index.html')
        return new Response('Offline', { status: 503 })
      })
    })
  )
})

// ── Messages ───────────────────────────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})
