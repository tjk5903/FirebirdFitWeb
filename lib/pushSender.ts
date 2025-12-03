// Server-side push notification sender
// This would typically run on your backend, but for now we'll simulate it

import { supabase } from './supabaseClient'

// Note: VAPID keys are now stored in environment variables
// Public key is available via NEXT_PUBLIC_VAPID_PUBLIC_KEY
// Private key is only used server-side in the API route

interface PushNotificationData {
  title: string
  message: string
  type: 'workout' | 'event' | 'message'
  url?: string
  notificationId?: string
}

// Send push notification to a specific user
export async function sendPushNotificationToUser(
  userId: string, 
  notificationData: PushNotificationData
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('📤 Sending push notification to user:', userId, notificationData)

    // Get user's push subscriptions
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', userId)

    if (error) {
      console.error('❌ Error fetching push subscriptions:', error)
      return { success: false, error: error.message }
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('ℹ️ No push subscriptions found for user:', userId)
      return { success: true } // Not an error, user just doesn't have push enabled
    }

    console.log('📱 Found', subscriptions.length, 'push subscription(s) for user')

    // Send push notification to each subscription via API route
    const pushPromises = subscriptions.map(async (sub) => {
      try {
        console.log('📤 Sending push to subscription:', sub.subscription.endpoint?.substring(0, 50) + '...')
        
        // Call the server-side API route to send the push notification
        const response = await fetch('/api/push/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscription: sub.subscription,
            notificationData: notificationData
          })
        })

        const result = await response.json()

        if (!response.ok || !result.success) {
          // If subscription expired, we should remove it from database
          if (response.status === 410 || result.expired) {
            console.log('⚠️ Subscription expired, removing from database')
            // Since we use UNIQUE(user_id), we can delete by user_id
            // If supporting multiple devices in future, would need to match by endpoint
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('user_id', userId)
          }
          throw new Error(result.error || 'Failed to send push notification')
        }

        console.log('✅ Push notification sent successfully')
        return { success: true }
        
      } catch (error: any) {
        console.error('❌ Error sending push to subscription:', error)
        return { success: false, error: error.message || 'Failed to send push notification' }
      }
    })

    const results = await Promise.allSettled(pushPromises)
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    
    console.log(`✅ Push notifications sent: ${successCount}/${subscriptions.length}`)
    
    return { success: true }

  } catch (error) {
    console.error('❌ Error in sendPushNotificationToUser:', error)
    return { success: false, error: 'Failed to send push notification' }
  }
}

// Send push notifications to multiple users (e.g., all team members)
export async function sendPushNotificationToUsers(
  userIds: string[], 
  notificationData: PushNotificationData
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('📤 Sending push notifications to', userIds.length, 'users')

    const pushPromises = userIds.map(userId => 
      sendPushNotificationToUser(userId, notificationData)
    )

    const results = await Promise.allSettled(pushPromises)
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    
    console.log(`✅ Push notifications sent to ${successCount}/${userIds.length} users`)
    
    return { success: true }

  } catch (error) {
    console.error('❌ Error in sendPushNotificationToUsers:', error)
    return { success: false, error: 'Failed to send push notifications' }
  }
}

// Helper function to format notification data based on type
export function formatNotificationData(
  type: 'workout' | 'event' | 'message',
  title: string,
  message: string,
  additionalData?: any
): PushNotificationData {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  
  let url = '/'
  let formattedTitle = title
  let formattedMessage = message

  switch (type) {
    case 'workout':
      url = '/workouts'
      formattedTitle = `💪 ${title}`
      break
    case 'event':
      url = '/calendar'
      formattedTitle = `📅 ${title}`
      break
    case 'message':
      url = '/messages'
      formattedTitle = `💬 ${title}`
      break
  }

  return {
    title: formattedTitle,
    message: formattedMessage,
    type,
    url: baseUrl + url,
    notificationId: additionalData?.notificationId
  }
}

// Function to be called when notifications are created in the database
export async function handleNotificationCreated(notification: {
  id: string
  user_id: string
  team_id: string
  type: 'workout' | 'event' | 'message'
  title: string
  message: string
  data: any
}) {
  console.log('🔔 Handling notification created:', notification)

  // Format the push notification data
  const pushData = formatNotificationData(
    notification.type,
    notification.title,
    notification.message,
    { notificationId: notification.id, ...notification.data }
  )

  // Send push notification to the user
  const result = await sendPushNotificationToUser(notification.user_id, pushData)
  
  if (result.success) {
    console.log('✅ Push notification sent for notification:', notification.id)
  } else {
    console.error('❌ Failed to send push notification:', result.error)
  }

  return result
}
