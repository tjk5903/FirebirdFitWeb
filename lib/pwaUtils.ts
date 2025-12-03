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

/**
 * Attempts to open the current URL in the installed PWA
 * This works by navigating to the same URL, which should open in the PWA if installed
 */
export function attemptOpenInPWA(currentUrl?: string): void {
  if (typeof window === 'undefined') return

  const url = currentUrl || window.location.href
  
  // Try to open in PWA by navigating to the same URL
  // On mobile devices, if the PWA is installed, this may prompt to open in the app
  window.location.href = url
}

/**
 * Checks if a URL is an internal link (same origin)
 */
export function isInternalLink(url: string): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    const urlObj = new URL(url, window.location.origin)
    return urlObj.origin === window.location.origin
  } catch {
    // If URL parsing fails, treat relative URLs as internal
    return !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('//')
  }
}

/**
 * Gets the pathname from a URL, handling both absolute and relative URLs
 */
export function getPathnameFromUrl(url: string): string | null {
  if (typeof window === 'undefined') return null
  
  try {
    const urlObj = new URL(url, window.location.origin)
    return urlObj.pathname
  } catch {
    // If URL parsing fails, try to extract pathname from relative URL
    const match = url.match(/^([^?#]*)/)
    return match ? match[1] : null
  }
}

/**
 * Checks if a link should be handled by the router (internal link)
 * or opened in browser (external link, mailto, tel, etc.)
 */
export function shouldUseRouter(href: string): boolean {
  if (!href || href === '#') return false
  
  // Don't intercept special protocols
  if (href.startsWith('mailto:') || 
      href.startsWith('tel:') || 
      href.startsWith('javascript:') ||
      href.startsWith('data:')) {
    return false
  }
  
  // Check if it's an internal link
  return isInternalLink(href)
}

