'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { shouldUseRouter, getPathnameFromUrl, isAuthCallbackRoute } from '@/lib/pwaUtils'

/**
 * PWA Navigation Interceptor
 * 
 * Intercepts anchor tag clicks and converts internal links to use Next.js router
 * navigation. This ensures that navigation stays within the PWA when installed,
 * rather than opening in the browser.
 */
export default function PWANavigationInterceptor() {
  const router = useRouter()

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      
      // Find the closest anchor tag
      const anchor = target.closest('a')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href) return

      // NEVER intercept auth callback routes - these need default browser behavior
      // to preserve hash fragments with authentication tokens
      if (isAuthCallbackRoute(href)) {
        return
      }

      // Check if this link should use router navigation
      if (!shouldUseRouter(href)) {
        // External link or special protocol - let browser handle it
        return
      }

      // Check for special attributes that indicate the link should be handled normally
      if (anchor.hasAttribute('download') || 
          anchor.hasAttribute('target') && anchor.getAttribute('target') !== '_self') {
        // Download links or links that open in new window/tab should use default behavior
        return
      }

      // Check if modifier keys are pressed (Ctrl, Cmd, Shift, etc.)
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
        // User wants to open in new tab/window - let browser handle it
        return
      }

      // Get the pathname from the href
      const pathname = getPathnameFromUrl(href)
      if (!pathname) return

      // Extract hash and search params to preserve them
      let fullPath = pathname
      try {
        const urlObj = new URL(href, window.location.origin)
        if (urlObj.search) {
          fullPath += urlObj.search
        }
        if (urlObj.hash) {
          fullPath += urlObj.hash
        }
      } catch {
        // If URL parsing fails, try to extract hash/search from href string
        const hashMatch = href.match(/#(.+)$/)
        const searchMatch = href.match(/\?([^#]+)/)
        if (searchMatch) {
          fullPath += '?' + searchMatch[1]
        }
        if (hashMatch) {
          fullPath += '#' + hashMatch[1]
        }
      }

      // Prevent default navigation
      event.preventDefault()
      event.stopPropagation()

      // Use Next.js router for navigation, preserving hash and search params
      router.push(fullPath)
    }

    // Add click listener to document
    document.addEventListener('click', handleClick, true) // Use capture phase

    // Cleanup
    return () => {
      document.removeEventListener('click', handleClick, true)
    }
  }, [router])

  // This component doesn't render anything
  return null
}

