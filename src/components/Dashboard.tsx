import { useState, useEffect } from 'react'
import { api, BlockedApp, ActivityLog } from '@/lib/api'
import { Blocklist } from './Blocklist'
import { ActivityLogView } from './ActivityLog'
import { ConnectionStatus } from './ConnectionStatus'
import { LogoutButton } from './LogoutButton'
import { Shield } from 'lucide-react'

interface DashboardProps {
  onLogout: () => void
}

export function Dashboard({ onLogout }: DashboardProps) {
  const [blocklist, setBlocklist] = useState<BlockedApp[]>([])
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([])
  const [isConnected, setIsConnected] = useState(true)
  const [activeTab, setActiveTab] = useState<'blocklist' | 'activity'>('blocklist')
  const [loading, setLoading] = useState(true)

  // Fetch data on mount and set up polling
  useEffect(() => {
    const loadData = async () => {
      try {
        const isHealthy = await api.healthCheck()
        setIsConnected(isHealthy)

        const blocklistData = await api.getBlocklist()
        setBlocklist(blocklistData)

        const activityData = await api.getActivityLog()
        setActivityLog(activityData)
      } catch (error) {
        console.error('[v0] Failed to load data:', error)
        setIsConnected(false)
      } finally {
        setLoading(false)
      }
    }

    loadData()

    // Poll every 5 seconds for updates
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleBlocklistUpdate = async () => {
    try {
      const blocklistData = await api.getBlocklist()
      setBlocklist(blocklistData)

      const activityData = await api.getActivityLog()
      setActivityLog(activityData)
    } catch (error) {
      console.error('[v0] Failed to update blocklist:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Parental Control</h1>
          </div>
          <LogoutButton onLogout={onLogout} />
        </div>
      </header>

      {/* Connection Status */}
      <ConnectionStatus isConnected={isConnected} />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 pb-20">
        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab('blocklist')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'blocklist'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted hover:text-foreground'
            }`}
          >
            Blocked Apps
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'activity'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted hover:text-foreground'
            }`}
          >
            Activity Log
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'blocklist' && (
          <Blocklist blocklist={blocklist} onUpdate={handleBlocklistUpdate} />
        )}
        {activeTab === 'activity' && <ActivityLogView logs={activityLog} />}
      </main>
    </div>
  )
}
