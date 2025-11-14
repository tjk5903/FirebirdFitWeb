'use client'

import React, { memo } from 'react'
import { MessageSquare, Users, Clock, ChevronRight } from 'lucide-react'

// Memoized Message Item Component
interface MessageItemProps {
  message: {
    id: string
    name: string
    lastMessage: string
    time: string
    unread: boolean
    avatarUrl: string
    initials: string
    memberCount: number
  }
  index: number
  onClick?: () => void
}

export const MemoizedMessageItem = memo(function MessageItem({ 
  message, 
  index, 
  onClick 
}: MessageItemProps) {
  return (
    <div 
      key={message.id} 
      className={`message-bubble transition-all duration-200 hover:scale-[1.02] cursor-pointer ${message.unread ? 'ring-2 ring-royal-blue/20' : ''}`}
      style={{ animationDelay: `${index * 100}ms` }}
      onClick={onClick}
    >
          <div className="flex items-center space-x-3">
        <div className="relative">
          <div className="h-10 w-10 rounded-full overflow-hidden bg-gradient-to-br from-royal-blue to-blue-600 text-white font-semibold text-sm flex items-center justify-center">
            {message.avatarUrl ? (
              <img src={message.avatarUrl} alt={message.name} className="h-full w-full object-cover" />
            ) : (
              <span>{message.initials}</span>
            )}
          </div>
          {message.unread && (
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white"></div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-gray-900 truncate text-sm">{message.name}</h4>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <Users className="h-3 w-3" />
              <span>{message.memberCount}</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 truncate mb-1">{message.lastMessage}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span>{message.time}</span>
            </div>
            {message.unread && (
              <div className="flex items-center space-x-1">
                <span className="text-xs text-royal-blue font-medium">New message</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

// Memoized Quick Action Item Component
interface QuickActionProps {
  action: {
    id: number
    title: string
    description?: string
    icon: React.ComponentType<any>
    color: string
    href?: string
  }
  index: number
  onClick?: () => void
}

export const MemoizedQuickAction = memo(function QuickAction({ 
  action, 
  index, 
  onClick 
}: QuickActionProps) {
  const Icon = action.icon
  
  return (
    <button 
      key={action.id} 
      className="w-full flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 group focus-ring touch-manipulation"
      style={{ animationDelay: `${index * 100}ms` }}
      onClick={onClick}
    >
      <div className={`h-10 w-10 sm:h-12 sm:w-12 ${action.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
        <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
      </div>
      <div className="text-left flex-1">
        <h4 className="font-semibold text-gray-900 mobile-text">{action.title}</h4>
        {action.description && (
          <p className="text-sm text-gray-600 hidden sm:block">{action.description}</p>
        )}
      </div>
      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" />
    </button>
  )
})

// Memoized Workout Card Component
interface WorkoutCardProps {
  workout: {
    id: string
    name: string
    type: string
    duration: number
    difficulty: string
    exercises: number
  }
  index: number
  onClick?: () => void
}

export const MemoizedWorkoutCard = memo(function WorkoutCard({ 
  workout, 
  index, 
  onClick 
}: WorkoutCardProps) {
  return (
    <div 
      key={workout.id}
      className="relative p-6 bg-gradient-to-br from-royal-blue via-blue-600 to-dark-blue rounded-2xl text-white shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer"
      style={{ animationDelay: `${index * 100}ms` }}
      onClick={onClick}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{workout.name}</h3>
              <p className="text-blue-100 text-sm">{workout.type}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{workout.duration}</p>
            <p className="text-blue-100 text-xs">minutes</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="bg-white/20 px-3 py-1 rounded-full">{workout.difficulty}</span>
          <span className="text-blue-100">{workout.exercises} exercises</span>
        </div>
      </div>
      
      {/* Subtle Animation */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
    </div>
  )
})
