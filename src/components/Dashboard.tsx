import { useState, useEffect, useCallback } from 'react'
import { Shield, RefreshCw } from 'lucide-react'
import { api, BlockedApp, ActivityLog } from '@/lib/api'
import { Blocklist } from './Blocklist'
import { ActivityLogView } from './ActivityLog'
import { ConnectionStatus } from './ConnectionStatus'
import { LogoutButton } from './LogoutButton'

interface Props { onLogout: () => void }
type AgentStatus = 'online' | 'offline' | 'checking'

export function Dashboard ({ onLogout }: Props) {
  const [blocklist, setBlocklist]     = useState<BlockedApp[]>([])
  const [logs, setLogs]               = useState<ActivityLog[]>([])
  const [status, setStatus]           = useState<AgentStatus>('checking')
  const [tab, setTab]                 = useState<'blocklist' | 'activity'>('blocklist')
  const [loading, setLoading]         = useState(true)
  const [refreshing, setRefreshing]   = useState(false)

  const loadData = useCallback(async () => {
    try {
      const health = await api.healthCheck()
      setStatus(health.agentOnline ? 'online' : 'offline')

      const [bl, lg] = await Promise.allSettled([api.getBlocklist(), api.getActivityLog()])
      if (bl.status === 'fulfilled') setBlocklist(bl.value)
      if (lg.status === 'fulfilled') setLogs(lg.value)
    } catch {
      setStatus('offline')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    const t = setInterval(loadData, 5000)
    return () => clearInterval(t)
  }, [loadData])

  const todayEvents = logs.filter((l) =>
    new Date(l.timestamp).toDateString() === new Date().toDateString()
  ).length

  const activeBlocks = blocklist.filter(
    (a) => a.blockType === 'indefinite' || (a.timeRemaining !== undefined && a.timeRemaining > 0)
  ).length

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto mb-6 w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-blue-500/30" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-400 animate-spin" />
          </div>
          <p className="text-blue-200 font-medium">Connecting to agent…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 to-indigo-900 shadow-lg sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-400/20 border border-blue-400/30 p-2 rounded-xl">
              <Shield className="w-5 h-5 text-blue-200" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-none">Parental Control</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  status === 'online' ? 'bg-emerald-400' :
                  status === 'offline' ? 'bg-red-400 animate-pulse' :
                  'bg-yellow-400 animate-pulse'}`} />
                <span className="text-blue-300 text-xs">
                  {status === 'online' ? 'Agent online' : status === 'offline' ? 'Agent offline' : 'Checking…'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setRefreshing(true); loadData() }}
              disabled={refreshing}
              className="p-2 rounded-xl text-blue-300 hover:bg-white/10 transition-colors disabled:opacity-40"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <LogoutButton onLogout={onLogout} />
          </div>
        </div>
      </header>

      <ConnectionStatus agentStatus={status} />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Active Blocks</p>
            <p className="text-3xl font-bold text-blue-600">{activeBlocks}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Events Today</p>
            <p className="text-3xl font-bold text-indigo-600">{todayEvents}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1">
          {(['blocklist', 'activity'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                tab === t ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'blocklist' ? 'Blocked Apps' : 'Activity Log'}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === 'blocklist' && (
          <Blocklist blocklist={blocklist} agentOnline={status === 'online'} onUpdate={loadData} />
        )}
        {tab === 'activity' && <ActivityLogView logs={logs} />}

      </main>
    </div>
  )
}
