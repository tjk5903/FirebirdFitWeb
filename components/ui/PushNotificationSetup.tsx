'use client'

import { useState, useEffect } from 'react'
import { Bell, X, Check, Smartphone } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { 
  isPushSupported, 
  getNotificationPermission, 
  initializePushNotifications,
  isSubscribedToPush 
} from '@/lib/pushNotifications'

export default function PushNotificationSetup() {
  const { user } = useAuth()
  const [showBanner, setShowBanner] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)

  // Check if we should show the notification setup banner
  useEffect(() => {
    const checkNotificationStatus = async () => {
      try {
        if (!user || !isPushSupported()) return

        const permission = getNotificationPermission()
        const subscribed = await isSubscribedToPush()
        
        setIsSubscribed(subscribed)

        // Show banner if:
        // 1. User is logged in
        // 2. Push is supported
        // 3. Permission is default (not asked yet) or granted but not subscribed
        // 4. User hasn't dismissed the banner before
        const hasBeenDismissed = localStorage.getItem('push-notification-banner-dismissed')
        
        if (!hasBeenDismissed && (permission === 'default' || (permission === 'granted' && !subscribed))) {
          setShowBanner(true)
        }
      } catch (error) {
        console.error('Error in checkNotificationStatus:', error)
      }
    }

    checkNotificationStatus()
  }, [user])

  const handleEnableNotifications = async () => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await initializePushNotifications(user.id)
      
      if (result.success) {
        setIsSubscribed(true)
        setShowBanner(false)
        
        // Show success message briefly
        const successBanner = document.createElement('div')
        successBanner.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300'
        successBanner.innerHTML = '✅ Notifications enabled! You\'ll now get instant updates.'
        document.body.appendChild(successBanner)
        
        setTimeout(() => {
          successBanner.style.opacity = '0'
          setTimeout(() => document.body.removeChild(successBanner), 300)
        }, 3000)
        
      } else {
        setError(result.error || 'Failed to enable notifications')
      }
    } catch (err) {
      console.error('Error enabling notifications:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('push-notification-banner-dismissed', 'true')
  }

  const handleNotNow = () => {
    setShowBanner(false)
    // Don't mark as permanently dismissed, just hide for this session
  }

  if (!user || !isPushSupported() || !showBanner || isSubscribed) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 max-w-sm bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-[9999] animate-slide-in">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Bell className="h-5 w-5 text-blue-600" />
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Stay Updated Instantly
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Get notified about new workouts, events, and team messages even when the app is closed.
          </p>
          
          {error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {error}
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleEnableNotifications}
              disabled={isLoading}
              className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  <span>Enabling...</span>
                </>
              ) : (
                <>
                  <Smartphone className="h-3 w-3" />
                  <span>Enable</span>
                </>
              )}
            </button>
            
            <button
              onClick={handleNotNow}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
