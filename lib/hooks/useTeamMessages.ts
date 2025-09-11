import { useState, useEffect } from 'react'
import { getUserChats, ChatData, formatTimeAgo, generateAvatar } from '@/lib/utils'

export function useTeamMessages(userId: string | undefined) {
  const [teamMessages, setTeamMessages] = useState<any[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(true)

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

  return { teamMessages, isLoadingMessages }
}
