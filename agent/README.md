# Parental Control Agent — Developer README

## Overview

```
parental-control-pwa/
├── agent/                  ← Enforcement engine (THIS document)
│   ├── src/
│   │   ├── index.js        ← Entry point, Express server
│   │   ├── config.js       ← All paths / constants
│   │   ├── store.js        ← JSON persistence (blocklist + logs)
│   │   ├── processMonitor.js ← Process scan + kill loop
│   │   ├── auth.js         ← Shared-secret token middleware
│   │   └── api.js          ← REST route handlers
│   ├── scripts/
│   │   ├── install-service.js    ← Register as Windows service
│   │   └── uninstall-service.js  ← Remove Windows service
│   ├── data/               ← Created automatically at first run
│   │   ├── blocklist.json
│   │   ├── events.json
│   │   └── api-token.txt   ← Shared secret — also read by dashboard
│   └── package.json
├── setup-agent.ps1         ← One-shot install/uninstall script
└── (dashboard files…)
```

---

## Quick Start (Development)

```powershell
# Install agent dependencies
cd agent
npm install

# Start the agent (runs in the foreground with logs)
node src/index.js
```

The agent binds to **`127.0.0.1:3001`** only.

---

## Windows Service Installation

> **Must be run as Administrator.**

```powershell
# From the repo root:
.\setup-agent.ps1
```

This will:
1. Run `npm install` inside `agent/`
2. Register `ParentalControlAgent` as a Windows service (auto-start, 10× auto-restart on crash)
3. Start the service immediately

**Uninstall:**

```powershell
.\setup-agent.ps1 -Uninstall
```

Or manually:
```powershell
cd agent
node scripts/uninstall-service.js
```

### Manual service management

```powershell
sc query ParentalControlAgent   # status
sc stop  ParentalControlAgent
sc start ParentalControlAgent
```

---

## Data Files

| File | Purpose |
|------|---------|
| `agent/data/blocklist.json` | Active block entries (auto-created) |
| `agent/data/events.json`    | Recent 500 block/kill/expiry events |
| `agent/data/api-token.txt`  | Shared API token — **keep this file private** |

---

## API Token

- Generated automatically with `crypto.randomBytes(32)` on **first run**
- Stored in `agent/data/api-token.txt`
- The dashboard reads the same file at runtime
- Passed via request header: `X-API-Token: <token>`
- The `/api/health` endpoint is **public** (no token required) so the dashboard can detect whether the agent is running

To regenerate the token, delete `agent/data/api-token.txt` and restart the agent.

---

## REST API Reference

All endpoints (except `/api/health`) require:

```
X-API-Token: <contents of agent/data/api-token.txt>
```

### `GET /api/health`
No auth required.
```json
{ "status": "ok", "uptime": 3600, "version": "1.0.0" }
```

---

### `GET /api/blocklist`
Returns all active block entries with `timeRemaining` (seconds, `null` for indefinite).

```bash
curl http://127.0.0.1:3001/api/blocklist \
  -H "X-API-Token: YOUR_TOKEN"
```

```json
[
  {
    "id": "uuid",
    "processName": "RobloxPlayerBeta.exe",
    "displayName": "Roblox",
    "blockType": "until_timestamp",
    "expiresAt": "2025-12-31T22:00:00.000Z",
    "createdAt": "2025-12-31T18:00:00.000Z",
    "timeRemaining": 14400
  }
]
```

---

### `POST /api/blocklist`
Add a new block entry.

```bash
# Block indefinitely
curl -X POST http://127.0.0.1:3001/api/blocklist \
  -H "X-API-Token: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"processName":"Discord.exe","displayName":"Discord","blockType":"indefinite"}'

# Block until a specific time
curl -X POST http://127.0.0.1:3001/api/blocklist \
  -H "X-API-Token: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "processName": "RobloxPlayerBeta.exe",
    "displayName": "Roblox",
    "blockType": "until_timestamp",
    "expiresAt": "2025-12-31T22:00:00.000Z"
  }'
```

**Body fields:**

| Field | Required | Description |
|-------|----------|-------------|
| `processName` | ✅ | Exact `.exe` name (case-insensitive match at runtime) |
| `displayName` | ❌ | Human-friendly name (defaults to processName) |
| `blockType` | ✅ | `"indefinite"` or `"until_timestamp"` |
| `expiresAt` | Conditional | ISO timestamp; required when `blockType="until_timestamp"` |

---

### `DELETE /api/blocklist/:id`
Remove / immediately unblock an entry.

```bash
curl -X DELETE http://127.0.0.1:3001/api/blocklist/UUID_HERE \
  -H "X-API-Token: YOUR_TOKEN"
```

---

### `GET /api/processes`
List currently running user-facing processes (for the dashboard picker).

```bash
curl http://127.0.0.1:3001/api/processes \
  -H "X-API-Token: YOUR_TOKEN"
```

```json
[
  { "name": "chrome.exe",  "pid": 1234, "windowTitle": "New Tab - Google Chrome" },
  { "name": "Discord.exe", "pid": 5678, "windowTitle": "Discord" }
]
```

---

### `GET /api/logs`
Recent block/kill/expiry events. Optional `?limit=N` (max 500).

```bash
curl "http://127.0.0.1:3001/api/logs?limit=50" \
  -H "X-API-Token: YOUR_TOKEN"
```

```json
[
  {
    "id": "uuid",
    "timestamp": "2025-12-31T18:05:02.000Z",
    "action": "killed",
    "processName": "RobloxPlayerBeta.exe",
    "displayName": "Roblox",
    "detail": "PID 9876 terminated"
  }
]
```

**Action values:** `killed` | `kill_failed` | `expired` | `block_added` | `block_removed`

---

## How It Works

1. On startup the agent generates (or loads) the API token and starts the Express server.
2. Every **3 seconds** `processMonitor.js` calls `tasklist /FO CSV /NH` to get all running processes.
3. For each running process it checks if the name matches any active blocklist entry.
4. If a match is found (and the block hasn't expired), `taskkill /F /IM <name> /T` is called immediately.
5. Expired `until_timestamp` entries are pruned at the start of each scan cycle and a log event is written.
6. All kill/expire/add/remove events are written to `agent/data/events.json` (newest first, capped at 500).

---

## Troubleshooting

| Problem | Solution |
|---------|---------|
| Agent can't kill processes | Make sure it's running as Administrator or as a service with SYSTEM privileges |
| `api-token.txt` not found | Start the agent once — it auto-creates the file |
| Port 3001 already in use | Change `API_PORT` in `agent/src/config.js` |
| Service won't install | Run PowerShell as Administrator |
