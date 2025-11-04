'use client'

import { supabase } from './supabaseClient'
import { handleNotificationCreated } from './pushSender'

// Listen for new notifications and send push notifications
export function setupNotificationListener(userId: string) {
  console.log('🔔 Setting up notification listener for user:', userId)

  // Subscribe to new notifications for this user
  const subscription = supabase
    .channel('notification-push-handler')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        console.log('🔔 New notification received, sending push:', payload.new)
        
        // Send push notification
        await handleNotificationCreated(payload.new as any)
      }
    )
    .subscribe()

  return subscription
}

// Clean up notification listener
export function cleanupNotificationListener(subscription: any) {
  if (subscription) {
    console.log('🔄 Cleaning up notification listener')
    subscription.unsubscribe()
  }
}
