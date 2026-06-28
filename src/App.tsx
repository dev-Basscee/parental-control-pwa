import { useState, useEffect, useCallback } from 'react'
import { auth, api } from './lib/api'
import { Onboarding } from './components/Onboarding'
import { Login } from './components/Login'
import { Dashboard } from './components/Dashboard'
import { AgentSetup } from './components/AgentSetup'

type View = 'loading' | 'setup' | 'onboarding' | 'login' | 'dashboard'

export default function App () {
  const [view, setView] = useState<View>('loading')

  const init = useCallback(async () => {
    setView('loading')
    const health = await api.healthCheck()
    
    // If agent is not online, show the installer screen
    if (!health.agentOnline) {
      setView('setup')
      return
    }

    // Normal routing
    if (!auth.hasPin()) setView('onboarding')
    else if (auth.isAuthenticated()) setView('dashboard')
    else setView('login')
  }, [])

  useEffect(() => {
    init()
  }, [init])

  if (view === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      {view === 'setup' && (
        <AgentSetup 
          onCheckAgain={init} 
          onSkip={() => {
            if (!auth.hasPin()) setView('onboarding')
            else if (auth.isAuthenticated()) setView('dashboard')
            else setView('login')
          }}
        />
      )}
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
