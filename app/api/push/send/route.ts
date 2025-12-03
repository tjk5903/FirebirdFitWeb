import { NextResponse } from 'next/server'
import webpush from 'web-push'

// Get VAPID keys from environment variables
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@firebirdfit.app'

// Configure web-push with VAPID keys
if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
}

interface PushNotificationRequest {
  subscription: {
    endpoint: string
    keys: {
      p256dh: string
      auth: string
    }
  }
  notificationData: {
    title: string
    message: string
    type: 'workout' | 'event' | 'message'
    url?: string
    notificationId?: string
  }
}

export async function POST(request: Request) {
  // Check if VAPID keys are configured
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.error('❌ VAPID keys not configured')
    return NextResponse.json(
      { 
        success: false, 
        error: 'Push notifications are not configured. Please set VAPID keys in environment variables.' 
      },
      { status: 500 }
    )
  }

  try {
    const body: PushNotificationRequest = await request.json()
    const { subscription, notificationData } = body

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { success: false, error: 'Invalid subscription data' },
        { status: 400 }
      )
    }

    if (!notificationData || !notificationData.title || !notificationData.message) {
      return NextResponse.json(
        { success: false, error: 'Invalid notification data' },
        { status: 400 }
      )
    }

    console.log('📤 Sending push notification:', {
      endpoint: subscription.endpoint.substring(0, 50) + '...',
      title: notificationData.title,
      vapidPublicKey: vapidPublicKey ? vapidPublicKey.substring(0, 20) + '...' : 'NOT SET',
      hasVapidKeys: !!(vapidPublicKey && vapidPrivateKey)
    })

    // Prepare the notification payload
    const payload = JSON.stringify({
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type,
      url: notificationData.url || '/',
      notificationId: notificationData.notificationId
    })

    // Send the push notification
    try {
      const result = await webpush.sendNotification(subscription, payload)
      console.log('✅ Push notification sent successfully')
      console.log('📊 Push result:', {
        statusCode: result?.statusCode,
        headers: result?.headers ? Object.keys(result.headers) : 'none'
      })
      return NextResponse.json({ success: true })
    } catch (error: any) {
      console.error('❌ Error sending push notification:', error)
      console.error('Error details:', {
        statusCode: error.statusCode,
        message: error.message,
        body: error.body,
        endpoint: subscription.endpoint?.substring(0, 50) + '...'
      })
      
      // Handle specific error cases
      if (error.statusCode === 410) {
        // Subscription expired or no longer valid
        return NextResponse.json(
          { 
            success: false, 
            error: 'Subscription expired',
            expired: true 
          },
          { status: 410 }
        )
      } else if (error.statusCode === 429) {
        // Too many requests
        return NextResponse.json(
          { 
            success: false, 
            error: 'Too many requests. Please try again later.' 
          },
          { status: 429 }
        )
      } else {
        return NextResponse.json(
          { 
            success: false, 
            error: error.message || 'Failed to send push notification' 
          },
          { status: 500 }
        )
      }
    }
  } catch (error: any) {
    console.error('❌ Error processing push notification request:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Invalid request' 
      },
      { status: 400 }
    )
  }
}

