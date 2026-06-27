import { useEffect, useState } from 'react'

export function usePWA() {
  const [isInstalled, setIsInstalled] = useState(false)
  const [canInstall, setCanInstall] = useState(false)
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false)

  useEffect(() => {
    // Check if running as installed PWA
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
    const isIOSStandalone = (navigator as any).standalone === true
    setIsInstalled(isInStandaloneMode || isIOSStandalone)

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('[PWA] Service worker registered:', registration)
          setServiceWorkerReady(true)

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[PWA] New service worker available')
                  // Notify user about update
                  newWorker.postMessage({ type: 'SKIP_WAITING' })
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('[PWA] Service worker registration failed:', error)
        })
    }

    // Listen for install prompt
    let deferredPrompt: any
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      deferredPrompt = e
      setCanInstall(true)
    })

    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed')
      setIsInstalled(true)
      setCanInstall(false)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', () => {})
      window.removeEventListener('appinstalled', () => {})
    }
  }, [])

  const installApp = async () => {
    const event = window.matchMedia('(display-mode: standalone)').matches
    if (event) {
      console.log('[PWA] Already in standalone mode')
      return
    }

    // The install prompt will be triggered by browser
    // User needs to click install via browser UI
  }

  return {
    isInstalled,
    canInstall,
    serviceWorkerReady,
    installApp,
  }
}
