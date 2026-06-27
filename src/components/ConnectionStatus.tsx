interface ConnectionStatusProps {
  isConnected: boolean
}

export function ConnectionStatus({ isConnected }: ConnectionStatusProps) {
  if (isConnected) return null

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center gap-2">
        <div className="flex-shrink-0 w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
        <p className="text-sm text-yellow-800">
          Connection to backend lost. Using cached data. Some features may be limited.
        </p>
      </div>
    </div>
  )
}
