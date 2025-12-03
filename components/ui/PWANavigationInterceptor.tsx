'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { shouldUseRouter, getPathnameFromUrl } from '@/lib/pwaUtils'

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

      // Prevent default navigation
      event.preventDefault()
      event.stopPropagation()

      // Use Next.js router for navigation
      router.push(pathname)
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

