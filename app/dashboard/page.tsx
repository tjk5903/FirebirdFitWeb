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
      setIsWaitingForAuth(true)
      
      // Listen for auth state change
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('Dashboard: User signed in via magic link')
          // Give AuthContext a moment to update user state
          setTimeout(() => {
            setIsWaitingForAuth(false)
          }, 500)
        }
      })
      
      // Fallback: Check session directly and wait up to 3 seconds
      let attempts = 0
      const maxAttempts = 6 // 6 attempts over 3 seconds
      const checkInterval = setInterval(async () => {
        attempts++
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          console.log('Dashboard: Session found, waiting for user state update')
          clearInterval(checkInterval)
          setTimeout(() => {
            setIsWaitingForAuth(false)
          }, 500)
        } else if (attempts >= maxAttempts) {
          // No session after 3 seconds, stop waiting
          console.log('Dashboard: No session found after waiting')
          clearInterval(checkInterval)
          setIsWaitingForAuth(false)
          if (!user) {
            router.push('/login')
          }
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