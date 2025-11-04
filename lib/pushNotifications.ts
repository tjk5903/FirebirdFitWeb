'use client'

import { supabase } from './supabaseClient'

// VAPID keys - you'll need to generate these
// For now, we'll use placeholder values
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa40HcCWLrUjHLRBmF_wBHVFVYmHBGAcpEjkqfCqVwPiMRfGbhGl3tzVOvBKdI'

// Check if push notifications are supported
export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false
  
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

// Check current notification permission status
export function getNotificationPermission(): NotificationPermission {
  if (!isPushSupported()) return 'denied'
  return Notification.permission
}

// Request notification permission from user
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) {
    console.log('❌ Push notifications not supported')
    return 'denied'
  }

  try {
    console.log('🔔 Requesting notification permission...')
    const permission = await Notification.requestPermission()
    console.log('✅ Permission result:', permission)
    return permission
  } catch (error) {
    console.error('❌ Error requesting notification permission:', error)
    return 'denied'
  }
}

// Register service worker
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) {
    console.log('❌ Service workers not supported')
    return null
  }

  try {
    console.log('🔧 Registering service worker...')
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    })
    
    console.log('✅ Service worker registered:', registration)
    
    // Wait for service worker to be ready
    await navigator.serviceWorker.ready
    console.log('✅ Service worker ready')
    
    return registration
  } catch (error) {
    console.error('❌ Service worker registration failed:', error)
    return null
  }
}

// Convert VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Subscribe to push notifications
export async function subscribeToPush(userId: string): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    console.log('❌ Push notifications not supported')
    return null
  }

  try {
    // Get service worker registration
    const registration = await navigator.serviceWorker.ready
    if (!registration) {
      console.error('❌ Service worker not ready')
      return null
    }

    console.log('🔔 Creating push subscription...')
    
    // Create push subscription
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true, // Required by Chrome
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    })

    console.log('✅ Push subscription created:', subscription)

    // Save subscription to database
    const subscriptionData = {
      user_id: userId,
      subscription: subscription.toJSON(),
      created_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(subscriptionData, {
        onConflict: 'user_id'
      })

    if (error) {
      console.error('❌ Error saving push subscription:', error)
      return null
    }

    console.log('✅ Push subscription saved to database')
    return subscription

  } catch (error) {
    console.error('❌ Error subscribing to push notifications:', error)
    return null
  }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPush(userId: string): Promise<boolean> {
  if (!isPushSupported()) return false

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      console.log('🔕 Unsubscribing from push notifications...')
      await subscription.unsubscribe()
      console.log('✅ Unsubscribed from push notifications')
    }

    // Remove from database
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('❌ Error removing push subscription from database:', error)
      return false
    }

    console.log('✅ Push subscription removed from database')
    return true

  } catch (error) {
    console.error('❌ Error unsubscribing from push notifications:', error)
    return false
  }
}

// Check if user is currently subscribed
export async function isSubscribedToPush(): Promise<boolean> {
  if (!isPushSupported()) return false

  try {
    // Check if service worker is registered first
    const registration = await navigator.serviceWorker.getRegistration()
    if (!registration) {
      return false
    }
    
    const subscription = await registration.pushManager.getSubscription()
    return subscription !== null
  } catch (error) {
    console.error('❌ Error checking push subscription status:', error)
    return false
  }
}

// Initialize push notifications for a user
export async function initializePushNotifications(userId: string): Promise<{
  success: boolean
  subscription?: PushSubscription
  error?: string
}> {
  console.log('🚀 Initializing push notifications for user:', userId)

  // Check if already subscribed
  const alreadySubscribed = await isSubscribedToPush()
  if (alreadySubscribed) {
    console.log('✅ User already subscribed to push notifications')
    return { success: true }
  }

  // Check permission
  let permission = getNotificationPermission()
  
  if (permission === 'default') {
    // Request permission
    permission = await requestNotificationPermission()
  }

  if (permission !== 'granted') {
    console.log('❌ Notification permission not granted:', permission)
    return { 
      success: false, 
      error: permission === 'denied' 
        ? 'Notifications are blocked. Please enable them in your browser settings.' 
        : 'Notification permission was not granted.'
    }
  }

  // Register service worker
  const registration = await registerServiceWorker()
  if (!registration) {
    return { 
      success: false, 
      error: 'Failed to register service worker. Push notifications may not be supported in this browser.'
    }
  }

  // Subscribe to push notifications
  const subscription = await subscribeToPush(userId)
  if (!subscription) {
    return { 
      success: false, 
      error: 'Failed to create push subscription. Please try again.'
    }
  }

  return { success: true, subscription }
}
