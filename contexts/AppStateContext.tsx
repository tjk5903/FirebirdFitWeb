'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { 
  getUserWorkouts, 
  getUserTeams, 
  getTeamMembers,
  getUserChats,
  ChatData,
  ChatMemberDisplay
} from '@/lib/utils'

// Define types for workouts and teams
export interface WorkoutData {
  id: string
  team_id: string
  title: string
  description: string | null
  assigned_to: string | null
  date_assigned: string
  created_at: string
}

export interface TeamData {
  id: string
  name: string
  joinCode: string
  role: string
}

interface AppStateContextType {
  // Data states
  workouts: WorkoutData[]
  teams: TeamData[]
  teamMembers: Array<{
    id: string
    name: string
    email: string
    role: string
  }>
  chats: ChatData[]
  
  // Loading states
  isLoadingWorkouts: boolean
  isLoadingTeams: boolean
  isLoadingTeamMembers: boolean
  isLoadingChats: boolean
  
  // Error states
  workoutsError: string | null
  teamsError: string | null
  teamMembersError: string | null
  chatsError: string | null
  
  // Actions
  refreshWorkouts: () => Promise<void>
  refreshTeams: () => Promise<void>
  refreshTeamMembers: () => Promise<void>
  refreshChats: () => Promise<void>
  refreshAll: () => Promise<void>
  
  // Data updates
  updateWorkouts: (workouts: WorkoutData[]) => void
  updateTeams: (teams: TeamData[]) => void
  updateTeamMembers: (members: ChatMemberDisplay[]) => void
  updateChats: (chats: ChatData[]) => void
  
