/**
 * agent/src/config.js
 * Central configuration for the parental-control enforcement agent.
 */

const path = require('path')
const os   = require('os')

// Data lives next to the agent directory so it survives updates
const DATA_DIR = path.join(__dirname, '..', 'data')

module.exports = {
  /** Directory that holds all persisted files */
  DATA_DIR,

  /** Blocklist store */
  BLOCKLIST_FILE: path.join(DATA_DIR, 'blocklist.json'),

  /** Event log store */
  LOG_FILE: path.join(DATA_DIR, 'events.json'),

  /** Shared API token file (read by the dashboard as well) */
  TOKEN_FILE: path.join(DATA_DIR, 'api-token.txt'),

  /** Only bind to loopback — never expose externally */
  API_HOST: '127.0.0.1',
  API_PORT: 3001,

  /** How many seconds between process-scan cycles */
  SCAN_INTERVAL_MS: 3000,

  /** Keep at most this many log entries in memory / on disk */
  MAX_LOG_ENTRIES: 500,
}
