import { useState } from 'react'
import { Lock, CheckCircle, ArrowRight } from 'lucide-react'

interface OnboardingProps {
  onComplete: (pin: string) => void
}

type Step = 'welcome' | 'create' | 'confirm' | 'success'

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<Step>('welcome')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleCreatePin = () => {
    setError('')
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits')
      return
    }
    if (pin.length > 6) {
      setError('PIN must be 6 digits or less')
      return
    }
    if (!/^\d+$/.test(pin)) {
      setError('PIN must contain only numbers')
      return
    }
    setStep('confirm')
  }

  const handleConfirmPin = () => {
    setError('')
    if (pin !== confirmPin) {
      setError('PINs do not match')
      setConfirmPin('')
      return
    }
    setIsLoading(true)
    setTimeout(() => {
      setStep('success')
    }, 500)
  }

  const handleSuccess = () => {
    onComplete(pin)
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
          <p className="text-blue-100 mt-2">Set up your account</p>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Welcome Step */}
          {step === 'welcome' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-3">Welcome</h2>
                <p className="text-muted-foreground text-lg">
                  Set up your parental control account with a secure PIN. This PIN will protect access to your dashboard and app blocking settings.
                </p>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-foreground">What you'll do:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 text-xs">1</span>
                    <span>Create a 4-6 digit PIN</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 text-xs">2</span>
                    <span>Confirm your PIN</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 text-xs">3</span>
                    <span>Access your dashboard</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => setStep('create')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Create PIN Step */}
          {step === 'create' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Create Your PIN</h2>
                <p className="text-muted-foreground">Choose a 4-6 digit PIN</p>
              </div>

              <div>
                <label htmlFor="pin-create" className="block text-sm font-medium text-foreground mb-2">
                  PIN
                </label>
                <input
                  id="pin-create"
                  type="password"
                  inputMode="numeric"
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '')
                    setPin(val.slice(0, 6))
                    setError('')
                  }}
                  maxLength={6}
                  className="w-full px-4 py-3 border-2 border-border rounded-lg focus:outline-none focus:border-blue-500 text-center text-2xl tracking-widest bg-white"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {pin.length}/6 digits
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleCreatePin}
                disabled={pin.length < 4}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Continue
              </button>

              <button
                onClick={() => {
                  setStep('welcome')
                  setPin('')
                  setError('')
                }}
                className="w-full text-blue-600 hover:text-blue-700 font-semibold py-2"
              >
                Back
              </button>
            </div>
          )}

          {/* Confirm PIN Step */}
          {step === 'confirm' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Confirm Your PIN</h2>
                <p className="text-muted-foreground">Re-enter your PIN to confirm</p>
              </div>

              <div>
                <label htmlFor="pin-confirm" className="block text-sm font-medium text-foreground mb-2">
                  PIN Confirmation
                </label>
                <input
                  id="pin-confirm"
                  type="password"
                  inputMode="numeric"
                  placeholder="••••"
                  value={confirmPin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '')
                    setConfirmPin(val.slice(0, 6))
                    setError('')
                  }}
                  maxLength={6}
                  className="w-full px-4 py-3 border-2 border-border rounded-lg focus:outline-none focus:border-blue-500 text-center text-2xl tracking-widest bg-white"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {confirmPin.length}/6 digits
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleConfirmPin}
                disabled={confirmPin.length < 4 || isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>

              <button
                onClick={() => {
                  setStep('create')
                  setConfirmPin('')
                  setError('')
                }}
                disabled={isLoading}
                className="w-full text-blue-600 hover:text-blue-700 font-semibold py-2 disabled:text-gray-300"
              >
                Back
              </button>
            </div>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <div className="space-y-6 animate-fade-in text-center">
              <div className="flex justify-center">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Account Created</h2>
                <p className="text-muted-foreground">
                  Your parental control account is ready. You can now start blocking apps.
                </p>
              </div>

              <button
                onClick={handleSuccess}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Progress Indicator */}
        <div className="px-8 pb-6 flex gap-2">
          <div className={`h-1 flex-1 rounded-full transition-colors ${step === 'welcome' || step === 'create' || step === 'confirm' || step === 'success' ? 'bg-blue-600' : 'bg-gray-200'}`} />
          <div className={`h-1 flex-1 rounded-full transition-colors ${step === 'create' || step === 'confirm' || step === 'success' ? 'bg-blue-600' : 'bg-gray-200'}`} />
          <div className={`h-1 flex-1 rounded-full transition-colors ${step === 'confirm' || step === 'success' ? 'bg-blue-600' : 'bg-gray-200'}`} />
          <div className={`h-1 flex-1 rounded-full transition-colors ${step === 'success' ? 'bg-blue-600' : 'bg-gray-200'}`} />
        </div>
      </div>
    </div>
  )
}
