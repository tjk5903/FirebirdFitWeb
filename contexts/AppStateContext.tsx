'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
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
  forceRefreshAll: () => Promise<void>
  
  // Data updates
  updateWorkouts: (workouts: WorkoutData[]) => void
  removeWorkout: (workoutId: string) => void
  cleanupStaleData: () => Promise<void>
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
  
  // Data fetching functions with improved error handling
  const refreshWorkouts = useCallback(async (showLoading = true) => {
    if (!user?.id || isRequestingWorkouts) return
    
    setIsRequestingWorkouts(true)
    setWorkoutsError(null)
    
    // Show loading only if we have no data AND showLoading is true
    if (showLoading && workouts.length === 0) {
      setIsLoadingWorkouts(true)
    }
    
    try {
      // Use a more resilient approach for workouts - no timeout with indexes
      const fetchedWorkouts = await getUserWorkouts(user.id) as any
      
      setWorkouts(fetchedWorkouts || [])
      console.log('✅ Workouts loaded successfully:', fetchedWorkouts?.length || 0)
    } catch (error: any) {
      console.error('❌ Error fetching workouts:', error)
      
      // More specific error messages
      if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        setWorkoutsError('Network error. Please check your connection and try again.')
      } else if (error?.message?.includes('permission') || error?.message?.includes('unauthorized')) {
        setWorkoutsError('Permission denied. Please refresh the page and try again.')
      } else {
        setWorkoutsError('Failed to load workouts. Please try again.')
      }
    } finally {
      setIsRequestingWorkouts(false)
      if (showLoading) {
        setIsLoadingWorkouts(false)
      }
    }
  }, [user?.id, workouts.length])
  
  const refreshTeams = useCallback(async (showLoading = true) => {
    if (!user?.id || isRequestingTeams) {
      console.log('🛑 refreshTeams: Blocked - user?.id:', user?.id, 'isRequestingTeams:', isRequestingTeams)
      return
    }
    
    console.log('🔄 refreshTeams: Starting team refresh for user:', user.id)
    console.log('   - showLoading:', showLoading)
    console.log('   - current teams.length:', teams.length)
    
    setIsRequestingTeams(true)
    // Show loading only if we have no data AND showLoading is true
    if (showLoading && teams.length === 0) {
      console.log('📊 refreshTeams: Setting loading state to true')
      setIsLoadingTeams(true)
    }
    setTeamsError(null)
    
    try {
      console.log('📞 refreshTeams: Calling getUserTeams...')
      
      // Use a more resilient approach for teams - no timeout with indexes
      const fetchedTeams = await getUserTeams(user.id) as any
      
      console.log('✅ refreshTeams: Received teams:', fetchedTeams)
      setTeams(fetchedTeams || [])
      
      // Cache the teams
      try {
        localStorage.setItem(`teams_${user.id}`, JSON.stringify(fetchedTeams))
        console.log('💾 refreshTeams: Teams cached successfully')
      } catch (cacheError) {
        console.warn('⚠️ refreshTeams: Failed to cache teams:', cacheError)
      }
    } catch (error: any) {
      console.error('🚨 refreshTeams: Error fetching teams:', error)
      
      // More specific error messages
      if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        setTeamsError('Network error. Please check your connection and try again.')
      } else if (error?.message?.includes('permission') || error?.message?.includes('unauthorized')) {
        setTeamsError('Permission denied. Please refresh the page and try again.')
      } else {
        setTeamsError('Failed to load teams. Please try again.')
      }
    } finally {
      setIsRequestingTeams(false)
      if (showLoading) {
        setIsLoadingTeams(false)
      }
      console.log('🏁 refreshTeams: Completed')
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
    // Show loading only if we have no data AND showLoading is true
    if (showLoading && teamMembers.length === 0) {
      setIsLoadingTeamMembers(true)
    }
    setTeamMembersError(null)
    
    try {
      const fetchedMembers = await getTeamMembers(user.id)
      setTeamMembers(fetchedMembers)
    } catch (error: any) {
      console.error('❌ Error fetching team members:', error)
      
      // More specific error messages
      if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        setTeamMembersError('Network error. Please check your connection and try again.')
      } else if (error?.message?.includes('permission') || error?.message?.includes('unauthorized')) {
        setTeamMembersError('Permission denied. Please refresh the page and try again.')
      } else {
        setTeamMembersError('Failed to load team members. Please try again.')
      }
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
    // Show loading only if we have no data AND showLoading is true
    if (showLoading && chats.length === 0) {
      setIsLoadingChats(true)
    }
    setChatsError(null)
    
    try {
      const fetchedChats = await getUserChats(user.id)
      setChats(fetchedChats)
    } catch (error: any) {
      console.error('❌ Error fetching chats:', error)
      
      // More specific error messages
      if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        setChatsError('Network error. Please check your connection and try again.')
      } else if (error?.message?.includes('permission') || error?.message?.includes('unauthorized')) {
        setChatsError('Permission denied. Please refresh the page and try again.')
      } else {
        setChatsError('Failed to load chats. Please try again.')
      }
    } finally {
      setIsRequestingChats(false)
      if (showLoading) {
        setIsLoadingChats(false)
      }
    }
  }, [user?.id])
  
  // Optimized data fetching with deduplication and throttling
  const optimizedRefreshAll = useCallback(async (showLoading = true) => {
    if (!user?.id || isInitializing.current) return

    const now = Date.now()
    
    // Throttle data fetches to prevent excessive calls
    if (now - lastDataFetch.current < DATA_FETCH_THROTTLE) {
      console.log('⏱️ Data fetch throttled')
      return
    }
    
    // Prevent multiple simultaneous refresh operations
    if (refreshPromise.current) {
      console.log('🔄 Refresh already in progress, waiting...')
      return refreshPromise.current
    }

    lastDataFetch.current = now
    isInitializing.current = true

    refreshPromise.current = (async () => {
      try {
        console.log('🔄 Starting optimized data refresh')
        
        // Check if we have any data loaded
        const hasDataLoaded = workouts.length > 0 || teams.length > 0 || teamMembers.length > 0 || chats.length > 0
        
        if (hasDataLoaded && !showLoading) {
          console.log('📱 Data already loaded, skipping refresh')
          return
        }
        
        // Fast UI approach: Show cached data immediately, then update in background
        if (hasDataLoaded) {
          console.log('⚡ Fast refresh: Using cached data, updating in background')
          
          // Start background refresh without loading states
          Promise.allSettled([
            refreshWorkouts(false),
            refreshTeams(false), 
            refreshTeamMembers(false),
            refreshChats(false)
          ]).then((results) => {
            console.log('🔄 Background refresh completed')
            
            // Log any failures but continue with successful data
            results.forEach((result, index) => {
              const dataTypes = ['workouts', 'teams', 'teamMembers', 'chats']
              if (result.status === 'rejected') {
                console.warn(`⚠️ Background refresh failed for ${dataTypes[index]}:`, result.reason)
              }
            })
            
            cleanupStaleData().catch(() => {})
            checkDatabaseHealth().catch(() => {})
          })
          
        } else {
          console.log('⏳ Fresh load: Showing loading states for new data')
          
          // Use Promise.allSettled to prevent cascading failures
          // This ensures that if one data source fails, others still load
          const results = await Promise.allSettled([
            refreshWorkouts(true),
            refreshTeams(true), 
            refreshTeamMembers(true),
            refreshChats(true)
          ])
          
          // Log any failures but don't let them crash the app
          results.forEach((result, index) => {
            const dataTypes = ['workouts', 'teams', 'teamMembers', 'chats']
            if (result.status === 'rejected') {
              console.warn(`⚠️ Failed to load ${dataTypes[index]}:`, result.reason)
            } else {
              console.log(`✅ Successfully loaded ${dataTypes[index]}`)
            }
          })
          
          // Clean up after fresh load
          cleanupStaleData().catch(() => {})
          checkDatabaseHealth().catch(() => {})
        }
        
        setLastRefreshTime(now)
        console.log('✅ Data refresh completed successfully')
        
      } catch (error) {
        console.error('❌ Error during data refresh:', error)
      } finally {
        isInitializing.current = false
        refreshPromise.current = null
      }
    })()

    return refreshPromise.current
  }, [user?.id, workouts.length, teams.length, teamMembers.length, chats.length, refreshWorkouts, refreshTeams, refreshTeamMembers, refreshChats])

  // Refresh all data - now uses optimized version
  const refreshAll = useCallback(async (showLoading = true) => {
    return optimizedRefreshAll(showLoading)
  }, [optimizedRefreshAll])
  
  // Data update functions
  const updateWorkouts = useCallback((newWorkouts: WorkoutData[]) => {
    setWorkouts(newWorkouts)
  }, [])

  // Remove specific workout from state and cache
  const removeWorkout = useCallback((workoutId: string) => {
    console.log('🗑️ removeWorkout: Removing workout from state and cache:', workoutId)
    
    // Update state
    setWorkouts(prev => prev.filter(workout => workout.id !== workoutId))
    
    // Update cache
    if (user?.id) {
      try {
        const cachedWorkouts = localStorage.getItem(`workouts_${user.id}`)
        if (cachedWorkouts) {
          const workouts = JSON.parse(cachedWorkouts)
          const updatedWorkouts = workouts.filter((w: any) => w.id !== workoutId)
          localStorage.setItem(`workouts_${user.id}`, JSON.stringify(updatedWorkouts))
          console.log('🗑️ removeWorkout: Updated cache, removed workout')
        }
      } catch (error) {
        console.warn('⚠️ removeWorkout: Failed to update cache:', error)
      }
    }
  }, [user?.id])

  // Clean up stale data - remove workouts that no longer exist in database
  const cleanupStaleData = useCallback(async () => {
    if (!user?.id || workouts.length === 0) return

    console.log('🧹 cleanupStaleData: Checking for stale workout data...')
    
    try {
      // Get fresh workout IDs from database
      const { data: dbWorkouts, error } = await supabase
        .from('workouts')
        .select('id')
        .eq('user_id', user.id)

      if (error) {
        console.warn('⚠️ cleanupStaleData: Failed to fetch workout IDs:', error)
        return
      }

      const dbWorkoutIds = new Set(dbWorkouts?.map((w: any) => w.id) || [])
      const staleWorkouts = workouts.filter(workout => !dbWorkoutIds.has(workout.id))

      if (staleWorkouts.length > 0) {
        console.log('🧹 cleanupStaleData: Found stale workouts, removing:', staleWorkouts.length)
        
        // Remove stale workouts from state
        setWorkouts(prev => prev.filter(workout => dbWorkoutIds.has(workout.id)))
        
        // Update cache
        const updatedWorkouts = workouts.filter(workout => dbWorkoutIds.has(workout.id))
        localStorage.setItem(`workouts_${user.id}`, JSON.stringify(updatedWorkouts))
        
        console.log('✅ cleanupStaleData: Cleaned up stale data')
      }
    } catch (error) {
      console.warn('⚠️ cleanupStaleData: Error during cleanup:', error)
    }
  }, [user?.id, workouts])

  // Check database health and performance
  const checkDatabaseHealth = useCallback(async () => {
    if (!user?.id) return

    console.log('🏥 checkDatabaseHealth: Checking database performance...')
    
    try {
      const startTime = Date.now()
      
      // Simple health check query
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .limit(1)
        .single()

      const responseTime = Date.now() - startTime
      
      if (error) {
        console.warn('⚠️ checkDatabaseHealth: Database health check failed:', error.message)
        return
      }

      if (responseTime > 5000) {
        console.warn(`⚠️ checkDatabaseHealth: Slow database response (${responseTime}ms)`)
      } else {
        console.log(`✅ checkDatabaseHealth: Database healthy (${responseTime}ms)`)
      }
      
    } catch (error) {
      console.warn('⚠️ checkDatabaseHealth: Health check error:', error)
    }
  }, [user?.id])
  
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
    console.log('🧹 clearAllData: Clearing all data and cache')
    
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
    
    // Clear localStorage cache if user exists
    if (user?.id) {
      try {
        localStorage.removeItem(`workouts_${user.id}`)
        localStorage.removeItem(`teams_${user.id}`)
        localStorage.removeItem(`teamMembers_${user.id}`)
        localStorage.removeItem(`chats_${user.id}`)
        console.log('🗑️ clearAllData: Cache cleared for user:', user.id)
      } catch (error) {
        console.warn('⚠️ clearAllData: Failed to clear cache:', error)
      }
    }
  }, [user?.id])
  
  // Track if data has been loaded from localStorage
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false)
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0)
  
  // Refs to prevent race conditions and duplicate requests
  const isInitializing = useRef(false)
  const refreshPromise = useRef<Promise<void> | null>(null)
  const lastDataFetch = useRef<number>(0)
  const DATA_FETCH_THROTTLE = 1000 // 1 second minimum between data fetches
  
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
  
  // Restore data from localStorage on mount
  useEffect(() => {
    if (!user?.id || hasLoadedFromStorage) return

    console.log('🔄 Restoring data from localStorage for user:', user.id)
    
    try {
      // Restore workouts
      const cachedWorkouts = localStorage.getItem(`workouts_${user.id}`)
      if (cachedWorkouts) {
        const parsedWorkouts = JSON.parse(cachedWorkouts)
        setWorkouts(parsedWorkouts)
        console.log('✅ Restored workouts from cache:', parsedWorkouts.length)
      }

      // Restore teams
      const cachedTeams = localStorage.getItem(`teams_${user.id}`)
      if (cachedTeams) {
        const parsedTeams = JSON.parse(cachedTeams)
        setTeams(parsedTeams)
        console.log('✅ Restored teams from cache:', parsedTeams.length)
      }

      // Restore team members
      const cachedTeamMembers = localStorage.getItem(`teamMembers_${user.id}`)
      if (cachedTeamMembers) {
        const parsedTeamMembers = JSON.parse(cachedTeamMembers)
        setTeamMembers(parsedTeamMembers)
        console.log('✅ Restored team members from cache:', parsedTeamMembers.length)
      }

      // Restore chats
      const cachedChats = localStorage.getItem(`chats_${user.id}`)
      if (cachedChats) {
        const parsedChats = JSON.parse(cachedChats)
        setChats(parsedChats)
        console.log('✅ Restored chats from cache:', parsedChats.length)
      }

      setHasLoadedFromStorage(true)
      console.log('✅ All cached data restored successfully')
    } catch (error) {
      console.error('❌ Error restoring cached data:', error)
      setHasLoadedFromStorage(true) // Still mark as loaded to prevent infinite retries
    }
  }, [user?.id, hasLoadedFromStorage])

  // Main data loading effect
  useEffect(() => {
    if (!user?.id) {
      // Clear data when user logs out
      clearAllData()
      setHasLoadedFromStorage(false)
      return
    }

    // Only fetch data if we haven't loaded from storage yet
    if (!hasLoadedFromStorage) {
      console.log('⏳ No cached data found, fetching from server')
      optimizedRefreshAll(true)
    } else {
      console.log('📱 Using cached data, skipping initial fetch')
    }
  }, [user?.id, hasLoadedFromStorage, optimizedRefreshAll])
  
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
      
      // Also refresh to keep data fresh - show loading only if no cached data exists
      setTimeout(() => {
        const hasAnyData = workouts.length > 0 || teams.length > 0 || teamMembers.length > 0 || chats.length > 0
        refreshAll(!hasAnyData) // Show loading only if we have no data at all
      }, 1000) // Reduced delay
    }
  }, [user?.id, refreshAll])
  
  // Smart background refresh - only when user is active and data is stale
  useEffect(() => {
    if (!user?.id || !hasLoadedFromStorage) return
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now()
        const fiveMinutes = 5 * 60 * 1000
        
        // Only refresh if it's been more than 5 minutes since last refresh
        if (now - lastRefreshTime > fiveMinutes) {
          console.log('👁️ Tab visible - background refresh triggered')
          setLastRefreshTime(now)
          optimizedRefreshAll(false) // Silent background refresh
        }
      }
    }

    // Listen for tab visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user?.id, hasLoadedFromStorage, lastRefreshTime, optimizedRefreshAll])
  
  // Force refresh with cache clear
  const forceRefreshAll = useCallback(async () => {
    console.log('🔄 forceRefreshAll: Starting forced refresh with cache clear')
    clearAllData()
    
    // Reset initialization state to allow fresh fetch
    isInitializing.current = false
    refreshPromise.current = null
    
    // Wait a moment for state to clear, then fetch fresh data
    setTimeout(() => {
      optimizedRefreshAll(true)
    }, 100)
  }, [clearAllData, optimizedRefreshAll])
  
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
    forceRefreshAll,
    
    // Data updates
    updateWorkouts,
    removeWorkout,
    cleanupStaleData,
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
