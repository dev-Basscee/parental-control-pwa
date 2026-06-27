/**
 * agent/src/auth.js
 * Shared-secret authentication middleware.
 * The token is stored in DATA_DIR/api-token.txt and read by both
 * the agent and the dashboard PWA at runtime.
 */

const fs     = require('fs')
const crypto = require('crypto')
const { TOKEN_FILE, DATA_DIR } = require('./config')

/** Generate or load the API token. Called once at startup. */
function ensureToken() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }

  if (!fs.existsSync(TOKEN_FILE)) {
    const token = crypto.randomBytes(32).toString('hex')
    fs.writeFileSync(TOKEN_FILE, token, 'utf8')
    console.log(`[auth] Generated new API token → ${TOKEN_FILE}`)
    return token
  }

  return fs.readFileSync(TOKEN_FILE, 'utf8').trim()
}

/** Express middleware — checks the X-API-Token header. */
function tokenMiddleware(req, res, next) {
  // Health check is public so the dashboard can detect the agent without a token
  // When mounted under app.use('/api', ...), req.path is the sub-path (e.g. '/health')
  if (req.path === '/health' || req.path === '/api/health') return next()

  const provided = req.headers['x-api-token'] || req.query['token']
  const expected = fs.readFileSync(TOKEN_FILE, 'utf8').trim()

  if (!provided || provided !== expected) {
    return res.status(401).json({ error: 'Unauthorized — invalid or missing API token' })
  }
  next()
}

module.exports = { ensureToken, tokenMiddleware }
