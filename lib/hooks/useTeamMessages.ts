import { useState, useEffect, useCallback, useMemo } from 'react'
import { getUserChats, ChatData, formatTimeAgo, generateAvatar } from '@/lib/utils'
import { useAppState } from '@/contexts/AppStateContext'

export function useTeamMessages(userId: string | undefined) {
  const [teamMessages, setTeamMessages] = useState<any[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(true)
  const { invalidateCache } = useAppState()

  useEffect(() => {
    const fetchMessages = async () => {
      if (!userId) {
        setTeamMessages([])
        setIsLoadingMessages(false)
        return
      }

      try {
        setIsLoadingMessages(true)
        const chats = await getUserChats(userId)
        
        // Transform ChatData to match the expected format for the dashboard
        const transformedMessages = chats.map((chat: ChatData) => ({
          id: chat.id,
          name: chat.name,
          lastMessage: chat.lastMessage || 'No messages yet',
          time: chat.lastMessageTime ? formatTimeAgo(chat.lastMessageTime) : 'Just now',
          unread: chat.unread,
          avatar: generateAvatar(chat.name),
          memberCount: chat.memberCount,
          conversationId: chat.id
        }))
        
        setTeamMessages(transformedMessages || [])
      } catch (error) {
        console.error('Error fetching team messages:', error)
        setTeamMessages([])
      } finally {
        setIsLoadingMessages(false)
      }
    }

    fetchMessages()
  }, [userId])

  // Removed the problematic AppState listener that was causing infinite loops

  // Remove duplicate useEffect - the first one already handles fetching

  const refetch = useCallback(() => {
    if (userId) {
      const fetchMessages = async () => {
        try {
          setIsLoadingMessages(true)
          
          // Clear cache to ensure fresh data
          invalidateCache(['chats'])
          
          const chats = await getUserChats(userId)
          
          // Transform ChatData to match the expected format for the dashboard
          const transformedMessages = chats.map((chat: ChatData) => ({
            id: chat.id,
            name: chat.name,
            lastMessage: chat.lastMessage || 'No messages yet',
            time: chat.lastMessageTime ? formatTimeAgo(chat.lastMessageTime) : 'Just now',
            unread: chat.unread,
            avatar: generateAvatar(chat.name),
            memberCount: chat.memberCount,
            conversationId: chat.id
          }))
          
          setTeamMessages(transformedMessages || [])
        } catch (error) {
          console.error('Error refetching team messages:', error)
          setTeamMessages([])
        } finally {
          setIsLoadingMessages(false)
        }
      }
      fetchMessages()
    }
  }, [userId, invalidateCache])

  // Memoize the return object to prevent unnecessary re-renders
  const memoizedReturn = useMemo(() => ({
    teamMessages,
    isLoadingMessages,
    refetch
  }), [teamMessages, isLoadingMessages, refetch])

  return memoizedReturn
}
