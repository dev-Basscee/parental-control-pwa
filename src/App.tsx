import { useState, useEffect } from 'react'
import { PinGate } from './components/PinGate'
import { Dashboard } from './components/Dashboard'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  // Check if user is already authenticated
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      setIsAuthenticated(true)
    }
    setLoading(false)
  }, [])

  const handleAuthenticated = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    setIsAuthenticated(false)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-background">Loading...</div>
  }

  return isAuthenticated ? (
    <Dashboard onLogout={handleLogout} />
  ) : (
    <PinGate onAuthenticated={handleAuthenticated} />
  )
}

export default App
