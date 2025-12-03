'use client'

/**
 * Diagnostic utilities for notification system
 */

export interface NotificationDiagnosticReport {
  timestamp: string
  browser: {
    userAgent: string
    platform: string
    language: string
    vendor: string
  }
  notification: {
    permission: NotificationPermission
    maxActions: boolean
    badge: boolean
    image: boolean
    renotify: boolean
    requireInteraction: boolean
  }
  serviceWorker: {
    supported: boolean
    registered: boolean
    active: boolean
    scope?: string
    error?: string
  }
  push: {
    supported: boolean
    subscribed: boolean
    endpoint?: string
  }
  windows: {
    checkActionCenter: string
    checkSettings: string
    checkFocusAssist: string
  }
}

/**
 * Generate comprehensive diagnostic report
 */
export async function generateDiagnosticReport(): Promise<NotificationDiagnosticReport> {
  const report: NotificationDiagnosticReport = {
    timestamp: new Date().toISOString(),
    browser: {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      vendor: navigator.vendor
    },
    notification: {
      permission: Notification.permission,
      maxActions: 'maxActions' in Notification.prototype,
      badge: 'badge' in Notification.prototype,
      image: 'image' in Notification.prototype,
      renotify: 'renotify' in Notification.prototype,
      requireInteraction: 'requireInteraction' in Notification.prototype
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
    windows: {
      checkActionCenter: 'Click notification icon in system tray (bottom-right) to check Action Center',
      checkSettings: 'Windows + I → System → Notifications → Find your browser → Enable "Show notification banners"',
      checkFocusAssist: 'Windows + I → System → Focus Assist → Set to "Off"'
    }
  }

  try {
    if (report.serviceWorker.supported) {
      const reg = await navigator.serviceWorker.getRegistration()
      if (reg) {
        report.serviceWorker.registered = true
        report.serviceWorker.active = !!reg.active
        report.serviceWorker.scope = reg.scope

        if (report.push.supported) {
          const sub = await reg.pushManager.getSubscription()
          report.push.subscribed = !!sub
          if (sub) {
            report.push.endpoint = sub.endpoint.substring(0, 50) + '...'
          }
        }
      }
    }
  } catch (error: any) {
    report.serviceWorker.error = error.message || String(error)
  }

  return report
}

/**
 * Test notification with event listeners
 */
export function createNotificationWithDiagnostics(
  title: string,
  options: NotificationOptions = {},
  onEvent?: (type: string, event: any) => void
): Notification {
  const notif = new Notification(title, options)

  notif.onshow = () => {
    const event = { type: 'show', timestamp: new Date(), title, options }
    onEvent?.('show', event)
    console.log('✅ Notification shown:', event)
  }

  notif.onerror = (e) => {
    const event = { type: 'error', timestamp: new Date(), title, options, error: e }
    onEvent?.('error', event)
    console.error('❌ Notification error:', event)
  }

  notif.onclose = () => {
    const event = { type: 'close', timestamp: new Date(), title, options }
    onEvent?.('close', event)
    console.log('🔒 Notification closed:', event)
  }

  notif.onclick = () => {
    const event = { type: 'click', timestamp: new Date(), title, options }
    onEvent?.('click', event)
    console.log('👆 Notification clicked:', event)
  }

  return notif
}

/**
 * Test different notification configurations
 */
export async function testNotificationConfigurations(
  onResult?: (test: string, success: boolean, error?: string) => void
): Promise<Array<{test: string, success: boolean, error?: string}>> {
  const results: Array<{test: string, success: boolean, error?: string}> = []

  if (Notification.permission !== 'granted') {
    return [{ test: 'Permission Check', success: false, error: 'Permission not granted' }]
  }

  // Test 1: Minimal notification
  try {
    const notif1 = new Notification('Minimal Test', { body: 'No icon' })
    results.push({ test: 'Minimal (no icon)', success: true })
    onResult?.('Minimal (no icon)', true)
    notif1.close()
  } catch (e: any) {
    results.push({ test: 'Minimal (no icon)', success: false, error: e.message })
    onResult?.('Minimal (no icon)', false, e.message)
  }

  // Test 2: With icon
  try {
    const notif2 = new Notification('Icon Test', {
      body: 'With icon',
      icon: '/firebird-mascot.png'
    })
    results.push({ test: 'With icon', success: true })
    onResult?.('With icon', true)
    notif2.close()
  } catch (e: any) {
    results.push({ test: 'With icon', success: false, error: e.message })
    onResult?.('With icon', false, e.message)
  }

  // Test 3: Require interaction
  try {
    const notif3 = new Notification('Require Interaction Test', {
      body: 'Should stay visible',
      requireInteraction: true
    })
    results.push({ test: 'Require interaction', success: true })
    onResult?.('Require interaction', true)
    notif3.close()
  } catch (e: any) {
    results.push({ test: 'Require interaction', success: false, error: e.message })
    onResult?.('Require interaction', false, e.message)
  }

  // Test 4: Invalid icon
  try {
    const notif4 = new Notification('Invalid Icon Test', {
      body: 'Testing invalid icon',
      icon: '/nonexistent.png'
    })
    results.push({ test: 'Invalid icon path', success: true })
    onResult?.('Invalid icon path', true)
    notif4.close()
  } catch (e: any) {
    results.push({ test: 'Invalid icon path', success: false, error: e.message })
    onResult?.('Invalid icon path', false, e.message)
  }

  return results
}

