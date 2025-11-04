'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, X, Check, CheckCheck, Calendar, Dumbbell, MessageCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications, type Notification } from '@/lib/hooks/useNotifications'
import { formatTimeAgo } from '@/lib/utils'

// Notification item component
function NotificationItem({ notification, onMarkAsRead }: { 
  notification: Notification
  onMarkAsRead: (id: string) => void 
}) {
  const getIcon = () => {
    switch (notification.type) {
      case 'workout':
        return <Dumbbell className="h-4 w-4 text-blue-500" />
      case 'event':
        return <Calendar className="h-4 w-4 text-green-500" />
      case 'message':
        return <MessageCircle className="h-4 w-4 text-purple-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const getBgColor = () => {
    if (notification.read) return 'bg-white'
    switch (notification.type) {
      case 'workout':
        return 'bg-blue-50'
      case 'event':
        return 'bg-green-50'
      case 'message':
        return 'bg-purple-50'
      default:
        return 'bg-gray-50'
    }
  }

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id)
    }
    // TODO: Navigate to relevant page based on notification type
  }

  return (
    <div
      onClick={handleClick}
      className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${getBgColor()}`}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-1">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className={`text-sm font-medium ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
              {notification.title}
            </p>
            {!notification.read && (
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
            )}
          </div>
          <p className={`text-sm mt-1 ${notification.read ? 'text-gray-500' : 'text-gray-700'}`}>
            {notification.message}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {formatTimeAgo(notification.created_at)}
          </p>
        </div>
      </div>
    </div>
  )
}

// Main notification center component
export default function NotificationCenter() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead
  } = useNotifications(user?.id)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  if (!user) return null

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-sm">Loading notifications...</p>
              </div>
            ) : error ? (
              <div className="p-4 text-center text-red-500">
                <p className="text-sm">Failed to load notifications</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-sm">No notifications yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  You'll see updates about workouts, events, and messages here
                </p>
              </div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 text-center">
              <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
