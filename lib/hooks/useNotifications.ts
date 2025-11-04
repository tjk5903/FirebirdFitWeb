'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { setupNotificationListener, cleanupNotificationListener } from '@/lib/notificationHandler'

export interface Notification {
  id: string
  user_id: string
  team_id: string
  type: 'workout' | 'event' | 'message'
  title: string
  message: string
  data: any
  read: boolean
  created_at: string
}

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([])
      setUnreadCount(0)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      console.log('🔔 Fetching notifications for user:', userId)

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50) // Get last 50 notifications

      if (error) {
        console.error('❌ Error fetching notifications:', error)
        setError(error.message)
        return
      }

      console.log('✅ Fetched notifications:', data?.length || 0)
      setNotifications(data || [])
      
      // Count unread notifications
      const unread = data?.filter(n => !n.read).length || 0
      setUnreadCount(unread)
      console.log('🔢 Unread count:', unread)

    } catch (err) {
      console.error('❌ Error in fetchNotifications:', err)
      setError('Failed to fetch notifications')
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      console.log('✅ Marking notification as read:', notificationId)

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) {
        console.error('❌ Error marking notification as read:', error)
        return
      }

      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      )
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1))
      
    } catch (err) {
      console.error('❌ Error in markAsRead:', err)
    }
  }, [])

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!userId || unreadCount === 0) return

    try {
      console.log('✅ Marking all notifications as read for user:', userId)

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) {
        console.error('❌ Error marking all notifications as read:', error)
        return
      }

      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      )
      setUnreadCount(0)
      
    } catch (err) {
      console.error('❌ Error in markAllAsRead:', err)
    }
  }, [userId, unreadCount])

  // Set up real-time subscription
  useEffect(() => {
    if (!userId) return

    console.log('🔄 Setting up real-time notifications subscription for user:', userId)

    // Set up in-app notification subscription
    const inAppSubscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('🔔 New notification received:', payload.new)
          const newNotification = payload.new as Notification
          
          // Add to notifications list
          setNotifications(prev => [newNotification, ...prev])
          
          // Increment unread count
          setUnreadCount(prev => prev + 1)
        }
      )
      .subscribe()

    // Set up push notification listener
    const pushSubscription = setupNotificationListener(userId)

    return () => {
      console.log('🔄 Cleaning up notifications subscription')
      inAppSubscription.unsubscribe()
      cleanupNotificationListener(pushSubscription)
    }
  }, [userId])

  // Initial fetch
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications
  }
}
