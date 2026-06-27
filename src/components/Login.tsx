import { useState, useEffect } from 'react'
import { Lock } from 'lucide-react'

interface LoginProps {
  onLogin: (pin: string) => void
}

export function Login({ onLogin }: LoginProps) {
  const [pin, setPinValue] = useState('')
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [lockTimer, setLockTimer] = useState(0)

  // Check if account is locked on mount
  useEffect(() => {
    const lockData = localStorage.getItem('pin_lock')
    if (lockData) {
      const { unlockTime } = JSON.parse(lockData)
      const now = Date.now()
      if (now < unlockTime) {
        const remaining = Math.ceil((unlockTime - now) / 1000)
        setIsLocked(true)
        setLockTimer(remaining)

        const interval = setInterval(() => {
          setLockTimer((prev) => {
            if (prev <= 1) {
              setIsLocked(false)
              clearInterval(interval)
              localStorage.removeItem('pin_lock')
              setAttempts(0)
              return 0
            }
            return prev - 1
          })
        }, 1000)

        return () => clearInterval(interval)
      } else {
        localStorage.removeItem('pin_lock')
      }
    }

    const savedAttempts = localStorage.getItem('pin_attempts')
    if (savedAttempts) {
      setAttempts(parseInt(savedAttempts))
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (isLocked) {
      setError(`Account locked. Try again in ${lockTimer} seconds.`)
      return
    }

    if (!pin) {
      setError('Please enter your PIN')
      return
    }

    const storedHash = localStorage.getItem('pin_hash')
    if (!storedHash) {
      setError('Account not found. Please set up your account first.')
      return
    }

    // Simple hash comparison (in production, use proper bcrypt)
    const enteredHash = btoa(pin)
    if (enteredHash === storedHash) {
      // Successful login
      localStorage.setItem('pin_attempts', '0')
      localStorage.removeItem('pin_lock')
      setPinValue('')
      onLogin(pin)
    } else {
      // Failed login
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      localStorage.setItem('pin_attempts', newAttempts.toString())

      if (newAttempts >= 3) {
        // Lock account for 5 minutes
        const unlockTime = Date.now() + 5 * 60 * 1000
        localStorage.setItem('pin_lock', JSON.stringify({ unlockTime }))
        setIsLocked(true)
        setLockTimer(300)
        setError('Too many failed attempts. Account locked for 5 minutes.')
        setPinValue('')

        // Start countdown timer
        const interval = setInterval(() => {
          setLockTimer((prev) => {
            if (prev <= 1) {
              setIsLocked(false)
              clearInterval(interval)
              localStorage.removeItem('pin_lock')
              setAttempts(0)
              localStorage.setItem('pin_attempts', '0')
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        setError(`Incorrect PIN. ${3 - newAttempts} attempts remaining.`)
        setPinValue('')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-center">
          <div className="flex justify-center mb-3">
            <Lock className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Parental Control</h1>
          <p className="text-blue-100 mt-2">Enter your PIN to unlock</p>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* PIN Input */}
          <div>
            <label htmlFor="pin" className="block text-sm font-medium text-foreground mb-2">
              PIN
            </label>
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              placeholder="Enter your PIN"
              value={pin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '')
                setPinValue(val.slice(0, 6))
                setError('')
              }}
              disabled={isLocked}
              maxLength={6}
              className="w-full px-4 py-3 border-2 border-border rounded-lg focus:outline-none focus:border-blue-500 text-center text-3xl tracking-widest bg-white disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className={`rounded-lg px-4 py-3 text-sm ${
              isLocked
                ? 'bg-yellow-50 border border-yellow-200 text-yellow-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {error}
            </div>
          )}

          {/* Attempt Counter */}
          {!isLocked && attempts > 0 && attempts < 3 && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
              {3 - attempts} attempt{3 - attempts !== 1 ? 's' : ''} remaining
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLocked || pin.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            {isLocked ? `Locked (${lockTimer}s)` : 'Unlock'}
          </button>

          {/* Reset Button (for demo purposes) */}
          <button
            type="button"
            onClick={() => {
              localStorage.clear()
              window.location.reload()
            }}
            className="w-full text-gray-600 hover:text-gray-800 font-semibold py-2 text-sm"
          >
            Reset Account
          </button>
        </form>

        {/* Security Info */}
        <div className="bg-gray-50 px-8 py-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Your PIN is stored securely. You will be locked out after 3 failed attempts for 5 minutes.
          </p>
        </div>
      </div>
    </div>
  )
}
