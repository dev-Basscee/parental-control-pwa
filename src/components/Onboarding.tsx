import { useState } from 'react'
import { Lock, CheckCircle, ArrowRight } from 'lucide-react'
import { auth } from '@/lib/api'

interface Props { onComplete: () => void }
type Step = 'welcome' | 'create' | 'confirm' | 'success'

export function Onboarding ({ onComplete }: Props) {
  const [step, setStep]           = useState<Step>('welcome')
  const [pin, setPin]             = useState('')
  const [confirmPin, setConfirm]  = useState('')
  const [error, setError]         = useState('')
  const [busy, setBusy]           = useState(false)

  function validatePin (p: string) {
    if (p.length < 4) return 'PIN must be at least 4 digits'
    if (!/^\d+$/.test(p)) return 'PIN must contain only numbers'
    return null
  }

  function handleCreate () {
    const err = validatePin(pin)
    if (err) { setError(err); return }
    setError(''); setStep('confirm')
  }

  function handleConfirm () {
    if (pin !== confirmPin) { setError('PINs do not match'); setConfirm(''); return }
    setBusy(true)
    // Register PIN via auth module (stores hash + auth token)
    auth.verifyPin(pin)
    setTimeout(() => setStep('success'), 400)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-center">
          <div className="flex justify-center mb-3">
            <Lock className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Parental Control</h1>
          <p className="text-blue-100 mt-1">Set up your account</p>
        </div>

        {/* Steps */}
        <div className="p-8">

          {/* Welcome */}
          {step === 'welcome' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome</h2>
                <p className="text-gray-500">Create a PIN to protect access to this dashboard.</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 space-y-2">
                <h3 className="font-semibold text-gray-800">You will:</h3>
                <ul className="space-y-1.5 text-sm text-gray-600">
                  {['Create a 4‑6 digit PIN', 'Confirm your PIN', 'Access the dashboard'].map((t, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">{i + 1}</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => setStep('create')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Create PIN */}
          {step === 'create' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Create your PIN</h2>
                <p className="text-gray-500 text-sm">4‑6 digits</p>
              </div>
              <div>
                <input
                  id="pin-create"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="••••"
                  value={pin}
                  autoFocus
                  onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-center text-2xl tracking-widest"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{pin.length}/6</p>
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
              <button onClick={handleCreate} disabled={pin.length < 4}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors">
                Continue
              </button>
              <button onClick={() => { setStep('welcome'); setPin(''); setError('') }}
                className="w-full text-blue-600 font-medium py-1 text-sm">← Back</button>
            </div>
          )}

          {/* Confirm PIN */}
          {step === 'confirm' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Confirm your PIN</h2>
                <p className="text-gray-500 text-sm">Re-enter the same PIN</p>
              </div>
              <div>
                <input
                  id="pin-confirm"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="••••"
                  value={confirmPin}
                  autoFocus
                  onChange={(e) => { setConfirm(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-center text-2xl tracking-widest"
                />
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
              <button onClick={handleConfirm} disabled={confirmPin.length < 4 || busy}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors">
                {busy ? 'Creating…' : 'Create Account'}
              </button>
              <button onClick={() => { setStep('create'); setConfirm(''); setError('') }} disabled={busy}
                className="w-full text-blue-600 font-medium py-1 text-sm">← Back</button>
            </div>
          )}

          {/* Success */}
          {step === 'success' && (
            <div className="space-y-6 text-center">
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Account Created</h2>
                <p className="text-gray-500 text-sm">You can now block apps and monitor activity.</p>
              </div>
              <button onClick={onComplete}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="px-8 pb-6 flex gap-1.5">
          {(['welcome', 'create', 'confirm', 'success'] as Step[]).map((s, i) => {
            const steps: Step[] = ['welcome', 'create', 'confirm', 'success']
            const active = steps.indexOf(step) >= i
            return <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${active ? 'bg-blue-600' : 'bg-gray-200'}`} />
          })}
        </div>
      </div>
    </div>
  )
}
