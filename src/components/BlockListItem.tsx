import { useState, useEffect } from 'react'
import { BlockedApp } from '@/lib/api'
import { X, Clock, Infinity } from 'lucide-react'

interface Props {
  app: BlockedApp
  onRemove: (id: string) => void
  agentOnline?: boolean
  isExpired?: boolean
}

function formatCountdown (secs: number): string {
  if (secs <= 0) return 'Expired'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}h ${m}m remaining`
  if (m > 0) return `${m}m ${s}s remaining`
  return `${s}s remaining`
}

export function BlockListItem ({ app, onRemove, agentOnline = true, isExpired = false }: Props) {
  const [secs, setSecs] = useState(app.timeRemaining ?? 0)

  useEffect(() => { if (app.timeRemaining !== undefined) setSecs(app.timeRemaining) }, [app.timeRemaining])

  useEffect(() => {
    if (app.blockType !== 'until_timestamp') return
    const t = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [app.blockType])

  const indefinite = app.blockType === 'indefinite'

  return (
    <div className={`bg-white border rounded-2xl p-4 flex items-center gap-3 shadow-sm transition-opacity ${
      isExpired ? 'opacity-40 border-gray-100' : 'border-gray-100 hover:border-blue-100'
    }`}>
      <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
        isExpired ? 'bg-gray-100' : indefinite ? 'bg-red-50' : 'bg-orange-50'
      }`}>
        {indefinite
          ? <Infinity className="w-5 h-5 text-red-500" />
          : <Clock className={`w-5 h-5 ${isExpired ? 'text-gray-400' : 'text-orange-500'}`} />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">{app.displayName}</p>
        <p className="text-xs text-gray-400 font-mono truncate">{app.processName}</p>
        <p className={`text-xs font-medium mt-0.5 ${
          isExpired ? 'text-gray-400' : indefinite ? 'text-red-500' :
          secs <= 60 ? 'text-orange-500' : 'text-blue-600'
        }`}>
          {indefinite ? 'Blocked indefinitely' : formatCountdown(secs)}
        </p>
      </div>

      <button
        onClick={() => onRemove(app.id)}
        disabled={!agentOnline}
        className="flex-shrink-0 p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label={`Unblock ${app.displayName}`}
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  )
}
