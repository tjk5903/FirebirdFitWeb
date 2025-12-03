'use client'

/**
 * Detects if the app is running as a PWA (Progressive Web App)
 * in standalone mode (installed on home screen)
 */
export function isPWA(): boolean {
  if (typeof window === 'undefined') return false

  // Check for standalone display mode (standard PWA detection)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches

  // Check for fullscreen mode (also PWA)
  const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches

  // iOS Safari PWA detection
  const isIOSStandalone = 
    (window.navigator as any).standalone === true ||
    (window.navigator as any).standalone === false // false means not standalone, but we check for the property

  // Check if opened from home screen (iOS)
  const isIOSHomeScreen = 
    window.matchMedia('(display-mode: standalone)').matches ||
    ((window.navigator as any).standalone === true)

  // Check if in standalone mode via user agent (Android Chrome)
  const isAndroidStandalone = 
    window.matchMedia('(display-mode: standalone)').matches &&
    /Android/i.test(navigator.userAgent)

  return isStandalone || isFullscreen || isIOSStandalone || isAndroidStandalone
}

/**
 * Gets the current display mode
 */
export function getDisplayMode(): 'browser' | 'standalone' | 'fullscreen' | 'minimal-ui' {
  if (typeof window === 'undefined') return 'browser'

  if (window.matchMedia('(display-mode: standalone)').matches) return 'standalone'
  if (window.matchMedia('(display-mode: fullscreen)').matches) return 'fullscreen'
  if (window.matchMedia('(display-mode: minimal-ui)').matches) return 'minimal-ui'
  
  return 'browser'
}

