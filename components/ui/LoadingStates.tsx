'use client'

import { Loader2, MessageSquare, Users, Calendar, Dumbbell } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'blue' | 'gray' | 'white'
}

export function LoadingSpinner({ size = 'md', color = 'blue' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  }
  
  const colorClasses = {
    blue: 'border-blue-500 border-t-transparent',
    gray: 'border-gray-500 border-t-transparent',
    white: 'border-white border-t-transparent'
  }
  
  return (
    <div className={`${sizeClasses[size]} border-2 ${colorClasses[color]} rounded-full animate-spin`} />
  )
}

interface SmartLoadingMessageProps {
  type: 'messages' | 'teams' | 'workouts' | 'events' | 'members'
  isInitial?: boolean
  hasData?: boolean
}

export function SmartLoadingMessage({ type, isInitial = false, hasData = false }: SmartLoadingMessageProps) {
  const configs = {
    messages: {
      icon: MessageSquare,
      initial: 'Loading your team conversations...',
      refresh: 'Checking for new messages...',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    teams: {
      icon: Users,
      initial: 'Loading your teams...',
      refresh: 'Updating team information...',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    workouts: {
      icon: Dumbbell,
      initial: 'Loading your workouts...',
      refresh: 'Checking for new workouts...',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    events: {
      icon: Calendar,
      initial: 'Loading upcoming events...',
      refresh: 'Updating your schedule...',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    members: {
      icon: Users,
      initial: 'Loading team members...',
      refresh: 'Updating member list...',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  }
  
  const config = configs[type]
  const Icon = config.icon
  const message = isInitial || !hasData ? config.initial : config.refresh
  
  return (
    <div className={`flex items-center justify-center py-8 ${config.bgColor} rounded-xl`}>
      <div className="flex items-center space-x-3">
        <div className="relative">
          <Icon className={`h-6 w-6 ${config.color}`} />
          <div className="absolute -top-1 -right-1">
            <LoadingSpinner size="sm" color="blue" />
          </div>
        </div>
        <span className={`${config.color} font-medium`}>{message}</span>
      </div>
    </div>
  )
}

interface EmptyStateProps {
  type: 'messages' | 'teams' | 'workouts' | 'events' | 'members'
  title?: string
  description?: string
  actionText?: string
  onAction?: () => void
}

export function EmptyState({ type, title, description, actionText, onAction }: EmptyStateProps) {
  const configs = {
    messages: {
      icon: MessageSquare,
      defaultTitle: 'No messages yet',
      defaultDescription: 'Team conversations will appear here',
      color: 'text-gray-400',
      bgColor: 'bg-gray-50'
    },
    teams: {
      icon: Users,
      defaultTitle: 'No teams yet',
      defaultDescription: 'Join or create a team to get started',
      color: 'text-gray-400',
      bgColor: 'bg-gray-50'
    },
    workouts: {
      icon: Dumbbell,
      defaultTitle: 'No workouts yet',
      defaultDescription: 'Your assigned workouts will appear here',
      color: 'text-gray-400',
      bgColor: 'bg-gray-50'
    },
    events: {
      icon: Calendar,
      defaultTitle: 'No events scheduled',
      defaultDescription: 'Upcoming team events will appear here',
      color: 'text-gray-400',
      bgColor: 'bg-gray-50'
    },
    members: {
      icon: Users,
      defaultTitle: 'No members yet',
      defaultDescription: 'Team members will appear here',
      color: 'text-gray-400',
      bgColor: 'bg-gray-50'
    }
  }
  
  const config = configs[type]
  const Icon = config.icon
  
  return (
    <div className={`text-center py-12 ${config.bgColor} rounded-xl`}>
      <Icon className={`h-16 w-16 ${config.color} mx-auto mb-4`} />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title || config.defaultTitle}
      </h3>
      <p className="text-gray-600 mb-4">
        {description || config.defaultDescription}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-200"
        >
          {actionText}
        </button>
      )}
    </div>
  )
}
