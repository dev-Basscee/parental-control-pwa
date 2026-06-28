/**
 * agent/src/api.js
 * REST API definitions (mounted by index.js on the Express app).
 *
 * Endpoints:
 *   GET  /api/health        — public; uptime + status
 *   GET  /api/blocklist     — all entries with timeRemaining
 *   POST /api/blocklist     — add a new block entry
 *   DELETE /api/blocklist/:id — remove / unblock
 *   GET  /api/processes     — currently running user-facing processes
 *   GET  /api/logs          — recent block/kill/expiry events
 */

const express = require('express')
const crypto  = require('crypto')
const store   = require('./store')
const { getRunningProcesses, getWindowTitles } = require('./processMonitor')

const router   = express.Router()
const START_TIME = Date.now()

// ─── GET /api/health ──────────────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({
    status:  'ok',
    uptime:  Math.floor((Date.now() - START_TIME) / 1000),
    version: require('../../package.json').version || '1.0.0',
  })
})

// ─── GET /api/blocklist ───────────────────────────────────────────────────────
router.get('/blocklist', (req, res) => {
  const now  = Date.now()
  const list = store.getBlocklist().map((entry) => {
    let timeRemaining = null
    if (entry.blockType === 'until_timestamp' && entry.expiresAt) {
      timeRemaining = Math.max(0, Math.floor((new Date(entry.expiresAt).getTime() - now) / 1000))
    }
    return { ...entry, timeRemaining }
  })
  res.json(list)
})

// ─── POST /api/blocklist ──────────────────────────────────────────────────────
router.post('/blocklist', (req, res) => {
  const { processName, displayName, blockType, expiresAt } = req.body

  if (!processName || typeof processName !== 'string') {
    return res.status(400).json({ error: '`processName` is required' })
  }
  if (!['indefinite', 'until_timestamp'].includes(blockType)) {
    return res.status(400).json({ error: '`blockType` must be "indefinite" or "until_timestamp"' })
  }
  if (blockType === 'until_timestamp' && !expiresAt) {
    return res.status(400).json({ error: '`expiresAt` is required when blockType is "until_timestamp"' })
  }
  if (blockType === 'until_timestamp' && isNaN(Date.parse(expiresAt))) {
    return res.status(400).json({ error: '`expiresAt` must be a valid ISO timestamp' })
  }

  const entry = {
    id:          crypto.randomUUID(),
    processName: processName.trim(),
    displayName: (displayName || processName).trim(),
    blockType,
    expiresAt:   blockType === 'until_timestamp' ? new Date(expiresAt).toISOString() : null,
    createdAt:   new Date().toISOString(),
  }

  store.addBlockEntry(entry)
  store.appendLog({
    id:          crypto.randomUUID(),
    timestamp:   new Date().toISOString(),
    action:      'block_added',
    processName: entry.processName,
    displayName: entry.displayName,
    detail:      `blockType=${entry.blockType}${entry.expiresAt ? ', expires=' + entry.expiresAt : ''}`,
  })

  res.status(201).json(entry)
})

// ─── DELETE /api/blocklist/:id ────────────────────────────────────────────────
router.delete('/blocklist/:id', (req, res) => {
  const { id } = req.params
  const list   = store.getBlocklist()
  const entry  = list.find((e) => e.id === id)

  if (!entry) {
    return res.status(404).json({ error: 'Entry not found' })
  }

  store.removeBlockEntry(id)
  store.appendLog({
    id:          crypto.randomUUID(),
    timestamp:   new Date().toISOString(),
    action:      'block_removed',
    processName: entry.processName,
    displayName: entry.displayName,
    detail:      'Manually unblocked via API',
  })

  res.json({ success: true, removed: entry })
})

// ─── GET /api/processes ───────────────────────────────────────────────────────
router.get('/processes', async (req, res) => {
  try {
    const [procs, titles] = await Promise.all([getRunningProcesses(), getWindowTitles()])

    // Deduplicate by process name, pick the one with a window title if available
    const seen = new Map()
    for (const p of procs) {
      const key   = p.name.toLowerCase()
      const title = titles.get(key) || null
      if (!seen.has(key) || title) {
        seen.set(key, { name: p.name, pid: p.pid, windowTitle: title })
      }
    }

    // Filter out obvious system noise: PID 0, 4, idle, system processes
    const SYSTEM_PROCS = new Set([
      'system', 'system idle process', 'registry', 'smss.exe', 'csrss.exe',
      'wininit.exe', 'services.exe', 'lsass.exe', 'winlogon.exe', 'svchost.exe',
      'dwm.exe', 'fontdrvhost.exe', 'securityhealthservice.exe',
    ])

    const result = [...seen.values()]
      .filter((p) => !SYSTEM_PROCS.has(p.name.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name))

    res.json(result)
  } catch (err) {
    res.status(500).json({ error: 'Failed to enumerate processes', detail: err.message })
  }
})

// ─── GET /api/logs ────────────────────────────────────────────────────────────
router.get('/logs', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '100', 10), 500)
  res.json(store.getLogs().slice(0, limit))
})

const { getInstalledApps } = require('./appScanner')

// ─── GET /api/installed-apps ──────────────────────────────────────────────────
router.get('/installed-apps', async (req, res) => {
  try {
    const apps = await getInstalledApps()
    res.json(apps)
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve installed apps' })
  }
})

module.exports = router
