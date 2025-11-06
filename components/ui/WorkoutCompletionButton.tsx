'use client'

import { useState, useEffect } from 'react'
import { Check, RotateCcw, Trophy } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { 
  markWorkoutComplete, 
  markWorkoutIncomplete, 
  isWorkoutCompleted,
  type WorkoutCompletion 
} from '@/lib/workoutCompletion'

interface WorkoutCompletionButtonProps {
  workoutId: string
  onCompletionChange?: (completed: boolean) => void
  showCompletionInfo?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function WorkoutCompletionButton({ 
  workoutId, 
  onCompletionChange,
  showCompletionInfo = false,
  size = 'md'
}: WorkoutCompletionButtonProps) {
  const { user } = useAuth()
  const [completion, setCompletion] = useState<WorkoutCompletion | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingStatus, setIsLoadingStatus] = useState(true)

  // Load current completion status
  useEffect(() => {
    const loadCompletionStatus = async () => {
      if (!user?.id) return

      setIsLoadingStatus(true)
      try {
        const completionData = await isWorkoutCompleted(workoutId, user.id)
        setCompletion(completionData)
      } catch (error) {
        console.error('Error loading completion status:', error)
      } finally {
        setIsLoadingStatus(false)
      }
    }

    loadCompletionStatus()
  }, [workoutId, user?.id])

  const handleToggleCompletion = async () => {
    if (!user?.id || isLoading) return

    setIsLoading(true)
    try {
      let result
      if (completion) {
        // Mark as incomplete
        result = await markWorkoutIncomplete(workoutId, user.id)
        if (result.success) {
          setCompletion(null)
          onCompletionChange?.(false)
        }
      } else {
        // Mark as complete
        result = await markWorkoutComplete(workoutId, user.id, 100)
        if (result.success) {
          const newCompletion = {
            id: 'temp',
            workout_id: workoutId,
            user_id: user.id,
            completed_at: new Date().toISOString(),
            completion_percentage: 100,
            notes: null,
            created_at: new Date().toISOString()
          }
          setCompletion(newCompletion)
          onCompletionChange?.(true)
        }
      }

      if (!result.success) {
        console.error('Failed to toggle completion:', result.error)
        // Could add toast notification here
      }
    } catch (error) {
      console.error('Error toggling completion:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return null

  // Size configurations
  const sizeConfig = {
    sm: {
      button: 'px-3 py-1.5 text-sm',
      icon: 'h-4 w-4',
      text: 'text-sm'
    },
    md: {
      button: 'px-4 py-2 text-sm',
      icon: 'h-4 w-4',
      text: 'text-sm'
    },
    lg: {
      button: 'px-6 py-3 text-base',
      icon: 'h-5 w-5',
      text: 'text-base'
    }
  }

  const config = sizeConfig[size]

  if (isLoadingStatus) {
    return (
      <div className={`animate-pulse bg-gray-200 dark:bg-slate-700 rounded-lg ${config.button}`}>
        <div className="w-20 h-4 bg-gray-300 dark:bg-slate-600 rounded"></div>
      </div>
    )
  }

  const isCompleted = !!completion

  return (
    <div className="space-y-2">
      {/* Completion Button */}
      <button
        onClick={handleToggleCompletion}
        disabled={isLoading}
        className={`flex items-center space-x-2 rounded-lg font-medium transition-all duration-200 ${config.button} ${
          isCompleted
            ? 'bg-green-500 text-white shadow-md hover:bg-green-600'
            : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900/40 hover:text-green-700 dark:hover:text-green-400 border border-gray-200 dark:border-slate-600'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
      >
        {isLoading ? (
          <>
            <div className={`animate-spin rounded-full border-b-2 border-current ${config.icon}`}></div>
            <span className={config.text}>
              {isCompleted ? 'Updating...' : 'Marking...'}
            </span>
          </>
        ) : isCompleted ? (
          <>
            <Check className={config.icon} />
            <span className={config.text}>Completed</span>
          </>
        ) : (
          <>
            <Trophy className={config.icon} />
            <span className={config.text}>Mark Complete</span>
          </>
        )}
      </button>

      {/* Completion Info */}
      {showCompletionInfo && completion && (
        <div className={`text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-2 ${config.text}`}>
          <Check className="h-3 w-3 text-green-500 dark:text-green-400" />
          <span>
            Completed {new Date(completion.completed_at).toLocaleDateString()} at{' '}
            {new Date(completion.completed_at).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>
      )}

      {/* Undo Option for Recently Completed */}
      {isCompleted && !isLoading && (
        <button
          onClick={handleToggleCompletion}
          className={`flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors ${config.text}`}
        >
          <RotateCcw className="h-3 w-3" />
          <span>Mark as incomplete</span>
        </button>
      )}
    </div>
  )
}
