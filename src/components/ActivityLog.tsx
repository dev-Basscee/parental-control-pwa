import { ActivityLog as ActivityLogType } from '@/lib/api'
import { formatDistanceToNow } from '@/lib/dateUtils'
import { Lock, LockOpen, LogIn, LogOut } from 'lucide-react'

interface ActivityLogViewProps {
  logs: ActivityLogType[]
}

export function ActivityLogView({ logs }: ActivityLogViewProps) {
  const getEventIcon = (event: string) => {
    switch (event) {
      case 'block':
        return <Lock className="w-5 h-5 text-red-500" />
      case 'unblock':
        return <LockOpen className="w-5 h-5 text-green-500" />
      case 'login':
        return <LogIn className="w-5 h-5 text-blue-500" />
      case 'logout':
        return <LogOut className="w-5 h-5 text-gray-500" />
      default:
        return <div className="w-5 h-5" />
    }
  }

  const getEventLabel = (event: string) => {
    switch (event) {
      case 'block':
        return 'Blocked'
      case 'unblock':
        return 'Unblocked'
      case 'login':
        return 'Login'
      case 'logout':
        return 'Logout'
      default:
        return event
    }
  }

  const getEventColor = (event: string) => {
    switch (event) {
      case 'block':
        return 'text-red-600'
      case 'unblock':
        return 'text-green-600'
      case 'login':
        return 'text-blue-600'
      case 'logout':
        return 'text-gray-600'
      default:
        return 'text-foreground'
    }
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <span className="text-2xl">📋</span>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No Activity</h3>
        <p className="text-muted text-sm">Activity logs will appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <div key={log.id} className="bg-white border border-border rounded-lg p-4 flex gap-4">
          <div className="flex-shrink-0 mt-1">{getEventIcon(log.event)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className={`font-semibold ${getEventColor(log.event)}`}>
                  {getEventLabel(log.event)}
                  {log.app && ` - ${log.app}`}
                </p>
                {log.details && <p className="text-sm text-muted mt-1">{log.details}</p>}
              </div>
              <p className="text-xs text-muted flex-shrink-0">
                {formatDistanceToNow(log.timestamp)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
