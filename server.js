/**
 * server.js  —  Parental Control Unified Backend
 *
 * ONE process, ONE port (3000). Responsibilities:
 *   1. Serve the built PWA from ./dist (production)
 *   2. Read the shared API token from agent/data/api-token.txt
 *   3. Forward /api/* to the enforcement agent on port 3001,
 *      injecting X-API-Token server-side (browser never sees the token)
 *
 * Run order:
 *   1.  node agent/src/index.js   ← enforcement agent (port 3001)
 *   2.  node server.js            ← this file (port 3000)
 *
 * In development Vite (port 5173) already proxies /api → 3000,
 * so the browser always talks to a single origin.
 */

'use strict'

const express = require('express')
const cors    = require('cors')
const fs      = require('fs')
const path    = require('path')
const http    = require('http')

const app        = express()
const PORT       = parseInt(process.env.PORT || '3000', 10)
const AGENT_URL  = process.env.AGENT_URL || 'http://127.0.0.1:3001'
const TOKEN_FILE = path.join(__dirname, 'agent', 'data', 'api-token.txt')
const DIST_DIR   = path.join(__dirname, 'dist')

// ─── Token helper ─────────────────────────────────────────────────────────────

function readToken () {
  try { return fs.readFileSync(TOKEN_FILE, 'utf8').trim() }
  catch { return null }
}

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({
  origin: [
    'http://localhost:3000', 'http://127.0.0.1:3000',
    'http://localhost:5173', 'http://127.0.0.1:5173',   // Vite dev server
    'https://knoxs.vercel.app',                          // Vercel-hosted PWA
  ],

  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}))

app.use(express.json({ limit: '512kb' }))

// ─── /api/health — public, proxied to agent ───────────────────────────────────

app.get('/api/health', (_req, res) => {
  const token = readToken()
  const agentReq = http.request(`${AGENT_URL}/api/health`, { method: 'GET' }, (agentRes) => {
    let body = ''
    agentRes.on('data', (c) => (body += c))
    agentRes.on('end', () => {
      try { res.json({ proxy: 'ok', tokenPresent: !!token, agent: JSON.parse(body) }) }
      catch { res.json({ proxy: 'ok', tokenPresent: !!token, agent: 'parse_error' }) }
    })
  })
  agentReq.on('error', () => res.json({ proxy: 'ok', tokenPresent: !!token, agent: 'unreachable' }))
  agentReq.end()
})

// ─── /api/* — authenticated proxy to enforcement agent ───────────────────────

app.all('/api/*', (req, res) => {
  const token = readToken()
  if (!token) {
    return res.status(503).json({ error: 'Agent token not found. Is the enforcement agent running?' })
  }

  const proxyReq = http.request(
    `${AGENT_URL}${req.originalUrl}`,
    { method: req.method, headers: { 'Content-Type': 'application/json', 'X-API-Token': token } },
    (agentRes) => {
      res.status(agentRes.statusCode || 500).set('Content-Type', 'application/json')
      agentRes.pipe(res)
    }
  )
  proxyReq.on('error', (err) => {
    console.error(`[proxy] ${req.method} ${req.originalUrl} → ${err.message}`)
    res.status(502).json({ error: 'Could not reach enforcement agent', detail: err.message })
  })
  if (req.body && Object.keys(req.body).length > 0) proxyReq.write(JSON.stringify(req.body))
  proxyReq.end()
})

// ─── Serve built PWA (production) ─────────────────────────────────────────────

if (fs.existsSync(DIST_DIR)) {
  // Hashed assets get long cache; everything else short cache
  app.use('/assets', express.static(path.join(DIST_DIR, 'assets'), { maxAge: '1y', immutable: true }))
  app.use(express.static(DIST_DIR, { maxAge: '1h' }))
  // SPA fallback — all non-API routes return index.html
  app.get('*', (req, res) => res.sendFile(path.join(DIST_DIR, 'index.html')))
} else {
  console.warn('[server] ./dist not found — run `npm run build` to create production files')
}

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, '127.0.0.1', () => {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  Parental Control  |  Backend Server')
  console.log('═══════════════════════════════════════════════════════════')
  console.log(`  Server : http://127.0.0.1:${PORT}`)
  console.log(`  Agent  : ${AGENT_URL}`)
  console.log(`  Token  : ${readToken() ? '✓ loaded' : '✗ NOT FOUND — start agent first'}`)
  console.log(`  PWA    : ${fs.existsSync(DIST_DIR) ? '✓ serving from ./dist' : '⚠ not built yet'}`)
  console.log('═══════════════════════════════════════════════════════════')
})

process.on('uncaughtException', (err) => { console.error('[server]', err); process.exit(1) })
