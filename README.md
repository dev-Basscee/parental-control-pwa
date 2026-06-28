# Parental Control PWA

A local-first Progressive Web App (PWA) for blocking apps and monitoring activity on a Windows PC.

## Architecture

```
Browser (PWA)  ←→  server.js :3000  ←→  agent :3001
```

| Layer | What it does |
|---|---|
| **PWA** (`src/`) | React + Vite frontend, installable as a PWA |
| **Server** (`server.js`) | Serves the built PWA + proxies `/api/*` to the agent (never exposes the token to the browser) |
| **Agent** (`agent/src/`) | Node.js enforcement engine — scans processes, kills blocked apps, persists blocklist & event log |

## Prerequisites

- Node.js ≥ 18
- npm or pnpm

## Development

```bash
npm install          # install root deps
cd agent && npm install   # install agent deps
npm run dev          # starts agent + server + vite
```

Then open **http://localhost:5173**

## Production

```bash
npm run build        # build PWA into ./dist
node agent/src/index.js &   # start enforcement agent
node server.js       # start server (serves PWA + proxies API)
```

Then open **http://localhost:3000**

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start all three services concurrently (agent + server + vite) |
| `npm run build` | Build production PWA bundle into `./dist` |
| `npm start` | Start server only (assumes agent is already running) |
| `npm run agent` | Start enforcement agent only |

## Security

- The shared API token lives in `agent/data/api-token.txt` (auto-generated, never committed)
- `server.js` reads the token on every request and injects it as `X-API-Token` — the browser never sees it
- The agent only accepts connections from `127.0.0.1`
- PIN is stored as a local djb2 hash in `localStorage` — never sent to any server

## Data files

All runtime data lives in `agent/data/` and is excluded from git:

| File | Contents |
|---|---|
| `api-token.txt` | Shared secret between server and agent |
| `blocklist.json` | Active block entries |
| `events.json` | Event log (kills, blocks, expirations) |
