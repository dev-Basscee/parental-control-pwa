import { useState, useEffect } from 'react'
import { auth } from './lib/api'
import { Onboarding } from './components/Onboarding'
import { Login } from './components/Login'
import { Dashboard } from './components/Dashboard'

type View = 'loading' | 'onboarding' | 'login' | 'dashboard'

export default function App () {
  const [view, setView] = useState<View>('loading')

  useEffect(() => {
    if (!auth.hasPin()) setView('onboarding')
    else if (auth.isAuthenticated()) setView('dashboard')
    else setView('login')
  }, [])

  if (view === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      {view === 'onboarding' && (
        <Onboarding onComplete={() => setView('dashboard')} />
      )}
      {view === 'login' && (
        <Login onLogin={() => setView('dashboard')} />
      )}
      {view === 'dashboard' && (
        <Dashboard onLogout={() => { auth.logout(); setView('login') }} />
      )}
    </>
  )
}
