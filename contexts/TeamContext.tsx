'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getUserTeams } from '@/lib/utils'

interface TeamContextType {
  selectedTeamId: string | null
  setSelectedTeamId: (teamId: string | null) => void
  userTeams: Array<{ id: string, name: string, joinCode: string, role: string }>
  isLoading: boolean
  refreshTeams: () => Promise<void>
}

const TeamContext = createContext<TeamContextType | undefined>(undefined)

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [selectedTeamId, setSelectedTeamIdState] = useState<string | null>(null)
  const [userTeams, setUserTeams] = useState<Array<{ id: string, name: string, joinCode: string, role: string }>>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load teams for the current user
  const refreshTeams = useCallback(async () => {
    if (!user?.id) {
      setUserTeams([])
      setSelectedTeamIdState(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const teams = await getUserTeams(user.id)
      setUserTeams(teams)

      // Auto-select logic:
      // 1. If user has exactly 1 team, auto-select it
      // 2. If user has multiple teams, check localStorage for saved selection
      // 3. If no saved selection, select the first team
      if (teams.length === 1) {
        // Single team - auto-select
        setSelectedTeamIdState(teams[0].id)
        // Clear any old localStorage entry
        localStorage.removeItem(`selectedTeam_${user.id}`)
      } else if (teams.length > 1) {
        // Multiple teams - check localStorage
        const savedTeamId = localStorage.getItem(`selectedTeam_${user.id}`)
        const validSavedTeam = teams.find(t => t.id === savedTeamId)
        
        if (validSavedTeam) {
          // Use saved selection
          setSelectedTeamIdState(validSavedTeam.id)
        } else {
          // No valid saved selection, use first team
          setSelectedTeamIdState(teams[0].id)
          localStorage.setItem(`selectedTeam_${user.id}`, teams[0].id)
        }
      } else {
        // No teams
        setSelectedTeamIdState(null)
        localStorage.removeItem(`selectedTeam_${user.id}`)
      }
    } catch (error) {
      console.error('Error loading teams:', error)
      setUserTeams([])
      setSelectedTeamIdState(null)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  // Load teams when user changes
  useEffect(() => {
    refreshTeams()
  }, [refreshTeams])

  // Persist selected team to localStorage when it changes
  useEffect(() => {
    if (user?.id && selectedTeamId) {
      localStorage.setItem(`selectedTeam_${user.id}`, selectedTeamId)
    } else if (user?.id && !selectedTeamId) {
      localStorage.removeItem(`selectedTeam_${user.id}`)
    }
  }, [selectedTeamId, user?.id])

  // Clear selection when user logs out
  useEffect(() => {
    if (!user) {
      setSelectedTeamIdState(null)
      setUserTeams([])
    }
  }, [user])

  const setSelectedTeamId = useCallback((teamId: string | null) => {
    setSelectedTeamIdState(teamId)
  }, [])

  const value: TeamContextType = {
    selectedTeamId,
    setSelectedTeamId,
    userTeams,
    isLoading,
    refreshTeams
  }

  return (
    <TeamContext.Provider value={value}>
      {children}
    </TeamContext.Provider>
  )
}

export function useTeamContext() {
  const context = useContext(TeamContext)
  if (context === undefined) {
    throw new Error('useTeamContext must be used within a TeamProvider')
  }
  return context
}

