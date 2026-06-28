import { useState } from 'react'
import { Lock } from 'lucide-react'
import { auth } from '@/lib/api'

interface Props { onLogin: () => void }

export function Login ({ onLogin }: Props) {
  const [pin, setPin]         = useState('')
  const [error, setError]     = useState('')
  const [locked, setLocked]   = useState(false)
  const [lockSecs, setLock]   = useState(0)

  function handleSubmit (e: React.FormEvent) {
    e.preventDefault()
    if (locked || !pin) return

    const result = auth.verifyPin(pin)
    setPin('')

    if (result.success) {
      onLogin()
    } else {
      setError(result.error ?? 'Incorrect PIN')
      if (result.error?.includes('Locked out')) {
        setLocked(true)
        setLock(300)
        const t = setInterval(() => setLock((s) => {
          if (s <= 1) { setLocked(false); clearInterval(t); return 0 }
          return s - 1
        }), 1000)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-center">
          <Lock className="w-12 h-12 text-white mx-auto mb-3" />
          <h1 className="text-3xl font-bold text-white">Parental Control</h1>
          <p className="text-blue-100 mt-1">Enter your PIN to unlock</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div>
            <label htmlFor="pin-login" className="block text-sm font-medium text-gray-700 mb-1.5">
              PIN
            </label>
            <input
              id="pin-login"
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter your PIN"
              value={pin}
              autoFocus
              disabled={locked}
              onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-center text-3xl tracking-widest disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>

          {error && (
            <div className={`text-sm px-4 py-3 rounded-xl border ${locked
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-red-50 border-red-100 text-red-700'}`}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={locked || pin.length < 4}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors disabled:cursor-not-allowed"
          >
            {locked ? `Locked (${lockSecs}s)` : 'Unlock'}
          </button>

          <button
            type="button"
            onClick={() => { localStorage.clear(); window.location.reload() }}
            className="w-full text-gray-500 hover:text-gray-700 text-sm font-medium py-1"
          >
            Reset account
          </button>
        </form>

        <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            Locked out after {5} failed attempts for 5 minutes.
          </p>
        </div>
      </div>
    </div>
  )
}
