// Service Worker for Push Notifications
// This runs in the background even when the app is closed

const CACHE_NAME = 'firebird-fit-v1'

// Install event - set up the service worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...')
  console.log('📍 Service Worker scope:', self.registration?.scope || 'unknown')
  self.skipWaiting() // Activate immediately
})

// Log when service worker becomes active
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activated')
  console.log('📍 Service Worker controlling:', self.clients ? 'checking...' : 'unknown')
  event.waitUntil(
    self.clients.claim().then(() => {
      console.log('✅ Service Worker: Claimed all clients')
      return self.clients.matchAll().then(clients => {
        console.log(`📱 Service Worker: Controlling ${clients.length} client(s)`)
      })
    })
  )
})

// Note: activate event handler moved above to include better logging

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('🔔 Service Worker: Push notification received')
  console.log('📦 Push event details:', {
    hasData: !!event.data,
    dataType: event.data ? event.data.type : 'none',
    waitUntil: typeof event.waitUntil === 'function'
  })
  
  if (!event.data) {
    console.log('❌ Push event has no data')
    // Still show a notification even without data
    event.waitUntil(
      self.registration.showNotification('FirebirdFit', {
        body: 'You have a new notification',
        icon: '/firebird-mascot.png',
        tag: 'no-data-notification'
      })
    )
    return
  }

  // Parse push data - handle both sync and async methods
  const parsePushData = async () => {
    try {
      // Try json() first (most common)
      if (typeof event.data.json === 'function') {
        return await event.data.json()
      }
      // Try text() as fallback
      if (typeof event.data.text === 'function') {
        const text = await event.data.text()
        return JSON.parse(text)
      }
      // Try arrayBuffer as last resort
      if (typeof event.data.arrayBuffer === 'function') {
        const buffer = await event.data.arrayBuffer()
        const text = new TextDecoder().decode(buffer)
        return JSON.parse(text)
      }
      throw new Error('No method to read push data')
    } catch (parseError) {
      console.error('❌ Error parsing push data:', parseError)
      throw parseError
    }
  }

  // Use waitUntil to handle async data parsing
  event.waitUntil(
    parsePushData().then((data) => {
      console.log('📨 Push data parsed successfully:', data)

      const options = {
        body: data.message || 'You have a new notification',
        icon: '/firebird-mascot.png', // Your app icon
        badge: '/firebird-mascot.png',
        tag: data.type || 'general', // Prevents duplicate notifications
        data: {
          url: data.url || '/',
          notificationId: data.notificationId,
          type: data.type
        },
        actions: [
          {
            action: 'view',
            title: 'View',
            icon: '/firebird-mascot.png'
          },
          {
            action: 'dismiss',
            title: 'Dismiss'
          }
        ],
        requireInteraction: false, // Auto-dismiss after a few seconds
        silent: false, // Play notification sound
        vibrate: [200, 100, 200] // Vibration pattern for mobile
      }

      // Show the notification
      return self.registration.showNotification(
        data.title || 'FirebirdFit', 
        options
      ).then(() => {
        console.log('✅ Notification displayed successfully')
        console.log('📋 Notification options used:', {
          title: data.title || 'FirebirdFit',
          body: options.body,
          icon: options.icon,
          tag: options.tag
        })
      }).catch((err) => {
        console.error('❌ Error displaying notification:', err)
        console.error('Error details:', {
          name: err.name,
          message: err.message,
          stack: err.stack
        })
        // Try showing a simpler notification as fallback
        return self.registration.showNotification('FirebirdFit', {
          body: 'You have a new notification',
          tag: 'fallback-notification'
        }).catch((fallbackErr) => {
          console.error('❌ Fallback notification also failed:', fallbackErr)
          throw fallbackErr
        })
      })
    }).catch((error) => {

      console.error('❌ Error handling push notification:', error)
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        dataType: event.data ? typeof event.data : 'unknown'
      })
      
      // Fallback notification if parsing fails
      return self.registration.showNotification('FirebirdFit', {
        body: 'You have a new notification',
        icon: '/firebird-mascot.png',
        tag: 'error-notification'
      })
    })
  )
})

// Notification click event - handle when user clicks the notification
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Service Worker: Notification clicked')
  
  const notification = event.notification
  const data = notification.data || {}
  
  notification.close() // Close the notification

  if (event.action === 'dismiss') {
    console.log('🚫 User dismissed notification')
    return
  }

  // Default action or 'view' action - open the app
  const urlToOpen = data.url || '/'
  
  event.waitUntil(
    // Check if app is already open
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If app is already open, focus it and navigate
        for (const client of clientList) {
          if (client.url.includes(self.location.origin)) {
            console.log('📱 Focusing existing app window')
            client.focus()
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              url: urlToOpen,
              notificationId: data.notificationId
            })
            return
          }
        }
        
        // If app is not open, open it
        console.log('🚀 Opening new app window')
        return self.clients.openWindow(urlToOpen)
      })
  )
})

// Background sync (optional - for offline functionality)
self.addEventListener('sync', (event) => {
  console.log('🔄 Service Worker: Background sync triggered')
  
  if (event.tag === 'background-sync') {
    // Handle background sync if needed
    console.log('📡 Performing background sync...')
  }
})

// Handle messages from the main app
self.addEventListener('message', (event) => {
  console.log('💬 Service Worker: Message received from app:', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
