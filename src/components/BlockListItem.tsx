import { useState, useEffect } from 'react'
import { BlockedApp } from '@/lib/api'
import { X } from 'lucide-react'

interface BlockListItemProps {
  app: BlockedApp
  onRemove: (appId: string) => void
  isExpired?: boolean
}

export function BlockListItem({ app, onRemove, isExpired = false }: BlockListItemProps) {
  const [timeRemaining, setTimeRemaining] = useState('')

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now()
      const remaining = app.unlockedAt - now

      if (remaining <= 0) {
        setTimeRemaining('Expired')
        return
      }

      const minutes = Math.floor(remaining / 60000)
      const seconds = Math.floor((remaining % 60000) / 1000)

      if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s remaining`)
      } else {
        setTimeRemaining(`${seconds}s remaining`)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [app.unlockedAt])

  return (
    <div className={`bg-white border border-border rounded-lg p-4 flex items-center justify-between ${isExpired ? 'opacity-60' : ''}`}>
      <div className="flex-1">
        <h3 className="font-semibold text-foreground">{app.name}</h3>
        <p className={`text-sm ${isExpired ? 'text-muted' : 'text-blue-600 font-medium'}`}>
          {timeRemaining}
        </p>
      </div>
      <button
        onClick={() => onRemove(app.id)}
        className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
        aria-label="Remove block"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  )
}
