import { useState, useEffect, useRef } from 'react'
import { Search, ChevronDown, Loader2 } from 'lucide-react'
import { api, InstalledApp } from '@/lib/api'

interface SelectedApp { displayName: string; processName: string }

interface Props {
  selectedApp: string
  onAppSelect: (app: SelectedApp) => void
}

export function AppSelector ({ selectedApp, onAppSelect }: Props) {
  const [apps, setApps]           = useState<SelectedApp[]>([])
  const [filtered, setFiltered]   = useState<SelectedApp[]>([])
  const [query, setQuery]         = useState('')
  const [open, setOpen]           = useState(false)
  const [loading, setLoading]     = useState(true)
  const [manual, setManual]       = useState(false)
  const [manualVal, setManualVal] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  // Load app list on mount
  useEffect(() => {
    async function load () {
      try {
        const [running, installed] = await Promise.allSettled([
          api.getRunningProcesses(),
          api.getInstalledApps(),
        ])

        const map = new Map<string, SelectedApp>()

        // Installed apps first (have better display names)
        if (installed.status === 'fulfilled') {
          for (const a of installed.value) map.set(a.processName.toLowerCase(), a)
        }

        // Running processes — fill in any not in installed list
        if (running.status === 'fulfilled') {
          for (const p of running.value) {
            const key = p.name.toLowerCase()
            if (!map.has(key)) {
              map.set(key, {
                processName: p.name,
                displayName: p.windowTitle || p.name.replace(/\.exe$/i, '').replace(/[-_]/g, ' '),
              })
            }
          }
        }

        const list = [...map.values()].sort((a, b) => a.displayName.localeCompare(b.displayName))
        setApps(list)
        setFiltered(list)
        if (list.length === 0) setManual(true)
      } catch {
        setManual(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Filter on query change
  useEffect(() => {
    const q = query.toLowerCase()
    setFiltered(q ? apps.filter((a) =>
      a.displayName.toLowerCase().includes(q) || a.processName.toLowerCase().includes(q)
    ) : apps)
  }, [query, apps])

  // Close on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  if (manual) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">App Name</label>
        <div className="flex gap-2">
          <input type="text" placeholder="e.g. Chrome, Discord, Roblox"
            value={manualVal}
            onChange={(e) => setManualVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault()
              if (manualVal.trim()) {
                const name = manualVal.trim()
                onAppSelect({ displayName: name, processName: name.endsWith('.exe') ? name : `${name}.exe` })
                setManualVal('')
              }
            }}}
            className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="button" onClick={() => {
            if (manualVal.trim()) {
              const name = manualVal.trim()
              onAppSelect({ displayName: name, processName: name.endsWith('.exe') ? name : `${name}.exe` })
              setManualVal('')
            }
          }} className="rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500">Set</button>
        </div>
        {apps.length > 0 && (
          <button type="button" onClick={() => setManual(false)} className="text-xs text-blue-600 hover:underline">
            ← Back to app list
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">Select App</label>
      <div ref={ref} className="relative">
        <button type="button" id="app-selector-btn" onClick={() => setOpen(!open)} disabled={loading}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-left text-sm flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
          <span className={selectedApp ? 'text-gray-900' : 'text-gray-400'}>
            {loading ? 'Loading apps…' : (selectedApp || 'Choose an app…')}
          </span>
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            : <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />}
        </button>

        {open && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden">
            <div className="p-2 border-b border-gray-100">
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-2.5 py-1.5">
                <Search className="w-3.5 h-3.5 text-gray-400" />
                <input type="text" placeholder="Search…" autoFocus value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400" />
              </div>
            </div>
            <div className="max-h-52 overflow-y-auto">
              {filtered.length > 0 ? filtered.map((app) => (
                <button key={app.processName} type="button"
                  onClick={() => { onAppSelect(app); setQuery(''); setOpen(false) }}
                  className="w-full px-4 py-2.5 text-left hover:bg-blue-50 transition-colors">
                  <p className="text-sm font-medium text-gray-900">{app.displayName}</p>
                  <p className="text-xs text-gray-400 font-mono">{app.processName}</p>
                </button>
              )) : (
                <p className="p-4 text-sm text-gray-400 text-center">No matches</p>
              )}
            </div>
            <div className="border-t border-gray-100 p-2">
              <button type="button" onClick={() => { setManual(true); setOpen(false) }}
                className="w-full px-3 py-1.5 text-left text-xs text-gray-400 hover:bg-gray-50 rounded-lg">
                Can't find your app? Enter manually →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
