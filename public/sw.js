// Service Worker for Push Notifications
// This runs in the background even when the app is closed

const CACHE_NAME = 'firebird-fit-v1'

// Install event - set up the service worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...')
  self.skipWaiting() // Activate immediately
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activated')
  event.waitUntil(self.clients.claim()) // Take control immediately
})

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('🔔 Service Worker: Push notification received')
  
  if (!event.data) {
    console.log('❌ Push event has no data')
    return
  }

  try {
    const data = event.data.json()
    console.log('📨 Push data:', data)

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
    event.waitUntil(
      self.registration.showNotification(data.title || 'FirebirdFit', options)
    )

  } catch (error) {
    console.error('❌ Error handling push notification:', error)
    
    // Fallback notification if parsing fails
    event.waitUntil(
      self.registration.showNotification('FirebirdFit', {
        body: 'You have a new notification',
        icon: '/firebird-mascot.png'
      })
    )
  }
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
