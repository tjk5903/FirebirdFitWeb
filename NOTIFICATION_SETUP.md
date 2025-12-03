# Push Notification Setup Guide

This guide will help you set up and test the push notification system for FirebirdFit.

## Prerequisites

- Node.js and npm installed
- Supabase project with database access
- HTTPS or localhost (required for push notifications)

## Step 1: Install Dependencies

The required dependencies should already be installed, but if not:

```bash
npm install
```

This will install `web-push` and `@types/web-push`.

## Step 2: Generate VAPID Keys

VAPID (Voluntary Application Server Identification) keys are required for push notifications. Generate them using:

```bash
npm run generate-vapid-keys
```

This will output something like:
```
VAPID Keys Generated:

NEXT_PUBLIC_VAPID_PUBLIC_KEY=BEk...your-public-key...
VAPID_PRIVATE_KEY=your-private-key...
```

## Step 3: Configure Environment Variables

Create a `.env.local` file in the root of your project (if it doesn't exist) and add:

```env
# VAPID Keys for Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-key-here
VAPID_PRIVATE_KEY=your-private-key-here
VAPID_SUBJECT=mailto:your-email@example.com
```

**Important:**
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is safe to expose (used in client code)
- `VAPID_PRIVATE_KEY` must be kept secret (only used server-side)
- `VAPID_SUBJECT` should be your contact email or website URL

## Step 4: Set Up Database

Run the SQL schema file to create the `push_subscriptions` table:

1. Open your Supabase dashboard
2. Go to SQL Editor
3. Run the SQL from `database/push_subscriptions_schema.sql`

Or manually create the table with:
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key to users, unique)
- `subscription` (JSONB, stores push subscription object)
- `created_at` (timestamp)
- `updated_at` (timestamp)

## Step 5: Restart Development Server

After adding environment variables, restart your Next.js development server:

```bash
npm run dev
```

## Step 6: Test the Notification System

1. Navigate to `/test-notifications` in your app
2. The diagnostic page will show:
   - Browser support status
   - Notification permission status
   - Service worker registration
   - Push subscription status
   - VAPID key configuration
   - Database subscriptions
   - Secure context (HTTPS/localhost)

3. Click "Subscribe to Notifications" and allow notifications when prompted
4. Click "Send Test Notification" to verify everything works

## Troubleshooting

### Notifications Not Appearing

1. **Check Browser Console**: Look for error messages in the browser console
2. **Verify VAPID Keys**: Ensure keys are correctly set in `.env.local`
3. **Check Service Worker**: Open DevTools > Application > Service Workers to verify registration
4. **Verify Permissions**: Check browser notification settings
5. **Check HTTPS**: Push notifications require HTTPS (or localhost for development)

### "VAPID keys not configured" Error

- Ensure `.env.local` exists and contains the VAPID keys
- Restart the development server after adding environment variables
- Verify the keys are correctly formatted (no extra spaces or quotes)

### "Subscription expired" Error

- This means the push subscription is no longer valid
- The system will automatically remove expired subscriptions
- User needs to re-subscribe to notifications

### Service Worker Not Registering

- Check browser console for errors
- Verify `public/sw.js` exists and is accessible
- Clear browser cache and reload
- Check if browser supports service workers

### Database Errors

- Verify the `push_subscriptions` table exists
- Check Row Level Security (RLS) policies allow user access
- Ensure user is authenticated when subscribing

## How It Works

1. **User Subscribes**: When a user enables notifications, a push subscription is created and saved to the database
2. **Notification Created**: When a notification is created in the database, the `handleNotificationCreated` function is called
3. **Push Sent**: The system fetches the user's push subscription from the database
4. **API Route**: The subscription and notification data are sent to `/api/push/send`
5. **Web Push**: The server-side API route uses the `web-push` library to send the notification
6. **Service Worker**: The browser's service worker receives the push event and displays the notification

## Security Notes

- VAPID private key is never exposed to the client
- All push sending happens server-side via API route
- Database subscriptions are protected by Row Level Security (RLS)
- Users can only access their own subscriptions

## Production Deployment

When deploying to production:

1. Set environment variables in your hosting platform (Vercel, etc.)
2. Ensure your domain uses HTTPS
3. Update `VAPID_SUBJECT` to your production contact email
4. Test notifications in production environment
5. Monitor error logs for subscription issues

## Support

If you encounter issues:
1. Check the diagnostic page at `/test-notifications`
2. Review browser console logs
3. Check server logs for API route errors
4. Verify all environment variables are set correctly

