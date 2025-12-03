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
 * Detects if the device is iOS (iPhone, iPad, iPod)
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false
  
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

/**
 * Checks if a PWA is likely installed on the device
 * This is a best-effort check since we can't directly detect PWA installation
 */
export function isPWALikelyInstalled(): boolean {
  if (typeof window === 'undefined') return false
  
  // If we're already in PWA mode, it's definitely installed
  if (isPWA()) return true
  
  // On iOS, if standalone property exists, PWA might be installed
  // (though this property exists even when not installed)
  if (isIOS() && (window.navigator as any).standalone !== undefined) {
    // We can't be 100% sure, but if the property exists, it's possible
    return true
  }
  
  // For Android, check if display-mode media query is supported
  // If it is, we can check if standalone mode is available
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true
  }
  
  return false
}

/**
 * Attempts to open the current URL in the installed PWA using multiple methods
 * This works by trying different techniques to open the PWA from the browser
 */
export function attemptOpenInPWA(currentUrl?: string): boolean {
  if (typeof window === 'undefined') return false

  const url = currentUrl || window.location.href
  
  // Method 1: Try window.open() - sometimes works better on iOS
  try {
    const newWindow = window.open(url, '_blank')
    if (newWindow) {
      // If window.open succeeded, close current window after a delay
      setTimeout(() => {
        window.close()
      }, 100)
      return true
    }
  } catch (e) {
    console.log('window.open() failed, trying next method')
  }
  
  // Method 2: Try window.location.replace() - preserves history better
  try {
    window.location.replace(url)
    return true
  } catch (e) {
    console.log('window.location.replace() failed, trying next method')
  }
  
  // Method 3: Fallback to window.location.href
  try {
    window.location.href = url
    return true
  } catch (e) {
    console.error('All methods to open PWA failed')
    return false
  }
}

/**
 * Attempts to open PWA with multiple retries and different methods
 * Returns true if any method appears to have worked
 */
export function attemptOpenInPWAWithRetry(currentUrl?: string, maxRetries: number = 3): boolean {
  if (typeof window === 'undefined') return false

  const url = currentUrl || window.location.href
  
  for (let i = 0; i < maxRetries; i++) {
    if (attemptOpenInPWA(url)) {
      return true
    }
    // Small delay between retries
    if (i < maxRetries - 1) {
      setTimeout(() => {}, 100)
    }
  }
  
  return false
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
 * Checks if a URL is an authentication callback route
 */
export function isAuthCallbackRoute(url: string): boolean {
  const pathname = getPathnameFromUrl(url)
  return pathname === '/auth/callback' || url.includes('/auth/callback')
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

/**
 * Session Transfer Mechanism
 * Used to transfer authentication state from browser to PWA on iOS
 */

const SESSION_TRANSFER_KEY = 'pwa_session_transfer'
const SESSION_TRANSFER_TIMEOUT = 5 * 60 * 1000 // 5 minutes

/**
 * Marks that a session transfer is needed (auth happened in browser)
 */
export function markSessionTransferNeeded(): void {
  if (typeof window === 'undefined') return
  
  const transferData = {
    timestamp: Date.now(),
    url: window.location.href,
    pathname: window.location.pathname
  }
  
  try {
    localStorage.setItem(SESSION_TRANSFER_KEY, JSON.stringify(transferData))
    console.log('✅ Session transfer marked as needed')
  } catch (e) {
    console.error('Failed to mark session transfer:', e)
  }
}

/**
 * Checks if a session transfer is pending and returns the data
 * Returns null if no transfer is needed or if it expired
 */
export function getSessionTransferData(): { url: string; pathname: string } | null {
  if (typeof window === 'undefined') return null
  
  try {
    const data = localStorage.getItem(SESSION_TRANSFER_KEY)
    if (!data) return null
    
    const transferData = JSON.parse(data)
    const age = Date.now() - transferData.timestamp
    
    // Check if transfer data is expired
    if (age > SESSION_TRANSFER_TIMEOUT) {
      localStorage.removeItem(SESSION_TRANSFER_KEY)
      return null
    }
    
    return {
      url: transferData.url,
      pathname: transferData.pathname
    }
  } catch (e) {
    console.error('Failed to get session transfer data:', e)
    return null
  }
}

/**
 * Clears the session transfer flag (called when PWA successfully receives the session)
 */
export function clearSessionTransfer(): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(SESSION_TRANSFER_KEY)
    console.log('✅ Session transfer cleared')
  } catch (e) {
    console.error('Failed to clear session transfer:', e)
  }
}

/**
 * Checks if we're in browser mode and PWA is likely installed
 * This helps determine if we should attempt to transfer to PWA
 */
export function shouldAttemptPWATransfer(): boolean {
  if (typeof window === 'undefined') return false
  
  // Only attempt if we're in browser mode (not PWA)
  if (isPWA()) return false
  
  // Only attempt on iOS (where this is a common issue)
  if (!isIOS()) return false
  
  // Check if PWA is likely installed
  return isPWALikelyInstalled()
}

