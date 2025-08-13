import { useState, useEffect } from 'react'
import { getUserWorkouts } from '@/lib/utils'

interface Workout {
  id: string
  team_id: string
  title: string
  description: string | null
  assigned_to: string | null
  date_assigned: string
  created_at: string
}

export function useUserWorkouts(userId: string | undefined) {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [isLoadingWorkouts, setIsLoadingWorkouts] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setWorkouts([])
      setIsLoadingWorkouts(false)
      return
    }

    const fetchWorkouts = async () => {
      try {
        setIsLoadingWorkouts(true)
        setError(null)
        const userWorkouts = await getUserWorkouts(userId)
        setWorkouts(userWorkouts)
      } catch (err) {
        console.error('Error fetching workouts:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch workouts')
        setWorkouts([])
      } finally {
        setIsLoadingWorkouts(false)
      }
    }

    fetchWorkouts()
  }, [userId])

  return { workouts, isLoadingWorkouts, error, refetch: () => {
    if (userId) {
      const fetchWorkouts = async () => {
        try {
          setIsLoadingWorkouts(true)
          setError(null)
          const userWorkouts = await getUserWorkouts(userId)
          setWorkouts(userWorkouts)
        } catch (err) {
          console.error('Error fetching workouts:', err)
          setError(err instanceof Error ? err.message : 'Failed to fetch workouts')
          setWorkouts([])
        } finally {
          setIsLoadingWorkouts(false)
        }
      }
      fetchWorkouts()
    }
  }}
}
