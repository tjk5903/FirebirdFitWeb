# Notification Debugging Checklist

## Current Status
✅ Service worker receiving push events  
✅ Push data parsing successfully  
✅ Notification API called successfully  
❌ Notifications not appearing visually  

## Step-by-Step Debugging

### 1. Test Direct Browser Notifications (No Service Worker)

**Purpose:** Verify your browser/OS can show notifications at all

**Steps:**
1. Go to `/test-notifications`
2. Click "Test Direct Browser Notification (No Service Worker)"
3. **Expected:** You should see a notification popup immediately
4. **If you don't see it:** Browser/OS is blocking notifications

**What to check if it fails:**
- Windows Settings → System → Notifications → Find your browser → Enable it
- Browser address bar → Lock icon → Notifications → Set to "Allow"
- Windows Focus Assist → Turn it OFF temporarily

---

### 2. Check Windows Notification Settings

**Steps:**
1. Press `Windows + I` → System → Notifications
2. Find your browser (Chrome/Edge) in the list
3. Ensure:
   - ✅ Toggle is ON
   - ✅ "Show notification banners" is ON
   - ✅ "Show notifications in action center" is ON
   - ✅ "Play a sound" is ON (optional)

**Also check:**
- "Do not disturb" mode is OFF
- Focus Assist is OFF

---

### 3. Check Browser Notification Settings

**Steps:**
1. In your browser, click the **lock icon** in the address bar
2. Find "Notifications"
3. Ensure it's set to **"Allow"** (not "Block" or "Ask")
4. If it's "Block", change it to "Allow" and refresh

**Alternative method:**
- Chrome: `chrome://settings/content/notifications`
- Edge: `edge://settings/content/notifications`
- Add `http://localhost:3000` to "Allowed" sites

---

### 4. Check Windows Action Center

**Purpose:** Notifications might be appearing but not as popups

**Steps:**
1. Click the **notification icon** in Windows system tray (bottom-right)
2. Look for any FirebirdFit notifications
3. If you see them there but not as popups → Windows is hiding them

**Fix:**
- Windows Settings → System → Notifications
- Enable "Show notification banners"

---

### 5. Test Service Worker Direct Notification

**Purpose:** Verify service worker can show notifications

**Steps:**
1. Open browser console (F12)
2. Run this code:
```javascript
navigator.serviceWorker.ready.then(reg => {
  reg.showNotification('Service Worker Test', {
    body: 'Can you see this?',
    icon: '/firebird-mascot.png',
    requireInteraction: true,
    tag: 'sw-test'
  }).then(() => {
    console.log('✅ Notification shown')
  }).catch(err => {
    console.error('❌ Error:', err)
  })
})
```

**Expected:** Notification appears
**If it fails:** Service worker notification permission issue

---

### 6. Check Service Worker Console

**Purpose:** See if service worker is actually trying to show notifications

**Steps:**
1. DevTools → Application → Service Workers
2. Click on your service worker link (`sw.js`)
3. This opens the **service worker console**
4. Send a test notification
5. Look for:
   - "🔔 Service Worker: Push notification received"
   - "📨 Push data parsed successfully"
   - "✅ Notification displayed successfully"
   - Any error messages

**What to look for:**
- If you see "✅ Notification displayed successfully" but no notification → OS/browser blocking
- If you see errors → Code issue

---

### 7. Check Notification Permission Status

**Steps:**
1. Open browser console (F12)
2. Run: `Notification.permission`
3. **Expected:** Should return `"granted"`
4. If it returns `"denied"` → Permission is blocked
5. If it returns `"default"` → Permission not requested yet

**Fix if denied:**
- Browser settings → Reset notification permissions
- Or manually allow in browser settings

---

### 8. Test on Different Browser

**Purpose:** Rule out browser-specific issues

**Steps:**
1. Try the same test in a different browser
2. Chrome → Edge or vice versa
3. If it works in one but not the other → Browser-specific issue

---

### 9. Check for Browser Extensions

**Purpose:** Some extensions block notifications

**Steps:**
1. Try in **Incognito/Private mode** (disables most extensions)
2. If it works in incognito → Extension is blocking
3. Disable extensions one by one to find the culprit

---

### 10. Verify Icon Path

**Purpose:** Invalid icon can cause notification to fail silently

**Steps:**
1. Check if `/firebird-mascot.png` exists
2. Try accessing it directly: `http://localhost:3000/firebird-mascot.png`
3. If 404 → Icon missing, notifications might fail

**Quick fix:** Remove icon temporarily to test:
```javascript
// In service worker, comment out icon temporarily
icon: undefined, // '/firebird-mascot.png'
```

---

## Quick Diagnostic Test

Run this in browser console to test everything at once:

```javascript
(async () => {
  console.log('1. Permission:', Notification.permission)
  
  if (Notification.permission !== 'granted') {
    const perm = await Notification.requestPermission()
    console.log('2. Permission after request:', perm)
  }
  
  const reg = await navigator.serviceWorker.getRegistration()
  console.log('3. Service Worker:', reg ? 'Registered' : 'Not registered')
  
  if (reg) {
    const sub = await reg.pushManager.getSubscription()
    console.log('4. Push Subscription:', sub ? 'Subscribed' : 'Not subscribed')
    
    // Test direct notification
    try {
      await reg.showNotification('Direct Test', {
        body: 'Testing notification display',
        requireInteraction: true
      })
      console.log('5. Direct notification: ✅ Sent')
    } catch (e) {
      console.error('5. Direct notification: ❌', e)
    }
  }
})()
```

---

## Most Likely Issues (Based on Your Symptoms)

Since logs show everything working but notifications don't appear:

1. **Windows Notification Settings** (90% likely)
   - Browser notifications disabled in Windows Settings
   - Focus Assist blocking notifications
   - "Do not disturb" mode enabled

2. **Browser Notification Settings** (80% likely)
   - Notifications blocked for localhost
   - Permission set to "Block" instead of "Allow"

3. **Notification Banners Disabled** (70% likely)
   - Windows showing notifications in Action Center only
   - Not showing as popup banners

---

## What to Report Back

After going through this checklist, report:
1. ✅/❌ Direct browser notification test result
2. ✅/❌ Service worker direct notification test result
3. What `Notification.permission` returns
4. What you see in Windows Action Center
5. Any errors in service worker console

This will help pinpoint the exact issue!

