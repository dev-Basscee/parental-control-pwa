/**
 * src/lib/api.ts
 *
 * In dev:  Vite proxies /api/* → http://localhost:3000/api/*
 * In prod (Vercel): frontend is on knoxs.vercel.app, agent runs locally on
 *   the child's PC at http://localhost:3000. Browsers allow HTTPS pages to
 *   fetch from localhost (treated as a trustworthy origin per W3C spec).
 *
 * The agent token is NEVER in the browser — server.js injects it server-side.
 */

import { hashPin } from './utils'

// In dev: use relative /api (Vite proxy handles it)
// In prod: call the local server directly — localhost is allowed from HTTPS
const API = import.meta.env.PROD
  ? 'http://localhost:3000/api'
  : '/api'

export const LOCAL_AGENT_URL = 'http://localhost:3000'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BlockedApp {
  id: string
  processName: string
  displayName: string
  blockType: 'indefinite' | 'until_timestamp'
  expiresAt: string | null
  createdAt: string
  timeRemaining?: number
}

export interface ActivityLog {
  id: string
  timestamp: string
  action: AgentAction
  processName: string
  displayName: string
  detail: string | null
}

export type AgentAction = 'block_added' | 'block_removed' | 'killed' | 'kill_failed' | 'expired'

export interface RunningProcess {
  name: string
  pid: number
  windowTitle: string | null
}

export interface InstalledApp {
  displayName: string
  processName: string
}

// ─── Auth (client-side PIN hash in localStorage) ─────────────────────────────

let _failedAttempts = 0
const MAX_ATTEMPTS  = 5
let _lockoutUntil   = 0

export const auth = {
  verifyPin (pin: string): { success: boolean; error?: string } {
    if (_lockoutUntil > Date.now()) {
      const secs = Math.ceil((_lockoutUntil - Date.now()) / 1000)
      return { success: false, error: `Too many failed attempts. Try again in ${secs}s.` }
    }
    const stored = localStorage.getItem('pin_hash')
    if (!stored) {
      localStorage.setItem('pin_hash', hashPin(pin))
      localStorage.setItem('auth_token', crypto.randomUUID())
      _failedAttempts = 0
      return { success: true }
    }
    if (hashPin(pin) === stored) {
      _failedAttempts = 0
      localStorage.setItem('auth_token', crypto.randomUUID())
      return { success: true }
    }
    _failedAttempts++
    if (_failedAttempts >= MAX_ATTEMPTS) {
      _lockoutUntil = Date.now() + 5 * 60 * 1000
      _failedAttempts = 0
      return { success: false, error: 'Too many failed attempts. Locked out for 5 minutes.' }
    }
    const left = MAX_ATTEMPTS - _failedAttempts
    return { success: false, error: `Incorrect PIN. ${left} attempt${left !== 1 ? 's' : ''} remaining.` }
  },
  logout ()              { localStorage.removeItem('auth_token') },
  isAuthenticated ()     { return !!localStorage.getItem('auth_token') },
  hasPin ()              { return !!localStorage.getItem('pin_hash') },
}

// ─── HTTP helper ──────────────────────────────────────────────────────────────

async function request<T> (path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

// ─── Agent API ────────────────────────────────────────────────────────────────

export const api = {
  async healthCheck (): Promise<{ ok: boolean; agentOnline: boolean }> {
    try {
      const d = await request<{ proxy: string; agent: { status: string } | string }>('/health')
      return { ok: true, agentOnline: typeof d.agent === 'object' && d.agent.status === 'ok' }
    } catch {
      return { ok: false, agentOnline: false }
    }
  },

  async getBlocklist (): Promise<BlockedApp[]> {
    return request<BlockedApp[]>('/blocklist')
  },

  async addToBlocklist (processName: string, displayName: string, durationMinutes: number): Promise<BlockedApp> {
    const body = durationMinutes === 0
      ? { processName, displayName, blockType: 'indefinite' }
      : { processName, displayName, blockType: 'until_timestamp',
          expiresAt: new Date(Date.now() + durationMinutes * 60_000).toISOString() }
    return request<BlockedApp>('/blocklist', { method: 'POST', body: JSON.stringify(body) })
  },

  async removeFromBlocklist (id: string): Promise<void> {
    await request<{ success: boolean }>(`/blocklist/${id}`, { method: 'DELETE' })
  },

  async getActivityLog (limit = 100): Promise<ActivityLog[]> {
    return request<ActivityLog[]>(`/logs?limit=${limit}`)
  },

  async getRunningProcesses (): Promise<RunningProcess[]> {
    return request<RunningProcess[]>('/processes')
  },

  async getInstalledApps (): Promise<InstalledApp[]> {
    return request<InstalledApp[]>('/installed-apps')
  },
}