  // Clear all data (on logout)
  clearAllData: () => void
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined)

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  
  // Data states
  const [workouts, setWorkouts] = useState<WorkoutData[]>([])
  const [teams, setTeams] = useState<TeamData[]>([])
  const [teamMembers, setTeamMembers] = useState<Array<{
    id: string
    name: string
    email: string
    role: string
  }>>([])
  const [chats, setChats] = useState<ChatData[]>([])
  
  // Loading states
  const [isLoadingWorkouts, setIsLoadingWorkouts] = useState(false)
  const [isLoadingTeams, setIsLoadingTeams] = useState(false)
  const [isLoadingTeamMembers, setIsLoadingTeamMembers] = useState(false)
  const [isLoadingChats, setIsLoadingChats] = useState(false)
  
  // Error states
  const [workoutsError, setWorkoutsError] = useState<string | null>(null)
  const [teamsError, setTeamsError] = useState<string | null>(null)
  const [teamMembersError, setTeamMembersError] = useState<string | null>(null)
  const [chatsError, setChatsError] = useState<string | null>(null)
  
  // Request guards to prevent multiple simultaneous requests
  const [isRequestingWorkouts, setIsRequestingWorkouts] = useState(false)
  const [isRequestingTeams, setIsRequestingTeams] = useState(false)
  const [isRequestingTeamMembers, setIsRequestingTeamMembers] = useState(false)
  const [isRequestingChats, setIsRequestingChats] = useState(false)
  
  // Data fetching functions
  const refreshWorkouts = useCallback(async (showLoading = true) => {
    if (!user?.id || isRequestingWorkouts) return
    
    setIsRequestingWorkouts(true)
    // Don't show loading if we already have data or if it's a background refresh
    if (showLoading && workouts.length === 0) {
      setIsLoadingWorkouts(true)
    }
    setWorkoutsError(null)
    
    try {
      const fetchedWorkouts = await getUserWorkouts(user.id)
      setWorkouts(fetchedWorkouts)
    } catch (error) {
      console.error('Error fetching workouts:', error)
      setWorkoutsError('Failed to load workouts')
    } finally {
      setIsRequestingWorkouts(false)
      if (showLoading) {
        setIsLoadingWorkouts(false)
      }
    }
  }, [user?.id])
  
  const refreshTeams = useCallback(async (showLoading = true) => {
    if (!user?.id || isRequestingTeams) return
    
    setIsRequestingTeams(true)
    // Don't show loading if we already have data
    if (showLoading && teams.length === 0) {
      setIsLoadingTeams(true)
    }
    setTeamsError(null)
    
    try {
      const fetchedTeams = await getUserTeams(user.id)
      setTeams(fetchedTeams)
    } catch (error) {
      console.error('Error fetching teams:', error)
      setTeamsError('Failed to load teams')
    } finally {
      setIsRequestingTeams(false)
      if (showLoading) {
        setIsLoadingTeams(false)
      }
    }
  }, [user?.id])
  
  const refreshTeamMembers = useCallback(async (showLoading = true) => {
    if (!user?.id || isRequestingTeamMembers) return
    
    // Only fetch team members if user has teams
    if (teams.length === 0) {
      console.log('No teams found, skipping team members fetch')
      setTeamMembers([])
      setIsLoadingTeamMembers(false)
      return
    }
    
    setIsRequestingTeamMembers(true)
    // Don't show loading if we already have data
    if (showLoading && teamMembers.length === 0) {
      setIsLoadingTeamMembers(true)
    }
    setTeamMembersError(null)
    
    try {
      const fetchedMembers = await getTeamMembers(user.id)
      setTeamMembers(fetchedMembers)
    } catch (error) {
      console.error('Error fetching team members:', error)
      setTeamMembersError('Failed to load team members')
    } finally {
      setIsRequestingTeamMembers(false)
      if (showLoading) {
        setIsLoadingTeamMembers(false)
      }
    }
  }, [user?.id, teams.length])
  
  const refreshChats = useCallback(async (showLoading = true) => {
    if (!user?.id || isRequestingChats) return
    
    setIsRequestingChats(true)
    // Don't show loading if we already have data
    if (showLoading && chats.length === 0) {
      setIsLoadingChats(true)
    }
    setChatsError(null)
    
    try {
      const fetchedChats = await getUserChats(user.id)
      setChats(fetchedChats)
    } catch (error) {
      console.error('Error fetching chats:', error)
      setChatsError('Failed to load chats')
    } finally {
      setIsRequestingChats(false)
      if (showLoading) {
        setIsLoadingChats(false)
      }
    }
  }, [user?.id])
  
  // Refresh all data
  const refreshAll = useCallback(async (showLoading = true) => {
    if (!user?.id) return
    
    await Promise.all([
      refreshWorkouts(showLoading),
      refreshTeams(showLoading),
      refreshTeamMembers(showLoading),
      refreshChats(showLoading)
    ])
  }, [user?.id, refreshWorkouts, refreshTeams, refreshTeamMembers, refreshChats])
  
  // Data update functions
  const updateWorkouts = useCallback((newWorkouts: WorkoutData[]) => {
    setWorkouts(newWorkouts)
  }, [])
  
  const updateTeams = useCallback((newTeams: TeamData[]) => {
    setTeams(newTeams)
  }, [])
  
  const updateTeamMembers = useCallback((newMembers: Array<{
    id: string
    name: string
    email: string
    role: string
  }>) => {
    setTeamMembers(newMembers)
  }, [])
  
  const updateChats = useCallback((newChats: ChatData[]) => {
    setChats(newChats)
  }, [])
  
  // Clear all data
  const clearAllData = useCallback(() => {
    setWorkouts([])
    setTeams([])
    setTeamMembers([])
    setChats([])
    setWorkoutsError(null)
    setTeamsError(null)
    setTeamMembersError(null)
    setChatsError(null)
    // Reset request guards
    setIsRequestingWorkouts(false)
    setIsRequestingTeams(false)
    setIsRequestingTeamMembers(false)
    setIsRequestingChats(false)
  }, [])
  
  // Track if data has been loaded from localStorage
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false)
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0)
  
  // FAILSAFE: Never let loading states run forever
  useEffect(() => {
    const failsafeTimeout = setTimeout(() => {
      console.log('Failsafe: Clearing all loading states and request guards')
      setIsLoadingWorkouts(false)
      setIsLoadingTeams(false)
      setIsLoadingTeamMembers(false)
      setIsLoadingChats(false)
      // Also clear request guards
      setIsRequestingWorkouts(false)
      setIsRequestingTeams(false)
      setIsRequestingTeamMembers(false)
      setIsRequestingChats(false)
    }, 2000) // 2 second max loading time
    
    return () => clearTimeout(failsafeTimeout)
  }, [isLoadingWorkouts, isLoadingTeams, isLoadingTeamMembers, isLoadingChats])
  
  // Simple rule: Always show cached data first, then refresh in background
  useEffect(() => {
    if (user?.id) {
      // Check if we already have data loaded (prevent re-loading on tab switch)
      const hasDataLoaded = workouts.length > 0 || teams.length > 0 || teamMembers.length > 0 || chats.length > 0
      
      if (hasDataLoaded) {
        console.log('Data already loaded, skipping fetch')
        return
      }
      
      // Always try to load from cache first
      const hasAnyCachedData = localStorage.getItem(`workouts_${user.id}`) || 
                               localStorage.getItem(`teams_${user.id}`) || 
                               localStorage.getItem(`teamMembers_${user.id}`) || 
                               localStorage.getItem(`chats_${user.id}`)
      
      if (hasAnyCachedData) {
        console.log('Found cached data, loading instantly')
        // Load from cache immediately (no loading state)
        // Data will be restored by the localStorage effect below
      } else {
        console.log('No cached data, fetching from server')
        // Only show loading if no cached data exists
        refreshAll(true)
      }
    } else {
      // Clear data when user logs out
      clearAllData()
      setHasLoadedFromStorage(false)
    }
  }, [user?.id]) // Removed dependencies that cause unnecessary re-runs
  
  // Persist data to localStorage for tab switching
  useEffect(() => {
    if (user?.id && workouts.length > 0) {
      localStorage.setItem(`workouts_${user.id}`, JSON.stringify(workouts))
    }
  }, [workouts, user?.id])
  
  useEffect(() => {
    if (user?.id && teams.length > 0) {
      localStorage.setItem(`teams_${user.id}`, JSON.stringify(teams))
    }
  }, [teams, user?.id])
  
  useEffect(() => {
    if (user?.id && teamMembers.length > 0) {
      localStorage.setItem(`teamMembers_${user.id}`, JSON.stringify(teamMembers))
    }
  }, [teamMembers, user?.id])
  
  useEffect(() => {
    if (user?.id && chats.length > 0) {
      localStorage.setItem(`chats_${user.id}`, JSON.stringify(chats))
    }
  }, [chats, user?.id])
  
  // Restore data from localStorage IMMEDIATELY on mount - SIMPLE VERSION
  useEffect(() => {
    if (user?.id) {
      // Restore all data from cache instantly
      const restoreFromCache = () => {
        try {
          const savedWorkouts = localStorage.getItem(`workouts_${user.id}`)
          if (savedWorkouts) setWorkouts(JSON.parse(savedWorkouts))
          
          const savedTeams = localStorage.getItem(`teams_${user.id}`)
          if (savedTeams) setTeams(JSON.parse(savedTeams))
          
          const savedTeamMembers = localStorage.getItem(`teamMembers_${user.id}`)
          if (savedTeamMembers) setTeamMembers(JSON.parse(savedTeamMembers))
          
          const savedChats = localStorage.getItem(`chats_${user.id}`)
          if (savedChats) setChats(JSON.parse(savedChats))
          
          setHasLoadedFromStorage(true)
          
          // If we restored data from cache, ensure loading states are false
          if (savedWorkouts || savedTeams || savedTeamMembers || savedChats) {
            setIsLoadingWorkouts(false)
            setIsLoadingTeams(false)
            setIsLoadingTeamMembers(false)
            setIsLoadingChats(false)
            console.log('Data restored from cache instantly - loading states cleared')
          }
        } catch (error) {
          console.error('Error restoring from cache:', error)
        }
      }
      
      // Restore immediately
      restoreFromCache()
      
      // Also refresh in background to keep data fresh
      setTimeout(() => {
        refreshAll(false) // Silent background refresh
      }, 2000)
    }
  }, [user?.id, refreshAll])
  
  // Background refresh every 5 minutes (only if user is active)
  useEffect(() => {
    if (!user?.id || !hasLoadedFromStorage) return
    
    const now = Date.now()
    const fiveMinutes = 5 * 60 * 1000
    
    // Only refresh if it's been more than 5 minutes since last refresh
    if (now - lastRefreshTime > fiveMinutes) {
      console.log('Background refresh triggered')
      setLastRefreshTime(now)
      refreshAll(false) // Don't show loading states for background refresh
    }
    
    // Set up interval for future refreshes
    const interval = setInterval(() => {
      const currentTime = Date.now()
      if (currentTime - lastRefreshTime > fiveMinutes) {
        console.log('Scheduled background refresh triggered')
        setLastRefreshTime(currentTime)
        refreshAll(false) // Don't show loading states for background refresh
      }
    }, fiveMinutes)
    
    return () => clearInterval(interval)
  }, [user?.id, hasLoadedFromStorage, lastRefreshTime, refreshAll])
  
  const value: AppStateContextType = {
    // Data states
    workouts,
    teams,
    teamMembers,
    chats,
    
    // Loading states
    isLoadingWorkouts,
    isLoadingTeams,
    isLoadingTeamMembers,
    isLoadingChats,
    
    // Error states
    workoutsError,
    teamsError,
    teamMembersError,
    chatsError,
    
    // Actions
    refreshWorkouts,
    refreshTeams,
    refreshTeamMembers,
    refreshChats,
    refreshAll,
    
    // Data updates
    updateWorkouts,
    updateTeams,
    updateTeamMembers,
    updateChats,
    
    // Clear all data
    clearAllData
  }
  
  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  )
}

export function useAppState() {
  const context = useContext(AppStateContext)
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider')
  }
  return context
}
