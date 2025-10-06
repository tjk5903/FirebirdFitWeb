import { useState, useEffect, useCallback, useMemo } from 'react'
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

  const refetch = useCallback(() => {
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
  }, [userId])

  // Memoize the return object to prevent unnecessary re-renders
  const memoizedReturn = useMemo(() => ({
    workouts,
    isLoadingWorkouts,
    error,
    refetch
  }), [workouts, isLoadingWorkouts, error, refetch])

  return memoizedReturn
}
