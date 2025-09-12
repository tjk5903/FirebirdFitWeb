'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { isCoachOrAssistant } from '@/lib/utils'
import CoachDashboard from '@/components/dashboard/CoachDashboard'
import AthleteDashboard from '@/components/dashboard/AthleteDashboard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  // Show loading spinner while checking auth state
  if (isLoading) {
    return <LoadingSpinner />
  }

  // Redirect to login if no user (this should happen automatically via useEffect)
  if (!user) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-soft-white">
      {isCoachOrAssistant(user.role) ? <CoachDashboard /> : <AthleteDashboard />}
    </div>
  )
} 