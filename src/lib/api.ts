import { hashPin } from './utils'

const API_BASE_URL = 'http://localhost:3001/api'

export interface BlockedApp {
  id: string
  name: string
  duration: number
  unlockedAt: number
  isBlocked: boolean
}

export interface ActivityLog {
  id: string
  timestamp: number
  event: 'block' | 'unblock' | 'login' | 'logout'
  app?: string
  details?: string
}

export interface InstalledApp {
  displayName: string
  processName: string
  icon?: string
  path?: string
}

// Mock data for development
const mockBlocklist: BlockedApp[] = []
const mockActivityLog: ActivityLog[] = []
let failedAttempts = 0
const MAX_ATTEMPTS = 3
let lockoutUntil = 0

export const api = {
  // Auth endpoints
  async verifyPin(pin: string): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      // Check if locked out
      if (lockoutUntil > Date.now()) {
        const remainingMs = lockoutUntil - Date.now()
        const remainingSeconds = Math.ceil(remainingMs / 1000)
        return {
          success: false,
          error: `Too many failed attempts. Try again in ${remainingSeconds}s`,
        }
      }

      // Mock verification against stored hash
      const storedHash = localStorage.getItem('pin_hash')
      if (!storedHash) {
        // First setup - store the PIN
        const hash = hashPin(pin)
        localStorage.setItem('pin_hash', hash)
        const token = Math.random().toString(36).substr(2)
        localStorage.setItem('auth_token', token)
        return { success: true, token }
      }

      // Verify PIN
      const hash = hashPin(pin)
      if (hash === storedHash) {
        failedAttempts = 0
        const token = Math.random().toString(36).substr(2)
        localStorage.setItem('auth_token', token)
        return { success: true, token }
      } else {
        failedAttempts++
        if (failedAttempts >= MAX_ATTEMPTS) {
          lockoutUntil = Date.now() + 5 * 60 * 1000 // 5 minute lockout
          return {
            success: false,
            error: 'Too many failed attempts. Try again in 5 minutes.',
          }
        }
        return {
          success: false,
          error: `Incorrect PIN. ${MAX_ATTEMPTS - failedAttempts} attempts remaining.`,
        }
      }
    } catch (error) {
      return { success: false, error: 'Verification failed' }
    }
  },

  // Blocklist endpoints
  async getBlocklist(): Promise<BlockedApp[]> {
    try {
      // Update expiration status for each blocked app
      const now = Date.now()
      mockBlocklist.forEach((app) => {
        app.isBlocked = now < app.unlockedAt
      })
      return mockBlocklist
    } catch (error) {
      console.error('[v0] Failed to get blocklist:', error)
      return []
    }
  },

  async addToBlocklist(appName: string, durationMinutes: number): Promise<BlockedApp | null> {
    try {
      const now = Date.now()
      const newApp: BlockedApp = {
        id: Math.random().toString(36).substr(2, 9),
        name: appName,
        duration: durationMinutes * 60 * 1000,
        unlockedAt: now + durationMinutes * 60 * 1000,
        isBlocked: true,
      }
      mockBlocklist.push(newApp)

      // Log activity
      mockActivityLog.push({
        id: Math.random().toString(36).substr(2, 9),
        timestamp: now,
        event: 'block',
        app: appName,
        details: `Blocked for ${durationMinutes} minutes`,
      })

      return newApp
    } catch (error) {
      console.error('[v0] Failed to add to blocklist:', error)
      return null
    }
  },

  async removeFromBlocklist(appId: string): Promise<boolean> {
    try {
      const index = mockBlocklist.findIndex((app) => app.id === appId)
      if (index > -1) {
        const app = mockBlocklist[index]
        mockBlocklist.splice(index, 1)

        // Log activity
        mockActivityLog.push({
          id: Math.random().toString(36).substr(2, 9),
          timestamp: Date.now(),
          event: 'unblock',
          app: app.name,
          details: 'Manually unblocked',
        })

        return true
      }
      return false
    } catch (error) {
      console.error('[v0] Failed to remove from blocklist:', error)
      return false
    }
  },

  // Activity log endpoints
  async getActivityLog(): Promise<ActivityLog[]> {
    try {
      return mockActivityLog.sort((a, b) => b.timestamp - a.timestamp)
    } catch (error) {
      console.error('[v0] Failed to get activity log:', error)
      return []
    }
  },

  // Installed apps endpoints
  async getInstalledApps(): Promise<InstalledApp[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/installed-apps`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch installed apps')
      }

      const apps = await response.json()
      return apps || []
    } catch (error) {
      console.error('[v0] Failed to get installed apps:', error)
      return []
    }
  },

  async getRunningProcesses(): Promise<{ name: string; pid: number }[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/running-processes`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch running processes')
      }

      const processes = await response.json()
      return processes || []
    } catch (error) {
      console.error('[v0] Failed to get running processes:', error)
      return []
    }
  },

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      // For now, always return true since we're using mock data
      return true
    } catch (error) {
      console.error('[v0] Health check failed:', error)
      return false
    }
  },
}
