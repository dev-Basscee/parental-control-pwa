Build a Windows background agent that enforces app blocking for a parental control system. This is the enforcement engine — it has no UI of its own, just a local REST API that a separate dashboard app will call.

## Core requirements
- Runs as a Windows service (or auto-starting background process) with elevated/admin privileges, since killing other processes requires it.
- Maintains a blocklist of apps, persisted to disk (JSON file or SQLite). Each entry has:
  - process name (e.g., "RobloxPlayerBeta.exe")
  - display name (e.g., "Roblox")
  - block type: "indefinite" or "until_timestamp"
  - expiry timestamp (if applicable)
  - createdAt timestamp
- Every 2-5 seconds, scans currently running processes (via `tasklist` shell call, or native process APIs if using C#/.NET).
- If a running process matches a blocked entry (and the block hasn't expired), immediately terminate it.
- When a block's expiry timestamp passes, automatically remove it from the active blocklist.
- Log every block/kill event and every expiry to a local log file or table (timestamp, app name, action) so the dashboard can show history.
- Auto-restart on crash (Windows service recovery options), and auto-start on boot.

## Local REST API (bind to 127.0.0.1 only — never expose externally)
Expose these endpoints for the dashboard PWA to consume:
- `GET /api/blocklist` — return all current blocklist entries with time remaining
- `POST /api/blocklist` — add a new entry: { processName, displayName, blockType, expiresAt? }
- `DELETE /api/blocklist/:id` — remove an entry (unblock immediately)
- `GET /api/processes` — return a list of currently running user-facing processes (name + window title where available), so the dashboard can offer a picker instead of free text
- `GET /api/logs` — return recent block/kill/expiry events
- `GET /api/health` — simple status check (agent is running, uptime)

Secure this API with a simple shared secret/token (e.g., a token stored in a local config file that the dashboard also reads), checked via a header on every request, since anything on localhost could otherwise be called by other local software.

## Tech stack
- Preferred: Node.js with `express` for the API and `node-windows` for service installation, using `tasklist`/`taskkill` via child_process for process control.
- Alternative if you judge it more robust: C#/.NET Worker Service with System.Diagnostics.Process for monitoring/killing, and a minimal ASP.NET Core API.
- Storage: lowdb (JSON) or SQLite — pick whichever is simpler to wire up reliably.

## Deliverables
- Full source for the agent.
- Install script that registers it as a Windows service with auto-start and auto-restart-on-failure.
- A README covering: how to install/uninstall the service, where the blocklist/log files live, how the shared API token is generated/stored, and example curl commands for each endpoint.

Start by scaffolding the process monitor + kill logic, then add persistence, then wrap it in the REST API, then handle the Windows service installation.