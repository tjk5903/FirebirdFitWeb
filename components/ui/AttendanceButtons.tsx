'use client'

import { useState, useEffect } from 'react'
import { Check, X, HelpCircle, Users } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { setEventAttendance, getUserEventAttendance, type AttendanceStatus } from '@/lib/attendance'

interface AttendanceButtonsProps {
  eventId: string
  onAttendanceChange?: (status: AttendanceStatus) => void
  showCount?: boolean
  attendanceCount?: {
    attending: number
    not_attending: number
    maybe: number
    total_responses: number
  }
}

export default function AttendanceButtons({ 
  eventId, 
  onAttendanceChange, 
  showCount = false,
  attendanceCount 
}: AttendanceButtonsProps) {
  const { user } = useAuth()
  const [currentStatus, setCurrentStatus] = useState<AttendanceStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingStatus, setIsLoadingStatus] = useState(true)

  // Load current attendance status
  useEffect(() => {
    const loadAttendanceStatus = async () => {
      if (!user?.id) return

      setIsLoadingStatus(true)
      try {
        const status = await getUserEventAttendance(eventId, user.id)
        setCurrentStatus(status)
      } catch (error) {
        console.error('Error loading attendance status:', error)
      } finally {
        setIsLoadingStatus(false)
      }
    }

    loadAttendanceStatus()
  }, [eventId, user?.id])

  const handleAttendanceClick = async (status: AttendanceStatus) => {
    if (!user?.id || isLoading) return

    setIsLoading(true)
    try {
      const result = await setEventAttendance(eventId, user.id, status)
      
      if (result.success) {
        setCurrentStatus(status)
        onAttendanceChange?.(status)
        
        // Show brief success feedback
        console.log(`✅ Attendance set to: ${status}`)
      } else {
        console.error('Failed to set attendance:', result.error)
        // Could add toast notification here
      }
    } catch (error) {
      console.error('Error setting attendance:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return null

  if (isLoadingStatus) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-pulse bg-gray-200 dark:bg-slate-700 rounded-lg h-8 w-20"></div>
        <div className="animate-pulse bg-gray-200 dark:bg-slate-700 rounded-lg h-8 w-20"></div>
        <div className="animate-pulse bg-gray-200 dark:bg-slate-700 rounded-lg h-8 w-20"></div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Attendance Buttons */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleAttendanceClick('attending')}
          disabled={isLoading}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            currentStatus === 'attending'
              ? 'bg-green-500 text-white shadow-md'
              : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900/40 hover:text-green-700 dark:hover:text-green-400'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
        >
          <Check className="h-4 w-4" />
          <span>Going</span>
        </button>

        <button
          onClick={() => handleAttendanceClick('maybe')}
          disabled={isLoading}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            currentStatus === 'maybe'
              ? 'bg-yellow-500 text-white shadow-md'
              : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 hover:text-yellow-700 dark:hover:text-yellow-400'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
        >
          <HelpCircle className="h-4 w-4" />
          <span>Maybe</span>
        </button>

        <button
          onClick={() => handleAttendanceClick('not_attending')}
          disabled={isLoading}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            currentStatus === 'not_attending'
              ? 'bg-red-500 text-white shadow-md'
              : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-700 dark:hover:text-red-400'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
        >
          <X className="h-4 w-4" />
          <span>Can't Go</span>
        </button>
      </div>

      {/* Attendance Count (for coaches) */}
      {showCount && attendanceCount && (
        <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-700/50 rounded-lg p-2">
          <div className="flex items-center space-x-1">
            <Users className="h-3 w-3" />
            <span>{attendanceCount.total_responses} responses</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{attendanceCount.attending} going</span>
            </span>
            <span className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>{attendanceCount.maybe} maybe</span>
            </span>
            <span className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>{attendanceCount.not_attending} can't go</span>
            </span>
          </div>
        </div>
      )}

      {/* Current Status Indicator */}
      {currentStatus && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Your response: <span className="font-medium">
            {currentStatus === 'attending' && '✅ Going'}
            {currentStatus === 'maybe' && '❓ Maybe'}
            {currentStatus === 'not_attending' && '❌ Can\'t go'}
          </span>
        </div>
      )}
    </div>
  )
}
