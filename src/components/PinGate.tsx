import { useState } from 'react'
import { api } from '@/lib/api'
import { Lock } from 'lucide-react'

interface PinGateProps {
  onAuthenticated: () => void
}

export function PinGate({ onAuthenticated }: PinGateProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (pin.length < 4) {
      setError('PIN must be at least 4 digits')
      setLoading(false)
      return
    }

    const result = await api.verifyPin(pin)
    if (result.success) {
      onAuthenticated()
    } else {
      setError(result.error || 'Verification failed')
      setPin('')
    }
    setLoading(false)
  }

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6)
    setPin(value)
    if (error) setError('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 p-4 rounded-full">
                <Lock className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Parental Control</h1>
            <p className="text-muted text-sm">Enter your PIN to continue</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-foreground mb-2">
                PIN Code
              </label>
              <input
                id="pin"
                type="password"
                inputMode="numeric"
                placeholder="••••"
                value={pin}
                onChange={handlePinChange}
                disabled={loading}
                className="w-full px-4 py-3 text-center text-2xl font-mono border-2 border-border rounded-lg focus:outline-none focus:border-blue-500 bg-white"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || pin.length < 4}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
            >
              {loading ? 'Verifying...' : 'Unlock'}
            </button>
          </form>

          {/* Info */}
          <div className="text-center text-xs text-muted">
            This is a parental control application. You must enter the correct PIN to access the dashboard.
          </div>
        </div>
      </div>
    </div>
  )
}
