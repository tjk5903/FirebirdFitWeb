'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { isCoachOrAssistant } from '@/lib/utils'
import CoachDashboard from '@/components/dashboard/CoachDashboard'
import AthleteDashboard from '@/components/dashboard/AthleteDashboard'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isWaitingForAuth, setIsWaitingForAuth] = useState(false)

  useEffect(() => {
    // Check if URL has hash (magic link session)
    const hash = typeof window !== 'undefined' ? window.location.hash : ''
    const hasMagicLinkHash = hash && (hash.includes('access_token') || hash.includes('type=recovery'))
    
    if (hasMagicLinkHash && !user) {
      // Hash detected but no user yet - wait for Supabase to process
      console.log('Dashboard: Hash detected, waiting for auth...')
      setIsWaitingForAuth(true)
      
      // Listen for auth state change
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('Dashboard: Auth state changed:', event, session?.user?.email)
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('Dashboard: User signed in via magic link')
          setIsWaitingForAuth(false)
        }
      })
      
      // Also watch for user state to update (AuthContext might update before event fires)
      // Check both session and user state, wait up to 3 seconds
      let attempts = 0
      const maxAttempts = 6 // 6 attempts over 3 seconds
      const checkInterval = setInterval(async () => {
        attempts++
        console.log(`Dashboard: Checking auth (attempt ${attempts}/${maxAttempts})`)
        
        // Check if user state updated
        if (user) {
          console.log('Dashboard: User state updated, stopping wait')
          clearInterval(checkInterval)
          setIsWaitingForAuth(false)
          return
        }
        
        // Check session directly
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          console.log('Dashboard: Session found, waiting for user state update')
          // Give AuthContext time to update user state
          if (attempts < maxAttempts - 1) {
            // Wait a bit more for user state
            return
          } else {
            // Last attempt, stop waiting
            clearInterval(checkInterval)
            setIsWaitingForAuth(false)
          }
        } else if (attempts >= maxAttempts) {
          // No session after 3 seconds, stop waiting
          console.log('Dashboard: No session found after waiting, redirecting to login')
          clearInterval(checkInterval)
          setIsWaitingForAuth(false)
          router.push('/login')
        }
      }, 500) // Check every 500ms
      
      return () => {
        subscription.unsubscribe()
        clearInterval(checkInterval)
      }
    } else if (!hasMagicLinkHash) {
      // No hash - normal flow
      const checkAuth = setTimeout(() => {
        if (!user) {
          router.push('/login')
        }
      }, 150)
      
      return () => clearTimeout(checkAuth)
    }
  }, [user, router])

  // If user becomes available while waiting, stop waiting
  useEffect(() => {
    if (user && isWaitingForAuth) {
      console.log('Dashboard: User available, stopping wait')
      setIsWaitingForAuth(false)
    }
  }, [user, isWaitingForAuth])

  // Show loading while waiting for auth from hash
  if (isWaitingForAuth) {
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