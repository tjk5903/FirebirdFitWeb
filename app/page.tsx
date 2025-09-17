'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function HomePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [hasInitialized, setHasInitialized] = useState(false)

  useEffect(() => {
    // Give the auth context a moment to restore from cache
    const initTimeout = setTimeout(() => {
      setHasInitialized(true)
    }, 100) // Very short delay to allow auth restoration

    return () => clearTimeout(initTimeout)
  }, [])

  useEffect(() => {
    // Only redirect after we've given auth context time to initialize
    if (!hasInitialized) return

    if (user) {
      // Only redirect to dashboard if we're on the home page or login page
      const currentPath = window.location.pathname
      if (currentPath === '/' || currentPath === '/login') {
        router.push('/dashboard')
      }
      // If user is on any other page, let them stay there
    } else {
      // Only redirect to login if we're on the home page
      const currentPath = window.location.pathname
      if (currentPath === '/') {
        router.push('/login')
      }
      // If user is on a protected page without being logged in, let the page handle the redirect
    }
  }, [user, router, hasInitialized])

  // Show nothing while initializing to prevent flash
  return null
} 