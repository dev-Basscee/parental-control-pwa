/**
 * agent/src/index.js
 * Entry point for the parental-control enforcement agent.
 *
 * Start with:  node agent/src/index.js
 * Or via npm:  npm run agent
 */

'use strict'

const express = require('express')
const cors    = require('cors')
const { API_HOST, API_PORT } = require('./config')
const { ensureToken, tokenMiddleware } = require('./auth')
const apiRouter  = require('./api')
const monitor    = require('./processMonitor')

// ─── Bootstrap ────────────────────────────────────────────────────────────────

const token = ensureToken()
console.log('═══════════════════════════════════════════════════════')
console.log('  Parental Control Enforcement Agent')
console.log('═══════════════════════════════════════════════════════')
console.log(`  API  : http://${API_HOST}:${API_PORT}/api`)
console.log(`  Token: ${token.slice(0, 8)}…  (see data/api-token.txt for full value)`)
console.log('═══════════════════════════════════════════════════════')

// ─── Express setup ────────────────────────────────────────────────────────────

const app = express()

// Only accept connections from localhost
app.use((req, res, next) => {
  const ip = req.socket.remoteAddress || ''
  const isLocal = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1'
  if (!isLocal) {
    return res.status(403).json({ error: 'Forbidden — agent only accepts local connections' })
  }
  next()
})

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-API-Token'],
}))

app.use(express.json())

// Auth middleware (every route except /api/health)
app.use('/api', tokenMiddleware)

// Mount API router
app.use('/api', apiRouter)

// 404 catch-all
app.use((req, res) => res.status(404).json({ error: 'Not found' }))

// ─── Start ────────────────────────────────────────────────────────────────────

const server = app.listen(API_PORT, API_HOST, () => {
  console.log(`\n[api] Listening on http://${API_HOST}:${API_PORT}`)
  monitor.start()
})

// ─── Graceful shutdown ────────────────────────────────────────────────────────

function shutdown(signal) {
  console.log(`\n[agent] Received ${signal} — shutting down...`)
  monitor.stop()
  server.close(() => {
    console.log('[agent] HTTP server closed. Bye.')
    process.exit(0)
  })
  setTimeout(() => process.exit(1), 5000)
}

process.on('SIGINT',  () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

process.on('uncaughtException', (err) => {
  console.error('[agent] Uncaught exception:', err)
  // Let the service manager restart us
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  console.error('[agent] Unhandled rejection:', reason)
})
