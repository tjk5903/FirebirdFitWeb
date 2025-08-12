import { useState, useEffect } from 'react'
import { getTeamMessages } from '@/lib/utils'

export interface TeamMessage {
  id: string
  name: string
  lastMessage: string
  time: string
  unread: boolean
  avatar: string
  type: 'athlete' | 'group'
  conversationId: string
}

export function useTeamMessages(userId: string | null | undefined) {
  const [teamMessages, setTeamMessages] = useState<TeamMessage[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadTeamMessages = async () => {
      if (!userId) return
      
      setIsLoadingMessages(true)
      setError(null)
      try {
        const messages = await getTeamMessages(userId)
        setTeamMessages(messages)
      } catch (error) {
        console.error('Error loading team messages:', error)
        setError('Failed to load messages')
        // Keep empty array on error
      } finally {
        setIsLoadingMessages(false)
      }
    }

    loadTeamMessages()
  }, [userId])

  const refreshMessages = async () => {
    if (!userId) return
    
    try {
      const messages = await getTeamMessages(userId)
      setTeamMessages(messages)
      setError(null)
    } catch (error) {
      console.error('Error refreshing team messages:', error)
      setError('Failed to refresh messages')
    }
  }

  return {
    teamMessages,
    isLoadingMessages,
    error,
    refreshMessages
  }
}
