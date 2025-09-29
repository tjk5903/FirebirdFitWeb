'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { isCoachOrAssistant } from '@/lib/utils'
import CoachDashboard from '@/components/dashboard/CoachDashboard'
import AthleteDashboard from '@/components/dashboard/AthleteDashboard'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Small delay to allow auth context to restore from cache
    const checkAuth = setTimeout(() => {
      if (!user) {
        router.push('/login')
      }
    }, 150) // Very short delay to prevent flash

    return () => clearTimeout(checkAuth)
  }, [user, router])

  // Show nothing briefly while auth is initializing to prevent flash
  if (!user) {
    return <div className="min-h-screen bg-soft-white" />
  }

  return (
    <div className="min-h-screen bg-soft-white">
      {isCoachOrAssistant(user.role) ? <CoachDashboard /> : <AthleteDashboard />}
    </div>
  )
} 