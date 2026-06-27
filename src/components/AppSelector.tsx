import { useState, useEffect, useRef } from 'react'
import { Search, ChevronDown, AlertCircle, Loader2 } from 'lucide-react'

interface App {
  displayName: string
  processName: string
  icon?: string
}

interface AppSelectorProps {
  selectedApp: string
  onAppSelect: (app: App) => void
  onManualInput?: (name: string) => void
  disabled?: boolean
}

export function AppSelector({
  selectedApp,
  onAppSelect,
  onManualInput,
  disabled = false,
}: AppSelectorProps) {
  const [apps, setApps] = useState<App[]>([])
  const [filteredApps, setFilteredApps] = useState<App[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [useManualInput, setUseManualInput] = useState(false)
  const [manualAppName, setManualAppName] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch installed apps
  useEffect(() => {
    fetchInstalledApps()
  }, [])

  // Handle click outside dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter apps based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredApps(apps)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredApps(
        apps.filter(
          (app) =>
            app.displayName.toLowerCase().includes(query) ||
            app.processName.toLowerCase().includes(query)
        )
      )
    }
  }, [searchQuery, apps])

  async function fetchInstalledApps() {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('http://localhost:3001/api/installed-apps')
      if (!response.ok) {
        throw new Error('Failed to fetch apps')
      }

      const data = await response.json()
      setApps(data || [])
      setFilteredApps(data || [])
    } catch (err) {
      console.warn('[AppSelector] Error fetching apps, using manual input mode', err)
      setError('Could not load app list. Using manual input.')
      setUseManualInput(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAppSelect = (app: App) => {
    onAppSelect(app)
    setSearchQuery('')
    setIsOpen(false)
  }

  const handleManualSubmit = () => {
    if (manualAppName.trim()) {
      onAppSelect({
        displayName: manualAppName,
        processName: manualAppName.endsWith('.exe')
          ? manualAppName
          : `${manualAppName}.exe`,
      })
      setManualAppName('')
      setSearchQuery('')
      setIsOpen(false)
      onManualInput?.(manualAppName)
    }
  }

  const selectedAppDisplay = selectedApp || 'Select an app...'

  if (useManualInput) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">
          App Name
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={manualAppName}
            onChange={(e) => setManualAppName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleManualSubmit()
              }
            }}
            placeholder="e.g., Chrome, Discord, TikTok"
            disabled={disabled}
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          />
          <button
            onClick={handleManualSubmit}
            disabled={!manualAppName.trim() || disabled}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Add
          </button>
        </div>
        {error && (
          <div className="flex gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">
        Select App
      </label>

      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled || isLoading}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-left text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 flex items-center justify-between"
        >
          <span className="truncate">{selectedAppDisplay}</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-input bg-background shadow-lg">
            <div className="border-b border-input p-2">
              <div className="flex items-center gap-2 rounded-md bg-muted px-2 py-1">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search apps..."
                  autoFocus
                  className="flex-1 bg-transparent text-sm outline-none placeholder-muted-foreground"
                />
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading apps...
                </div>
              ) : filteredApps.length > 0 ? (
                filteredApps.map((app) => (
                  <button
                    key={app.processName}
                    onClick={() => handleAppSelect(app)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted focus:outline-none focus:bg-muted"
                  >
                    <div className="font-medium text-foreground">
                      {app.displayName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {app.processName}
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No apps found
                </div>
              )}
            </div>

            {apps.length > 0 && (
              <div className="border-t border-input p-2">
                <button
                  onClick={() => {
                    setUseManualInput(true)
                    setIsOpen(false)
                  }}
                  className="w-full px-3 py-1 text-left text-xs text-muted-foreground hover:bg-muted rounded"
                >
                  Can&apos;t find your app? Enter manually
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="flex gap-2 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
