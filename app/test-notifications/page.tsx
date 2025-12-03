'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { 
  isPushSupported, 
  getNotificationPermission,
  initializePushNotifications,
  isSubscribedToPush,
  registerServiceWorker
} from '@/lib/pushNotifications'
import { sendPushNotificationToUser, formatNotificationData } from '@/lib/pushSender'
import { Bell, CheckCircle, XCircle, AlertCircle, RefreshCw, Send, Database, Settings } from 'lucide-react'

interface DiagnosticInfo {
  label: string
  status: 'success' | 'error' | 'warning' | 'info'
  value: string | boolean
  details?: string
}

export default function TestNotificationsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [diagnostics, setDiagnostics] = useState<DiagnosticInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [testResult, setTestResult] = useState<string | null>(null)
  const [notificationEvents, setNotificationEvents] = useState<Array<{type: string, time: string, details: any}>>([])
  const [diagnosticReport, setDiagnosticReport] = useState<any>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      const redirectTimeout = setTimeout(() => {
        router.push('/login')
      }, 150)
      return () => clearTimeout(redirectTimeout)
    }
  }, [user, router])

  // Helper function to create notification with event listeners
  const createNotificationWithListeners = (title: string, options: NotificationOptions = {}) => {
    const notif = new Notification(title, options)
    const events: Array<{type: string, time: string, details: any}> = []
    
    notif.onshow = () => {
      const event = { type: 'show', time: new Date().toISOString(), details: { title, options } }
      events.push(event)
      setNotificationEvents(prev => [...prev, event])
      console.log('✅ Notification shown event:', event)
    }
    
    notif.onerror = (e) => {
      const event = { type: 'error', time: new Date().toISOString(), details: { title, options, error: e } }
      events.push(event)
      setNotificationEvents(prev => [...prev, event])
      console.error('❌ Notification error event:', event)
    }
    
    notif.onclose = () => {
      const event = { type: 'close', time: new Date().toISOString(), details: { title, options } }
      events.push(event)
      setNotificationEvents(prev => [...prev, event])
      console.log('🔒 Notification close event:', event)
    }
    
    notif.onclick = () => {
      const event = { type: 'click', time: new Date().toISOString(), details: { title, options } }
      events.push(event)
      setNotificationEvents(prev => [...prev, event])
      console.log('👆 Notification click event:', event)
    }
    
    return { notif, events }
  }

  // Run diagnostics
  const runDiagnostics = async () => {
    if (!user) return

    setIsLoading(true)
    const results: DiagnosticInfo[] = []

    try {
      // 1. Check browser support
      const pushSupported = isPushSupported()
      results.push({
        label: 'Browser Support',
        status: pushSupported ? 'success' : 'error',
        value: pushSupported ? 'Supported' : 'Not Supported',
        details: pushSupported 
          ? 'Your browser supports push notifications'
          : 'Push notifications require a modern browser with Service Worker and Push API support'
      })

      // 2. Check notification permission
      const permission = getNotificationPermission()
      results.push({
        label: 'Notification Permission',
        status: permission === 'granted' ? 'success' : permission === 'denied' ? 'error' : 'warning',
        value: permission,
        details: permission === 'granted' 
          ? 'Notifications are allowed'
          : permission === 'denied'
          ? 'Notifications are blocked. Please enable them in browser settings.'
          : 'Permission not yet requested'
      })

      // 3. Check service worker registration
      try {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration) {
          results.push({
            label: 'Service Worker',
            status: 'success',
            value: 'Registered',
            details: `Active: ${registration.active ? 'Yes' : 'No'}, Scope: ${registration.scope}`
          })
        } else {
          results.push({
            label: 'Service Worker',
            status: 'warning',
            value: 'Not Registered',
            details: 'Service worker needs to be registered for push notifications'
          })
        }
      } catch (error: any) {
        results.push({
          label: 'Service Worker',
          status: 'error',
          value: 'Error',
          details: error.message
        })
      }

      // 4. Check push subscription
      const isSubscribed = await isSubscribedToPush()
      results.push({
        label: 'Push Subscription',
        status: isSubscribed ? 'success' : 'warning',
        value: isSubscribed ? 'Subscribed' : 'Not Subscribed',
        details: isSubscribed 
          ? 'You have an active push subscription'
          : 'You need to subscribe to receive push notifications'
      })

      // 5. Check VAPID key configuration and match
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      let vapidKeyMatch = false
      let subscriptionKey = null
      
      try {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration) {
          const subscription = await registration.pushManager.getSubscription()
          if (subscription) {
            // Extract the VAPID key from subscription (it's in the keys object)
            const subscriptionKeys = subscription.toJSON().keys
            // Note: We can't directly compare, but we can check if subscription exists
            subscriptionKey = subscriptionKeys ? 'Present' : 'Missing'
            // If subscription exists and VAPID key is set, they likely match
            vapidKeyMatch = !!(vapidKey && subscription)
          }
        }
      } catch (e) {
        console.error('Error checking subscription keys:', e)
      }
      
      results.push({
        label: 'VAPID Public Key',
        status: vapidKey ? 'success' : 'error',
        value: vapidKey ? 'Configured' : 'Not Configured',
        details: vapidKey 
          ? `Key: ${vapidKey.substring(0, 20)}... | Subscription: ${subscriptionKey || 'Not checked'}`
          : 'VAPID keys need to be set in environment variables'
      })

      // 6. Check database subscriptions
      const { data: dbSubscriptions, error: dbError } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', user.id)

      if (dbError) {
        results.push({
          label: 'Database Subscriptions',
          status: 'error',
          value: 'Error',
          details: dbError.message
        })
      } else {
        results.push({
          label: 'Database Subscriptions',
          status: dbSubscriptions && dbSubscriptions.length > 0 ? 'success' : 'warning',
          value: `${dbSubscriptions?.length || 0} subscription(s)`,
          details: dbSubscriptions && dbSubscriptions.length > 0
            ? 'Subscriptions found in database'
            : 'No subscriptions found in database'
        })
        setSubscriptions(dbSubscriptions || [])
      }

      // 7. Check HTTPS/localhost
      const isSecure = typeof window !== 'undefined' && 
        (window.location.protocol === 'https:' || window.location.hostname === 'localhost')
      results.push({
        label: 'Secure Context',
        status: isSecure ? 'success' : 'error',
        value: isSecure ? 'Yes' : 'No',
        details: isSecure
          ? 'Running on HTTPS or localhost (required for push notifications)'
          : 'Push notifications require HTTPS or localhost'
      })

    } catch (error: any) {
      results.push({
        label: 'Diagnostics Error',
        status: 'error',
        value: 'Failed',
        details: error.message
      })
    }

    setDiagnostics(results)
    setIsLoading(false)
  }

  useEffect(() => {
    if (user) {
      runDiagnostics()
    }
  }, [user])

  const handleSubscribe = async () => {
    if (!user) return
    setIsLoading(true)
    setTestResult(null)

    try {
      const result = await initializePushNotifications(user.id)
      if (result.success) {
        setTestResult('✅ Successfully subscribed to push notifications!')
        await runDiagnostics()
      } else {
        setTestResult(`❌ Failed: ${result.error}`)
      }
    } catch (error: any) {
      setTestResult(`❌ Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestNotification = async () => {
    if (!user) return
    setIsLoading(true)
    setTestResult(null)

    try {
      // First, verify service worker is ready
      const registration = await navigator.serviceWorker.getRegistration()
      if (!registration) {
        setTestResult('❌ Service worker not registered. Please subscribe first.')
        setIsLoading(false)
        return
      }

      const subscription = await registration.pushManager.getSubscription()
      if (!subscription) {
        setTestResult('❌ No push subscription found. Please subscribe first.')
        setIsLoading(false)
        return
      }

      console.log('🧪 Test notification - Subscription:', {
        endpoint: subscription.endpoint.substring(0, 50) + '...',
        hasKeys: !!subscription.toJSON().keys
      })

      const testData = formatNotificationData(
        'message',
        'Test Notification',
        'This is a test notification from FirebirdFit!',
        { notificationId: 'test-' + Date.now() }
      )

      const result = await sendPushNotificationToUser(user.id, testData)
      if (result.success) {
        setTestResult('✅ Test notification sent! You should see a browser notification. If not, check browser notification settings.')
        
        // Also test direct notification display to verify browser can show notifications
        setTimeout(async () => {
          try {
            const reg = await navigator.serviceWorker.getRegistration()
            if (reg) {
              console.log('🧪 Testing direct notification display...')
              const notificationOptions: NotificationOptions & { vibrate?: number[] } = {
                body: 'If you see this, browser notifications are working! This should stay visible.',
                icon: '/firebird-mascot.png',
                badge: '/firebird-mascot.png',
                tag: 'direct-test',
                requireInteraction: true, // Keep it visible longer
                silent: false,
                vibrate: [200, 100, 200]
              }
              await reg.showNotification('Direct Test Notification', notificationOptions)
              console.log('✅ Direct notification test sent')
            }
          } catch (e: any) {
            console.error('❌ Direct notification test failed:', e)
            setTestResult(prev => prev + ` | Direct test failed: ${e.message}`)
          }
        }, 2000)
        
        // Also test using Notification API directly (without service worker) with event listeners
        setTimeout(async () => {
          try {
            if (Notification.permission === 'granted') {
              console.log('🧪 Testing Notification API directly...')
              const { notif } = createNotificationWithListeners('Direct API Test', {
                body: 'This is a direct browser notification (not from service worker)',
                icon: '/firebird-mascot.png',
                tag: 'api-test',
                requireInteraction: true
              })
              console.log('✅ Direct API notification created:', notif)
            } else {
              console.log('⚠️ Notification permission not granted for direct API test')
            }
          } catch (e: any) {
            console.error('❌ Direct API notification test failed:', e)
          }
        }, 3000)
        
        // Wait a moment and check service worker status
        setTimeout(async () => {
          const swRegistration = await navigator.serviceWorker.getRegistration()
          if (swRegistration) {
            console.log('📊 Service worker status after push:', {
              active: !!swRegistration.active,
              installing: !!swRegistration.installing,
              waiting: !!swRegistration.waiting
            })
          }
        }, 1000)
      } else {
        setTestResult(`❌ Failed to send: ${result.error}`)
      }
    } catch (error: any) {
      setTestResult(`❌ Error: ${error.message}`)
      console.error('Test notification error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50" />
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-blue-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Bell className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Notification System Diagnostics
              </h1>
            </div>
            <button
              onClick={runDiagnostics}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Diagnostics */}
          <div className="space-y-3 mb-6">
            {diagnostics.map((diag, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getStatusColor(diag.status)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getStatusIcon(diag.status)}
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {diag.label}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {String(diag.value)}
                      </div>
                      {diag.details && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {diag.details}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="border-t pt-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Actions
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={handleSubscribe}
                disabled={isLoading}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <Settings className="w-5 h-5" />
                <span>Subscribe to Notifications</span>
              </button>

              <button
                onClick={handleTestNotification}
                disabled={isLoading}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
                <span>Send Test Notification</span>
              </button>
            </div>

            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                🔍 Debugging Tips
              </h3>
              <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1 list-disc list-inside">
                <li>Check <strong>Service Worker Console</strong>: DevTools → Application → Service Workers → Click service worker link</li>
                <li>Look for "🔔 Service Worker: Push notification received" in service worker console</li>
                <li>If no logs appear, the push may not be reaching the service worker</li>
                <li>Verify VAPID keys match between client and server</li>
                <li>Check browser notification settings if notifications don't appear</li>
              </ul>
            </div>

            {testResult && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-gray-900 dark:text-white">{testResult}</p>
              </div>
            )}

            {/* Critical Finding Alert */}
            {notificationEvents.some(e => e.type === 'show') && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  ✅ Key Finding: Notifications Are Working!
                </h3>
                <p className="text-sm text-green-800 dark:text-green-200">
                  Your notifications are being created successfully (we can see "show" events in the log above). 
                  The issue is that <strong>Windows is not displaying them visually</strong>. This is a Windows notification 
                  settings issue, not a code issue.
                </p>
                <p className="text-sm text-green-800 dark:text-green-200 mt-2">
                  <strong>Next Steps:</strong> Check Windows Settings → System → Notifications → Find your browser → 
                  Enable "Show notification banners". Also check Focus Assist is OFF.
                </p>
              </div>
            )}
          </div>

          {/* Database Subscriptions */}
          {subscriptions.length > 0 && (
            <div className="border-t pt-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <Database className="w-5 h-5" />
                <span>Database Subscriptions</span>
              </h2>
              <div className="space-y-2">
                {subscriptions.map((sub, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg text-xs font-mono"
                  >
                    <div className="text-gray-600 dark:text-gray-300">
                      Endpoint: {sub.subscription?.endpoint?.substring(0, 60)}...
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 mt-1">
                      Created: {new Date(sub.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notification Visibility Test */}
          <div className="border-t pt-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Notification Visibility Test
            </h2>
            <div className="space-y-3">
              <button
                onClick={async () => {
                  try {
                    if (Notification.permission !== 'granted') {
                      setTestResult('❌ Notification permission not granted')
                      return
                    }
                    const { notif } = createNotificationWithListeners('Direct Browser Test', {
                      body: 'Can you see this notification?',
                      icon: '/firebird-mascot.png',
                      requireInteraction: true
                    })
                    setTestResult('✅ Direct browser notification sent. Check events below. Did you see it?')
                    console.log('Direct notification:', notif)
                  } catch (e: any) {
                    setTestResult(`❌ Direct notification failed: ${e.message}`)
                    console.error('Direct notification error:', e)
                  }
                }}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Test 1: Direct Browser Notification (No Service Worker)
              </button>
              
              <button
                onClick={async () => {
                  try {
                    if (Notification.permission !== 'granted') {
                      setTestResult('❌ Notification permission not granted')
                      return
                    }
                    const { notif } = createNotificationWithListeners('Minimal Test', {
                      body: 'No icon, no extras - just text',
                      requireInteraction: true
                    })
                    setTestResult('✅ Minimal notification sent (no icon). Did you see it?')
                    console.log('Minimal notification:', notif)
                  } catch (e: any) {
                    setTestResult(`❌ Minimal notification failed: ${e.message}`)
                    console.error('Minimal notification error:', e)
                  }
                }}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Test 2: Minimal Notification (No Icon)
              </button>
              
              <button
                onClick={async () => {
                  try {
                    if (Notification.permission !== 'granted') {
                      setTestResult('❌ Notification permission not granted')
                      return
                    }
                    const { notif } = createNotificationWithListeners('Require Interaction Test', {
                      body: 'This should stay visible until you interact',
                      icon: '/firebird-mascot.png',
                      requireInteraction: true,
                      tag: 'require-interaction-test'
                    })
                    setTestResult('✅ Require interaction notification sent. Should stay visible.')
                    console.log('Require interaction notification:', notif)
                  } catch (e: any) {
                    setTestResult(`❌ Require interaction notification failed: ${e.message}`)
                    console.error('Require interaction notification error:', e)
                  }
                }}
                className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                Test 3: Require Interaction (Stays Visible)
              </button>
              
              <button
                onClick={async () => {
                  try {
                    console.log('🧪 Test 4: Starting service worker direct test...')
                    const reg = await navigator.serviceWorker.getRegistration()
                    if (!reg) {
                      const error = 'Service worker not registered'
                      setTestResult(`❌ ${error}`)
                      console.error('❌', error)
                      return
                    }
                    console.log('✅ Service worker found:', reg)
                    
                    if (!reg.active) {
                      const error = 'Service worker not active'
                      setTestResult(`❌ ${error}`)
                      console.error('❌', error)
                      return
                    }
                    
                    console.log('📤 Sending notification via service worker...')
                    const notificationPromise = reg.showNotification('Service Worker Direct Test', {
                      body: 'This is from service worker directly',
                      icon: '/firebird-mascot.png',
                      requireInteraction: true,
                      tag: 'sw-direct-test'
                    })
                    
                    await notificationPromise
                    setTestResult('✅ Service worker direct notification sent. Check event log below.')
                    console.log('✅ Service worker notification sent successfully')
                  } catch (e: any) {
                    const errorMsg = `Service worker notification failed: ${e.message}`
                    setTestResult(`❌ ${errorMsg}`)
                    console.error('❌ Service worker notification error:', e)
                    console.error('Error details:', {
                      name: e.name,
                      message: e.message,
                      stack: e.stack
                    })
                  }
                }}
                className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Test 4: Service Worker Direct (No Push)
              </button>
              
              <button
                onClick={async () => {
                  try {
                    if (Notification.permission !== 'granted') {
                      setTestResult('❌ Notification permission not granted')
                      return
                    }
                    // Test with invalid icon path
                    const { notif } = createNotificationWithListeners('Invalid Icon Test', {
                      body: 'Testing with invalid icon path',
                      icon: '/nonexistent-icon.png',
                      requireInteraction: true
                    })
                    setTestResult('✅ Invalid icon test sent. Check if it appears without icon.')
                    console.log('Invalid icon notification:', notif)
                  } catch (e: any) {
                    setTestResult(`❌ Invalid icon notification failed: ${e.message}`)
                    console.error('Invalid icon notification error:', e)
                  }
                }}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Test 5: Invalid Icon Path Test
              </button>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                These tests help identify which notification configurations work. Check the event log below to see what's happening.
              </p>
            </div>
          </div>

          {/* Notification Event Log */}
          {notificationEvents.length > 0 && (
            <div className="border-t pt-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Notification Event Log
              </h2>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {notificationEvents.slice().reverse().map((event, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg text-xs ${
                      event.type === 'error' 
                        ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                        : event.type === 'show'
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                        : 'bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {event.type.toUpperCase()} - {new Date(event.time).toLocaleTimeString()}
                        </div>
                        <div className="text-gray-600 dark:text-gray-300 mt-1">
                          {event.details.title || 'No title'}
                        </div>
                        {event.type === 'error' && event.details.error && (
                          <div className="text-red-600 dark:text-red-400 mt-1">
                            Error: {JSON.stringify(event.details.error)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setNotificationEvents([])}
                className="mt-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Clear Log
              </button>
            </div>
          )}

          {/* Browser Settings Diagnostic */}
          <div className="border-t pt-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Browser Settings Diagnostic
            </h2>
            <div className="space-y-3">
              <button
                onClick={() => {
                  const permission = Notification.permission
                  const maxActions = 'maxActions' in Notification.prototype ? 'Supported' : 'Not supported'
                  const badge = 'badge' in Notification.prototype ? 'Supported' : 'Not supported'
                  const image = 'image' in Notification.prototype ? 'Supported' : 'Not supported'
                  
                  setTestResult(`Permission: ${permission} | Max Actions: ${maxActions} | Badge: ${badge} | Image: ${image}`)
                  console.log('Notification API Support:', {
                    permission,
                    maxActions,
                    badge,
                    image,
                    userAgent: navigator.userAgent
                  })
                }}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Check Browser Notification API Support
              </button>
              
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Windows Notification Settings Check
                </h3>
                <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                  <li>Press <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">Windows + I</code> → System → Notifications</li>
                  <li>Find your browser (Chrome/Edge) in the list</li>
                  <li>Ensure toggle is <strong>ON</strong></li>
                  <li>Ensure <strong>"Show notification banners"</strong> is ON</li>
                  <li>Check Focus Assist: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">Windows + I</code> → System → Focus Assist → Set to "Off"</li>
                  <li>Check Action Center (notification icon) for any notifications</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Diagnostic Report */}
          <div className="border-t pt-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Diagnostic Report
            </h2>
            
            {diagnosticReport && (
              <div className="mb-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Report Summary</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Permission:</strong> 
                    <span className={`ml-2 ${diagnosticReport.notification.permission === 'granted' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {diagnosticReport.notification.permission}
                    </span>
                  </div>
                  <div>
                    <strong>Service Worker:</strong> 
                    <span className={`ml-2 ${diagnosticReport.serviceWorker.registered ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {diagnosticReport.serviceWorker.registered ? 'Registered' : 'Not Registered'}
                    </span>
                    {diagnosticReport.serviceWorker.active && (
                      <span className="ml-2 text-green-600 dark:text-green-400">(Active)</span>
                    )}
                  </div>
                  <div>
                    <strong>Push Subscription:</strong> 
                    <span className={`ml-2 ${diagnosticReport.push.subscribed ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                      {diagnosticReport.push.subscribed ? 'Subscribed' : 'Not Subscribed'}
                    </span>
                  </div>
                  <div>
                    <strong>Notification Events:</strong> 
                    <span className="ml-2 text-blue-600 dark:text-blue-400">
                      {diagnosticReport.events?.length || 0} events logged
                    </span>
                    {diagnosticReport.events?.some((e: any) => e.type === 'show') && (
                      <span className="ml-2 text-green-600 dark:text-green-400">(Show events detected ✅)</span>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-300 dark:border-slate-600">
                    <strong>Browser:</strong> {diagnosticReport.browser.userAgent.split(' ').slice(-2).join(' ')}
                  </div>
                  <div className="mt-2">
                    <strong>Platform:</strong> {diagnosticReport.browser.platform}
                  </div>
                </div>
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    View Full JSON Report
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-900 dark:bg-black text-green-400 text-xs overflow-x-auto rounded">
                    {JSON.stringify(diagnosticReport, null, 2)}
                  </pre>
                </details>
              </div>
            )}
            
            <button
              onClick={async () => {
                const report: any = {
                  timestamp: new Date().toISOString(),
                  browser: {
                    userAgent: navigator.userAgent,
                    platform: navigator.platform,
                    language: navigator.language
                  },
                  notification: {
                    permission: Notification.permission,
                    maxActions: 'maxActions' in Notification.prototype,
                    badge: 'badge' in Notification.prototype,
                    image: 'image' in Notification.prototype
                  },
                  serviceWorker: {
                    supported: 'serviceWorker' in navigator,
                    registered: false,
                    active: false
                  },
                  push: {
                    supported: 'PushManager' in window,
                    subscribed: false
                  },
                  events: notificationEvents
                }
                
                try {
                  const reg = await navigator.serviceWorker.getRegistration()
                  if (reg) {
                    report.serviceWorker.registered = true
                    report.serviceWorker.active = !!reg.active
                    report.serviceWorker.scope = reg.scope
                    
                    const sub = await reg.pushManager.getSubscription()
                    report.push.subscribed = !!sub
                    if (sub) {
                      report.push.endpoint = sub.endpoint.substring(0, 50) + '...'
                    }
                  }
                } catch (e) {
                  report.serviceWorker.error = String(e)
                }
                
                const reportText = JSON.stringify(report, null, 2)
                console.log('📊 Diagnostic Report:', report)
                setDiagnosticReport(report)
                
                // Also copy to clipboard
                try {
                  await navigator.clipboard.writeText(reportText)
                  setTestResult('✅ Diagnostic report generated and copied to clipboard! Check the report below.')
                } catch (e) {
                  setTestResult('✅ Diagnostic report generated! Check the report below.')
                }
              }}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Generate Diagnostic Report
            </button>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Click to generate a comprehensive diagnostic report. Check the browser console for the full report.
            </p>
          </div>

          {/* Instructions */}
          <div className="border-t pt-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Setup Instructions
            </h2>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>Generate VAPID keys: <code className="bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">npm run generate-vapid-keys</code></li>
                <li>Add the keys to your <code className="bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">.env.local</code> file</li>
                <li>Restart your development server</li>
                <li>Click "Subscribe to Notifications" and allow notifications when prompted</li>
                <li>Click "Send Test Notification" to verify everything works</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

