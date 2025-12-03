# How to Enable Lock Screen Notifications on Mobile

This guide will help users enable notifications on their mobile devices so they appear on the lock screen and wake the device.

## Prerequisites

1. **Grant Browser Permission First**
   - When you first visit the site, your browser will ask for notification permission
   - Tap **"Allow"** or **"Yes"** when prompted
   - If you previously denied, you'll need to enable it in browser settings (see below)

2. **Install as PWA (Recommended)**
   - This ensures notifications work even when the browser is closed
   - See "Installing as PWA" section below

---

## Android Devices

### Step 1: Grant Browser Notification Permission

#### Chrome on Android:
1. Open Chrome
2. Go to the FirebirdFit website
3. Tap the **3-dot menu** (⋮) in the top right
4. Tap **Settings** → **Site settings** → **Notifications**
5. Find "FirebirdFit" in the list
6. Make sure it's set to **"Allow"**

#### Firefox on Android:
1. Open Firefox
2. Go to the FirebirdFit website
3. Tap the **3-dot menu** (⋮)
4. Tap **Settings** → **Notifications**
5. Enable notifications for the site

### Step 2: Enable Lock Screen Notifications (Android)

#### Method 1: Through Android Settings
1. Open **Settings** on your phone
2. Tap **Apps** (or **Applications**)
3. Find and tap **Chrome** (or your browser)
4. Tap **Notifications**
5. Make sure **"Show on lock screen"** is enabled
6. Enable **"Allow notification dot"** (optional)
7. Enable **"Sound"** and **"Vibrate"** if desired

#### Method 2: Through Notification Settings
1. Open **Settings** → **Notifications**
2. Find **Chrome** (or your browser)
3. Tap on it
4. Enable **"Show on lock screen"**
5. Enable **"Wake screen"** (if available)
6. Set notification importance to **"High"** or **"Urgent"**

### Step 3: Install as PWA (Progressive Web App)

1. Open Chrome
2. Visit the FirebirdFit website
3. Tap the **3-dot menu** (⋮)
4. Tap **"Add to Home screen"** or **"Install app"**
5. Confirm by tapping **"Add"** or **"Install"**
6. The app icon will appear on your home screen
7. Open the app from the home screen icon (not the browser)

**Why install as PWA?**
- Notifications work even when the browser is closed
- Better battery efficiency
- More reliable notification delivery
- App-like experience

---

## iOS Devices (iPhone/iPad)

### Step 1: Grant Browser Notification Permission

#### Safari on iOS:
1. Open Safari
2. Go to the FirebirdFit website
3. Tap the **Share button** (square with arrow)
4. Scroll down and tap **"Add to Home Screen"**
5. Tap **"Add"** to install as PWA
6. Open the app from your home screen
7. When prompted, tap **"Allow"** for notifications

**Note:** iOS requires the site to be added to Home Screen before push notifications work.

### Step 2: Enable Lock Screen Notifications (iOS)

1. Open **Settings** on your iPhone/iPad
2. Tap **Notifications**
3. Scroll down and find **"FirebirdFit"** (or your browser if not installed as PWA)
4. Tap on it
5. Enable **"Allow Notifications"**
6. Enable **"Lock Screen"** (this is the key setting!)
7. Enable **"Banners"** or **"Alerts"** (your preference)
8. Enable **"Sounds"** and **"Badges"** if desired
9. Set **"Show Previews"** to **"Always"** or **"When Unlocked"**

### Step 3: Install as PWA (Required for iOS)

**iOS requires PWA installation for push notifications to work:**

1. Open Safari (Chrome on iOS doesn't support push notifications)
2. Visit the FirebirdFit website
3. Tap the **Share button** (square with arrow pointing up)
4. Scroll down in the share menu
5. Tap **"Add to Home Screen"**
6. Edit the name if desired (default: "FirebirdFit")
7. Tap **"Add"** in the top right
8. The app icon will appear on your home screen
9. **Open the app from the home screen icon** (not Safari)
10. Grant notification permission when prompted

**Important for iOS:**
- Push notifications **only work** if the site is added to Home Screen
- Must use Safari (not Chrome or other browsers)
- iOS 16.4 or later required for web push notifications
- Notifications work even when Safari is closed (once installed as PWA)

---

## Troubleshooting

### Notifications Not Appearing on Lock Screen?

#### Android:
1. Check if "Do Not Disturb" mode is enabled
2. Check if "Focus mode" is blocking notifications
3. Verify browser has notification permission
4. Make sure lock screen notifications are enabled for the browser
5. Try restarting your phone

#### iOS:
1. Make sure the site is **installed as PWA** (added to Home Screen)
2. Check if "Do Not Disturb" or "Focus" modes are enabled
3. Verify notification settings in iOS Settings
4. Make sure you're using Safari (not Chrome)
5. Check iOS version (16.4+ required)

### Screen Not Waking Up?

#### Android:
1. Go to Settings → Apps → [Your Browser] → Notifications
2. Enable **"Wake screen"** or **"Pop on screen"**
3. Set notification importance to **"High"** or **"Urgent"**

#### iOS:
- iOS typically shows notifications on lock screen without waking the screen
- To wake screen: Settings → Notifications → [App] → Enable "Sounds" and "Banners"
- Some iOS versions wake screen for high-priority notifications

### Notifications Not Working at All?

1. **Check browser permission:**
   - Android: Settings → Apps → [Browser] → Notifications → Site settings
   - iOS: Settings → Notifications → [App Name]

2. **Re-grant permission:**
   - Visit the site again
   - Look for notification permission prompt
   - Or clear site data and revisit

3. **Check site settings:**
   - Visit `/test-notifications` page on the site
   - Check if "Notification Permission" shows "granted"
   - Check if "Push Subscription" shows "Subscribed"

4. **Verify PWA installation:**
   - Make sure you opened the app from the home screen icon
   - Not from the browser bookmark

---

## Quick Checklist

### For Android Users:
- [ ] Granted notification permission in browser
- [ ] Enabled lock screen notifications for browser in Android Settings
- [ ] Installed as PWA (Add to Home Screen)
- [ ] Opened app from home screen icon
- [ ] Verified notification settings show "Show on lock screen" enabled

### For iOS Users:
- [ ] Using Safari (not Chrome)
- [ ] Added site to Home Screen (PWA installation)
- [ ] Opened app from home screen icon (not Safari)
- [ ] Granted notification permission when prompted
- [ ] Enabled "Lock Screen" in iOS Settings → Notifications → [App Name]
- [ ] iOS version 16.4 or later

---

## Testing Your Setup

1. Visit the `/test-notifications` page on the site
2. Click **"Send Test Notification"**
3. Lock your phone
4. Wait a few seconds
5. The notification should appear on your lock screen
6. If the screen wakes up, that's working too!

---

## Additional Tips

### Battery Optimization (Android)
- Go to Settings → Battery → Battery optimization
- Find your browser
- Set to **"Don't optimize"** to ensure notifications aren't delayed

### Background App Refresh (iOS)
- Settings → General → Background App Refresh
- Make sure it's enabled (helps with notification delivery)

### Notification Sounds
- Make sure your phone isn't on silent/vibrate mode
- Check volume settings
- Enable notification sounds in app/browser settings

---

## Need Help?

If notifications still aren't working:
1. Check the `/test-notifications` diagnostic page
2. Review browser console for errors
3. Verify all steps above are completed
4. Try on a different device to isolate the issue

