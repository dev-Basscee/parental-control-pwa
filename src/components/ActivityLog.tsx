import { ActivityLog as LogEntry, AgentAction } from '@/lib/api'
import { Lock, LockOpen, Skull, AlertTriangle, Clock } from 'lucide-react'

function getMeta (action: AgentAction) {
  switch (action) {
    case 'block_added':   return { icon: <Lock className="w-4 h-4" />,          label: 'Blocked',        color: 'text-red-600',     bg: 'bg-red-50' }
    case 'block_removed': return { icon: <LockOpen className="w-4 h-4" />,      label: 'Unblocked',      color: 'text-emerald-600', bg: 'bg-emerald-50' }
    case 'killed':        return { icon: <Skull className="w-4 h-4" />,         label: 'Process Killed', color: 'text-red-700',     bg: 'bg-red-100' }
    case 'kill_failed':   return { icon: <AlertTriangle className="w-4 h-4" />, label: 'Kill Failed',    color: 'text-orange-600',  bg: 'bg-orange-50' }
    case 'expired':       return { icon: <Clock className="w-4 h-4" />,         label: 'Block Expired',  color: 'text-gray-500',    bg: 'bg-gray-100' }
    default:              return { icon: <Clock className="w-4 h-4" />,         label: action,           color: 'text-gray-500',    bg: 'bg-gray-100' }
  }
}

function ago (iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60)  return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  return new Date(iso).toLocaleDateString()
}

function friendlyDate (d: string): string {
  const today     = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86_400_000).toDateString()
  if (d === today)     return 'Today'
  if (d === yesterday) return 'Yesterday'
  return new Date(d).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
}

export function ActivityLogView ({ logs }: { logs: LogEntry[] }) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4">📋</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-1">No Activity Yet</h3>
        <p className="text-gray-400 text-sm">Events will appear here as the agent acts.</p>
      </div>
    )
  }

  // Group by calendar date
  const groups: Record<string, LogEntry[]> = {}
  for (const log of logs) {
    const d = new Date(log.timestamp).toDateString()
    ;(groups[d] ??= []).push(log)
  }

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([date, entries]) => (
        <div key={date}>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{friendlyDate(date)}</h3>
          <div className="space-y-2">
            {entries.map((log) => {
              const meta = getMeta(log.action)
              return (
                <div key={log.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-start gap-3 hover:border-gray-200 transition-colors">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${meta.bg} ${meta.color}`}>
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold ${meta.color}`}>{meta.label}</p>
                        <p className="text-sm text-gray-700 truncate">{log.displayName}</p>
                        {log.detail && <p className="text-xs text-gray-400 mt-0.5 truncate">{log.detail}</p>}
                      </div>
                      <p className="text-xs text-gray-400 flex-shrink-0">{ago(log.timestamp)}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
