'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { isCoachOrAssistant } from '@/lib/utils'
import CoachDashboard from '@/components/dashboard/CoachDashboard'
import AthleteDashboard from '@/components/dashboard/AthleteDashboard'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [hasCheckedHash, setHasCheckedHash] = useState(false)

  useEffect(() => {
    // Check if URL has hash (magic link session)
    const hash = typeof window !== 'undefined' ? window.location.hash : ''
    const hasMagicLinkHash = hash && (hash.includes('access_token') || hash.includes('type=recovery'))
    
    if (hasMagicLinkHash && !hasCheckedHash) {
      // Hash detected - wait for Supabase to process it
      // onAuthStateChange should fire with SIGNED_IN
      const hashCheckTimeout = setTimeout(() => {
        setHasCheckedHash(true)
        // After waiting, check if user exists
        if (!user) {
          router.push('/login')
        }
      }, 2500) // Wait 2.5 seconds for hash processing
      
      return () => clearTimeout(hashCheckTimeout)
    } else {
      // No hash or already checked - normal flow
      setHasCheckedHash(true)
      const checkAuth = setTimeout(() => {
        if (!user) {
          router.push('/login')
        }
      }, 150)
      
      return () => clearTimeout(checkAuth)
    }
  }, [user, router, hasCheckedHash])

  // Show loading while waiting for hash to be processed
  if (typeof window !== 'undefined' && !hasCheckedHash && window.location.hash?.includes('access_token')) {
    return (
      <div className="min-h-screen bg-soft-white flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  // Show nothing briefly while auth is initializing
  if (!user) {
    return <div className="min-h-screen bg-soft-white" />
  }

  return (
    <div className="min-h-screen bg-soft-white">
      {isCoachOrAssistant(user.role) ? <CoachDashboard /> : <AthleteDashboard />}
    </div>
  )
} 