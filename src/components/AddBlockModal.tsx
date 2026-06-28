import { useState } from 'react'
import { X } from 'lucide-react'
import { AppSelector } from './AppSelector'

interface Props {
  isOpen: boolean
  onClose: () => void
  onAdd: (processName: string, displayName: string, durationMinutes: number) => void
}

const PRESETS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  { label: '4 hours', value: 240 },
  { label: 'Indefinite', value: 0 },
]

export function AddBlockModal ({ isOpen, onClose, onAdd }: Props) {
  const [selected, setSelected]     = useState<{ displayName: string; processName: string } | null>(null)
  const [duration, setDuration]     = useState(30)
  const [custom, setCustom]         = useState('')
  const [error, setError]           = useState('')
  const [busy, setBusy]             = useState(false)

  function reset () { setSelected(null); setDuration(30); setCustom(''); setError('') }

  async function handleSubmit (e: React.FormEvent) {
    e.preventDefault()
    if (!selected) { setError('Please select an app'); return }
    const mins = custom ? parseInt(custom, 10) : duration
    if (mins !== 0 && (!mins || mins < 1)) { setError('Invalid duration'); return }
    setBusy(true)
    try {
      await onAdd(selected.processName, selected.displayName, mins)
      reset()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to block app')
    } finally {
      setBusy(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full md:max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Block App</h2>
          <button onClick={() => { reset(); onClose() }} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <AppSelector selectedApp={selected?.displayName ?? ''} onAppSelect={setSelected} />

          {selected && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 text-sm">
              <span className="font-semibold text-blue-700">{selected.displayName}</span>
              <span className="text-blue-400 ml-2 font-mono text-xs">{selected.processName}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Duration</label>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((p) => (
                <button key={p.value} type="button"
                  onClick={() => { setDuration(p.value); setCustom('') }}
                  className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                    duration === p.value && !custom
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="custom-duration" className="block text-sm font-medium text-gray-600 mb-1">
              Custom (minutes)
            </label>
            <input id="custom-duration" type="number" min="1" placeholder="e.g. 90"
              value={custom}
              onChange={(e) => { setCustom(e.target.value); if (e.target.value) setDuration(-1) }}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {error && <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{error}</p>}

          <div className="flex gap-3">
            <button type="button" onClick={() => { reset(); onClose() }}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={busy || !selected}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl disabled:opacity-50">
              {busy ? 'Blocking…' : 'Block App'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
