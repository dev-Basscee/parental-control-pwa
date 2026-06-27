import { useState, useEffect } from 'react'
import { Onboarding } from './components/Onboarding'
import { Login } from './components/Login'
import { Dashboard } from './components/Dashboard'

type AppState = 'onboarding' | 'login' | 'dashboard'

function App() {
  const [appState, setAppState] = useState<AppState>('login')
  const [loading, setLoading] = useState(true)

  // Check if user is already authenticated
  useEffect(() => {
    const pinHash = localStorage.getItem('pin_hash')
    const authToken = localStorage.getItem('auth_token')

    if (!pinHash) {
      // First-time user - show onboarding
      setAppState('onboarding')
    } else if (authToken) {
      // Returning user who is already logged in - show dashboard
      setAppState('dashboard')
    } else {
      // Returning user who needs to log in - show login
      setAppState('login')
    }

    setLoading(false)
  }, [])

  const handleOnboardingComplete = (pin: string) => {
    // Store PIN hash (in production, use proper bcrypt hashing)
    const pinHash = btoa(pin)
    localStorage.setItem('pin_hash', pinHash)
    localStorage.setItem('auth_token', 'authenticated')
    setAppState('dashboard')
  }

  const handleLogin = (pin: string) => {
    // PIN is already verified by Login component
    localStorage.setItem('auth_token', 'authenticated')
    localStorage.removeItem('pin_attempts')
    localStorage.removeItem('pin_lock')
    setAppState('dashboard')
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('pin_attempts')
    setAppState('login')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full" />
          </div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {appState === 'onboarding' && <Onboarding key="onboarding" onComplete={handleOnboardingComplete} />}
      {appState === 'login' && <Login key="login" onLogin={handleLogin} />}
      {appState === 'dashboard' && <Dashboard key="dashboard" onLogout={handleLogout} />}
    </>
  )
}

export default App
