'use client'

import { useState, useEffect } from 'react'
import { Trophy, TrendingUp, Calendar, Dumbbell, Flame, Clock, CheckCircle } from 'lucide-react'
import { getUserPersonalStats, type PersonalPerformanceStats } from '@/lib/personalPerformance'

interface PersonalPerformanceCardProps {
  userId: string
  className?: string
}

export default function PersonalPerformanceCard({ userId, className = '' }: PersonalPerformanceCardProps) {
  const [stats, setStats] = useState<PersonalPerformanceStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    const loadPersonalStats = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const personalStats = await getUserPersonalStats(userId)
        setStats(personalStats)
      } catch (err) {
        console.error('Error loading personal performance:', err)
        setError('Failed to load your performance data')
      } finally {
        setIsLoading(false)
      }
    }

    loadPersonalStats()
  }, [userId])

  if (isLoading) {
    return (
      <div className={`card-elevated hover-lift ${className}`}>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">My Performance</h3>
          <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-gold" />
        </div>
        
        <div className="space-y-4 animate-pulse">
          <div className="text-center">
            <div className="h-8 w-16 bg-gray-200 dark:bg-slate-700 rounded mx-auto mb-2"></div>
            <div className="h-4 w-24 bg-gray-200 dark:bg-slate-700 rounded mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-4 w-20 bg-gray-200 dark:bg-slate-700 rounded"></div>
              <div className="h-4 w-16 bg-gray-200 dark:bg-slate-700 rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-20 bg-gray-200 dark:bg-slate-700 rounded"></div>
              <div className="h-4 w-16 bg-gray-200 dark:bg-slate-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className={`card-elevated hover-lift ${className}`}>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">My Performance</h3>
          <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-gold" />
        </div>
        
        <div className="text-center py-8">
          <TrendingUp className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-sm text-gray-500 dark:text-gray-300">
            {error || 'No performance data available yet'}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Start attending events and completing workouts to see your stats!
          </p>
        </div>
      </div>
    )
  }

  // Determine performance color and message
  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 75) return 'text-blue-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPerformanceMessage = (score: number) => {
    if (score >= 90) return 'Excellent!'
    if (score >= 75) return 'Great job!'
    if (score >= 60) return 'Good work!'
    if (score > 0) return 'Keep going!'
    return 'Get started!'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  return (
    <div className={`card-elevated hover-lift ${className}`}>
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">My Performance</h3>
        <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-gold" />
      </div>
      
      <div className="space-y-4">
        {/* Overall Score - Clean & Simple */}
        <div className="text-center mb-6 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
          <div className={`text-3xl font-bold mb-1 ${getPerformanceColor(stats.overallScore)}`}>
            {stats.overallScore}%
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
            {getPerformanceMessage(stats.overallScore)}
          </p>
        </div>

        {/* Stats - Minimal Cards */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Attendance */}
          <div className="p-3 border border-gray-200 dark:border-slate-600 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Attendance</span>
            </div>
            {stats.totalEvents > 0 ? (
              <>
                <div className={`text-xl font-bold ${getPerformanceColor(stats.attendanceRate)}`}>
                  {stats.attendanceRate}%
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {stats.attendedEvents}/{stats.totalEvents} events
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500">No events yet</p>
            )}
          </div>

          {/* Completion */}
          <div className="p-3 border border-gray-200 dark:border-slate-600 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Dumbbell className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Completion</span>
            </div>
            {stats.totalWorkouts > 0 ? (
              <>
                <div className={`text-xl font-bold ${getPerformanceColor(stats.completionRate)}`}>
                  {stats.completionRate}%
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {stats.completedWorkouts}/{stats.totalWorkouts} workouts
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500">No workouts yet</p>
            )}
          </div>
        </div>

        {/* Streaks - Simple */}
        {(stats.currentAttendanceStreak > 0 || stats.currentCompletionStreak > 0) && (
          <div className="flex items-center justify-center space-x-4 py-2 border-t border-gray-100 dark:border-slate-700">
            {stats.currentCompletionStreak > 0 && (
              <div className="flex items-center space-x-1 text-orange-600">
                <Flame className="h-4 w-4" />
                <span className="text-sm font-semibold">{stats.currentCompletionStreak}</span>
                <span className="text-xs">workout streak</span>
              </div>
            )}
            {stats.currentAttendanceStreak > 0 && (
              <div className="flex items-center space-x-1 text-blue-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-semibold">{stats.currentAttendanceStreak}</span>
                <span className="text-xs">attendance streak</span>
              </div>
            )}
          </div>
        )}

        {/* Last Activity */}
        {stats.lastCompletedWorkout && (
          <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200/50 dark:border-slate-600/50">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-green-500 rounded-lg">
                <Clock className="h-3 w-3 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Last completed</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{stats.lastCompletedWorkout.title}</p>
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                {formatDate(stats.lastCompletedWorkout.completedAt)}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
