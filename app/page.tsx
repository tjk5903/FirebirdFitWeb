'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
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
    }
  }, [user, isLoading, router])

  // Additional failsafe: if we've been loading for too long, force redirect
  useEffect(() => {
    if (isLoading) {
      const forceRedirectTimeout = setTimeout(() => {
        console.warn('Force redirect due to extended loading state')
        const currentPath = window.location.pathname
        if (user) {
          // Only redirect to dashboard if we're on home or login page
          if (currentPath === '/' || currentPath === '/login') {
            router.push('/dashboard')
          }
        } else {
          // Only redirect to login if we're on home page
          if (currentPath === '/') {
            router.push('/login')
          }
        }
      }, 2000) // 2 second timeout for loading state

      return () => clearTimeout(forceRedirectTimeout)
    }
  }, [isLoading, user, router])

  // FAILSAFE: If loading takes too long, redirect to login anyway
  useEffect(() => {
    const failsafeTimeout = setTimeout(() => {
      console.warn('Home page loading timeout - redirecting to login')
      router.push('/login')
    }, 1000) // 1 second timeout - even faster

    return () => clearTimeout(failsafeTimeout)
  }, [router])

  if (isLoading) {
    return <LoadingSpinner />
  }

  return null
} 