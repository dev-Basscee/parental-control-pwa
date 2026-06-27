/**
 * agent/src/processMonitor.js
 * Core enforcement engine:
 *   - Scans running processes with `tasklist`
 *   - Kills any that match active (non-expired) blocklist entries
 *   - Prunes expired entries automatically
 *   - Emits structured log entries for every action
 */

const { exec }     = require('child_process')
const { promisify } = require('util')
const crypto        = require('crypto')
const { SCAN_INTERVAL_MS } = require('./config')
const store         = require('./store')

const execAsync = promisify(exec)

let scanTimer = null
let isRunning = false

// ─── tasklist parser ───────────────────────────────────────────────────────────

/**
 * Returns an array of { name, pid, sessionName, session, memUsage }
 */
async function getRunningProcesses() {
  const { stdout } = await execAsync('tasklist /FO CSV /NH', { encoding: 'utf8', windowsHide: true })
  return stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      // CSV format: "Name","PID","Session Name","Session#","Mem Usage"
      const parts = line.split('","')
      return {
        name:        parts[0]?.replace(/^"/, '') || '',
        pid:         parseInt(parts[1] || '0', 10),
        sessionName: parts[2] || '',
        memUsage:    parts[4]?.replace(/"$/, '') || '',
      }
    })
    .filter((p) => p.name && !isNaN(p.pid) && p.pid > 0)
}

/**
 * Try to get visible window titles for processes using `tasklist /V`.
 * Returns a Map<processName_lower, windowTitle>.
 */
async function getWindowTitles() {
  try {
    const { stdout } = await execAsync('tasklist /FO CSV /NH /V', { encoding: 'utf8', windowsHide: true })
    const map = new Map()
    stdout
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .forEach((line) => {
        const parts = line.split('","')
        const name  = parts[0]?.replace(/^"/, '') || ''
        const title = parts[8]?.replace(/"$/, '') || ''
        if (name && title && title !== 'N/A') {
          map.set(name.toLowerCase(), title)
        }
      })
    return map
  } catch {
    return new Map()
  }
}

// ─── Kill helper ───────────────────────────────────────────────────────────────

async function killProcess(processName) {
  // /F = force, /IM = image name, /T = terminate child processes too
  await execAsync(`taskkill /F /IM "${processName}" /T`, { windowsHide: true })
}

// ─── Log helper ────────────────────────────────────────────────────────────────

function logEvent(action, processName, displayName, detail) {
  const entry = {
    id:          crypto.randomUUID(),
    timestamp:   new Date().toISOString(),
    action,
    processName,
    displayName,
    detail: detail || null,
  }
  store.appendLog(entry)
  console.log(`[monitor] ${action.toUpperCase()} | ${displayName} (${processName}) | ${detail || ''}`)
  return entry
}

// ─── Scan cycle ────────────────────────────────────────────────────────────────

async function scanCycle() {
  try {
    // 1. Prune expired entries
    const expired = store.pruneExpired()
    for (const e of expired) {
      logEvent('expired', e.processName, e.displayName, `Block expired at ${e.expiresAt}`)
    }

    // 2. Get current blocklist
    const blocklist = store.getBlocklist()
    if (blocklist.length === 0) return

    // 3. Get running processes
    const running = await getRunningProcesses()

    // 4. Check each running process against the blocklist
    for (const proc of running) {
      const match = blocklist.find(
        (entry) => entry.processName.toLowerCase() === proc.name.toLowerCase()
      )
      if (!match) continue

      // Double-check the entry hasn't expired (belt + suspenders)
      if (match.blockType === 'until_timestamp' && match.expiresAt) {
        if (new Date(match.expiresAt).getTime() <= Date.now()) continue
      }

      // Kill it
      try {
        await killProcess(proc.name)
        logEvent('killed', proc.name, match.displayName, `PID ${proc.pid} terminated`)
      } catch (err) {
        logEvent('kill_failed', proc.name, match.displayName, err.message)
      }
    }
  } catch (err) {
    console.error('[monitor] Scan error:', err.message)
  }
}

// ─── Public API ────────────────────────────────────────────────────────────────

function start() {
  if (isRunning) return
  isRunning = true
  console.log(`[monitor] Starting process monitor (interval: ${SCAN_INTERVAL_MS}ms)`)
  scanTimer = setInterval(scanCycle, SCAN_INTERVAL_MS)
  // Run first scan immediately
  scanCycle()
}

function stop() {
  if (scanTimer) clearInterval(scanTimer)
  isRunning = false
  console.log('[monitor] Process monitor stopped')
}

module.exports = { start, stop, getRunningProcesses, getWindowTitles }
