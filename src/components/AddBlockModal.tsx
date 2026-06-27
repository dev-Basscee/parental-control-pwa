import { useState } from 'react'
import { X } from 'lucide-react'

interface AddBlockModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (appName: string, duration: number) => void
}

const PRESET_DURATIONS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  { label: 'Indefinite', value: 0 },
]

export function AddBlockModal({ isOpen, onClose, onAdd }: AddBlockModalProps) {
  const [appName, setAppName] = useState('')
  const [duration, setDuration] = useState(30)
  const [customDuration, setCustomDuration] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!appName.trim()) {
      setError('App name is required')
      return
    }

    const finalDuration = customDuration ? parseInt(customDuration) : duration
    if (duration !== 0 && (!finalDuration || finalDuration <= 0)) {
      setError('Duration must be greater than 0')
      return
    }

    onAdd(appName.trim(), finalDuration || 24 * 60) // Default to 24h if indefinite
    setAppName('')
    setDuration(30)
    setCustomDuration('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl md:rounded-xl w-full md:max-w-md shadow-xl animate-in fade-in slide-in-from-bottom-4 md:slide-in-from-bottom-0">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Block App</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* App Name */}
          <div>
            <label htmlFor="appName" className="block text-sm font-medium text-foreground mb-2">
              App Name
            </label>
            <input
              id="appName"
              type="text"
              placeholder="e.g., TikTok, Instagram, YouTube"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:border-blue-500 bg-white"
            />
          </div>

          {/* Duration Presets */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Duration</label>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_DURATIONS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => {
                    setDuration(preset.value)
                    setCustomDuration('')
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors ${
                    duration === preset.value && !customDuration
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-foreground hover:bg-gray-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Duration */}
          <div>
            <label htmlFor="customDuration" className="block text-sm font-medium text-foreground mb-2">
              Or enter custom duration (minutes)
            </label>
            <input
              id="customDuration"
              type="number"
              placeholder="Enter minutes"
              value={customDuration}
              onChange={(e) => {
                setCustomDuration(e.target.value)
                if (e.target.value) setDuration(0) // Clear preset selection
              }}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:border-blue-500 bg-white"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Block App
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
