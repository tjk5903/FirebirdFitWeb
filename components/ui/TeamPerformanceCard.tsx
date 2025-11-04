'use client'

import { useState, useEffect } from 'react'
import { Award, Users, TrendingUp, Calendar, Dumbbell } from 'lucide-react'
import { getTeamPerformanceStats, type TeamPerformanceStats } from '@/lib/teamPerformance'

interface TeamPerformanceCardProps {
  teamId: string
  className?: string
}

export default function TeamPerformanceCard({ teamId, className = '' }: TeamPerformanceCardProps) {
  const [stats, setStats] = useState<TeamPerformanceStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!teamId) return

    const loadPerformanceStats = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const performanceStats = await getTeamPerformanceStats(teamId)
        setStats(performanceStats)
      } catch (err) {
        console.error('Error loading team performance:', err)
        setError('Failed to load performance data')
      } finally {
        setIsLoading(false)
      }
    }

    loadPerformanceStats()
  }, [teamId])

  if (isLoading) {
    return (
      <div className={`card-elevated hover-lift ${className}`}>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">Team Performance</h3>
          <Award className="h-5 w-5 sm:h-6 sm:w-6 text-gold" />
        </div>
        
        <div className="space-y-3 sm:space-y-4 animate-pulse">
          <div className="text-center">
            <div className="h-8 w-16 bg-gray-200 rounded mx-auto mb-2"></div>
            <div className="h-4 w-24 bg-gray-200 rounded mx-auto"></div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-4 w-16 bg-gray-200 rounded"></div>
              <div className="h-4 w-8 bg-gray-200 rounded"></div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5"></div>
            
            <div className="flex items-center justify-between">
              <div className="h-4 w-16 bg-gray-200 rounded"></div>
              <div className="h-4 w-8 bg-gray-200 rounded"></div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className={`card-elevated hover-lift ${className}`}>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">Team Performance</h3>
          <Award className="h-5 w-5 sm:h-6 sm:w-6 text-gold" />
        </div>
        
        <div className="text-center py-8">
          <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-sm text-gray-500">
            {error || 'No performance data available yet'}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Performance data will appear as team members attend events and complete workouts
          </p>
        </div>
      </div>
    )
  }

  // Determine performance color based on overall score
  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 75) return 'text-blue-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getProgressBarColor = (score: number) => {
    if (score >= 90) return 'bg-green-500'
    if (score >= 75) return 'bg-blue-500'
    if (score >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className={`card-elevated hover-lift ${className}`}>
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900">Team Performance</h3>
        <Award className="h-5 w-5 sm:h-6 sm:w-6 text-gold" />
      </div>
      
      <div className="space-y-3 sm:space-y-4">
        {/* Overall Performance */}
        <div className="text-center">
          <div className={`text-2xl sm:text-3xl font-bold mb-1 ${getPerformanceColor(stats.overallPerformance)}`}>
            {stats.overallPerformance}%
          </div>
          <p className="text-xs sm:text-sm text-gray-600">Overall Performance</p>
        </div>
        
        {/* Attendance Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="h-3 w-3 text-gray-500" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">Attendance</span>
            </div>
            <div className="flex items-center space-x-2">
              {stats.totalEvents > 0 ? (
                <>
                  <span className={`text-xs sm:text-sm font-semibold ${getPerformanceColor(stats.attendanceRate)}`}>
                    {stats.attendanceRate}%
                  </span>
                  <span className="text-xs text-gray-400">
                    ({stats.attendedEvents}/{stats.totalEvents * stats.teamSize})
                  </span>
                </>
              ) : (
                <span className="text-xs sm:text-sm font-semibold text-gray-400">
                  N/A
                </span>
              )}
            </div>
          </div>
          {stats.totalEvents > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full transition-all duration-1000 ${getProgressBarColor(stats.attendanceRate)}`}
                style={{ width: `${stats.attendanceRate}%` }}
              ></div>
            </div>
          )}
        </div>
        
        {/* Completion Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Dumbbell className="h-3 w-3 text-gray-500" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">Completion</span>
            </div>
            <div className="flex items-center space-x-2">
              {stats.totalWorkouts > 0 ? (
                <>
                  <span className={`text-xs sm:text-sm font-semibold ${getPerformanceColor(stats.completionRate)}`}>
                    {stats.completionRate}%
                  </span>
                  <span className="text-xs text-gray-400">
                    ({stats.completedWorkouts}/{stats.totalWorkouts * stats.teamSize})
                  </span>
                </>
              ) : (
                <span className="text-xs sm:text-sm font-semibold text-gray-400">
                  N/A
                </span>
              )}
            </div>
          </div>
          {stats.totalWorkouts > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full transition-all duration-1000 ${getProgressBarColor(stats.completionRate)}`}
                style={{ width: `${stats.completionRate}%` }}
              ></div>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {(stats.totalEvents > 0 || stats.totalWorkouts > 0) && (
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{stats.totalEvents} events</span>
              </div>
              <div className="flex items-center space-x-1">
                <Dumbbell className="h-3 w-3" />
                <span>{stats.totalWorkouts} workouts</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
