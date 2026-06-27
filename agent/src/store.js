/**
 * agent/src/store.js
 * Simple JSON persistence for blocklist + event log.
 * Uses atomic write (write-then-rename) to avoid corruption on crash.
 */

const fs   = require('fs')
const path = require('path')
const { DATA_DIR, BLOCKLIST_FILE, LOG_FILE, MAX_LOG_ENTRIES } = require('./config')

// ─── Bootstrap ────────────────────────────────────────────────────────────────

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

function readJSON(filePath, fallback) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'))
    }
  } catch (e) {
    console.error(`[store] Failed to read ${filePath}:`, e.message)
  }
  return fallback
}

function writeJSON(filePath, data) {
  ensureDataDir()
  const tmp = filePath + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8')
  fs.renameSync(tmp, filePath)
}

// ─── Blocklist ─────────────────────────────────────────────────────────────────

/** @returns {{ id:string, processName:string, displayName:string, blockType:string, expiresAt:string|null, createdAt:string }[]} */
function getBlocklist() {
  return readJSON(BLOCKLIST_FILE, [])
}

function saveBlocklist(list) {
  writeJSON(BLOCKLIST_FILE, list)
}

function addBlockEntry(entry) {
  const list = getBlocklist()
  // Prevent exact duplicate process names
  const existing = list.findIndex(
    (e) => e.processName.toLowerCase() === entry.processName.toLowerCase()
  )
  if (existing !== -1) list.splice(existing, 1)
  list.push(entry)
  saveBlocklist(list)
  return entry
}

function removeBlockEntry(id) {
  const list = getBlocklist()
  const idx  = list.findIndex((e) => e.id === id)
  if (idx === -1) return false
  list.splice(idx, 1)
  saveBlocklist(list)
  return true
}

/** Remove entries whose expiresAt has passed.  Returns the removed entries. */
function pruneExpired() {
  const now  = Date.now()
  const list = getBlocklist()
  const expired = list.filter(
    (e) => e.blockType === 'until_timestamp' && e.expiresAt && new Date(e.expiresAt).getTime() <= now
  )
  if (expired.length > 0) {
    const active = list.filter(
      (e) => !(e.blockType === 'until_timestamp' && e.expiresAt && new Date(e.expiresAt).getTime() <= now)
    )
    saveBlocklist(active)
  }
  return expired
}

// ─── Event Log ─────────────────────────────────────────────────────────────────

/** @returns {{ id:string, timestamp:string, action:string, processName:string, displayName:string, detail?:string }[]} */
function getLogs() {
  return readJSON(LOG_FILE, [])
}

function appendLog(entry) {
  const logs = getLogs()
  logs.unshift(entry)           // newest first
  if (logs.length > MAX_LOG_ENTRIES) logs.length = MAX_LOG_ENTRIES
  writeJSON(LOG_FILE, logs)
  return entry
}

module.exports = {
  getBlocklist,
  addBlockEntry,
  removeBlockEntry,
  pruneExpired,
  getLogs,
  appendLog,
}
