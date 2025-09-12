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
        // Redirect to dashboard by default
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    }
  }, [user, isLoading, router])

  // FAILSAFE: If loading takes too long, redirect to login anyway
  useEffect(() => {
    const failsafeTimeout = setTimeout(() => {
      console.warn('Home page loading timeout - redirecting to login')
      router.push('/login')
    }, 5000) // 5 second timeout

    return () => clearTimeout(failsafeTimeout)
  }, [router])

  if (isLoading) {
    return <LoadingSpinner />
  }

  return null
} 