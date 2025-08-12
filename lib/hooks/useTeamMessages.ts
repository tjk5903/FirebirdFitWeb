import { useState, useEffect } from 'react'
import { getTeamMessages } from '@/lib/utils'

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
        const messages = await getTeamMessages(userId)
        setTeamMessages(messages || [])
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
