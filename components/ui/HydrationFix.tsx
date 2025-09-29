'use client'

import { useEffect } from 'react'

export default function HydrationFix() {
  useEffect(() => {
    // Clean up extra attributes added by browser extensions during hydration
    const cleanupExtraAttributes = () => {
      // Remove common attributes added by browser extensions
      const selectors = [
        'button[fdprocessedid]',
        'input[fdprocessedid]',
        'form[fdprocessedid]',
        'div[fdprocessedid]',
        'a[fdprocessedid]'
      ]
      
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector)
        elements.forEach(element => {
          element.removeAttribute('fdprocessedid')
        })
      })
    }
    
    // Clean up immediately and after a short delay
    cleanupExtraAttributes()
    const timeoutId = setTimeout(cleanupExtraAttributes, 100)
    
    // Also clean up on any DOM mutations
    const observer = new MutationObserver(() => {
      cleanupExtraAttributes()
    })
    
    observer.observe(document.body, {
      attributes: true,
      subtree: true,
      attributeFilter: ['fdprocessedid']
    })
    
    return () => {
      clearTimeout(timeoutId)
      observer.disconnect()
    }
  }, [])

  return null // This component doesn't render anything
}
