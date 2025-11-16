'use client'

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { User, UserRole, upsertUser } from '@/lib/utils'
import { loadingManager } from '@/lib/loadingManager'

interface AuthContextType {
  user: User | null
  signInWithMagicLink: (email: string, role: UserRole) => Promise<void>
  updateUserRole: (newRole: UserRole) => Promise<void>
  refreshUser: () => Promise<void>
  logout: () => Promise<void>
  isLoading: boolean
  error: string | null
  clearError: () => void
  getDashboardRoute: (role: UserRole) => string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Initialize user state - will be populated after hydration
  const [user, setUser] = useState<User | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const [isLoading, setIsLoading] = useState(false) // Never show loading states
  const [error, setError] = useState<string | null>(null)
  
  // Refs to prevent race conditions and duplicate requests
  const isInitializing = useRef(false)
  const authCheckPromise = useRef<Promise<void> | null>(null)
  const lastAuthCheck = useRef<number>(0)
  const AUTH_CHECK_THROTTLE = 2000 // 2 seconds minimum between auth checks

  const clearError = () => setError(null)

  // Helper function to get the correct base URL based on environment
  const getBaseUrl = (): string => {
    if (typeof window === 'undefined') return ''
    
    // For local development
    if (window.location.hostname === 'localhost') {
      return window.location.origin
    }
    
    // For production - use custom domain
    if (window.location.hostname === 'firebird-fit-web.vercel.app' || 
        window.location.hostname === 'www.firebirdfit.app' ||
        window.location.hostname === 'firebirdfit.app') {
      return 'https://www.firebirdfit.app'
    }
    
    // For Vercel preview deployments - use current origin
    if (window.location.hostname.includes('vercel.app')) {
      return window.location.origin
    }
    
    // Fallback to current origin
    return window.location.origin
  }

  // Helper function for role-based dashboard routing
  const getDashboardRoute = (role: UserRole): string => {
    // Always return /dashboard - role-based rendering happens inside the dashboard page
    // This function is kept for potential future use if separate role-based routes are needed
    return '/dashboard'
  }

  // Optimized user session handler with better error handling
  const handleUserSession = useCallback(async (supabaseUser: any, shouldRedirect: boolean = false) => {
    try {
      console.log('🔐 Handling user session for:', supabaseUser.email)
      
      // Get user profile from database with reasonable timeout
      console.log('🔍 Fetching user profile for ID:', supabaseUser.id)
      const profilePromise = supabase
        .from('users')
        .select('id, email, full_name, role, avatar, created_at')
        .eq('id', supabaseUser.id)
        .single()

      let profile: any = null
      let profileError: any = null

      try {
        const startTime = Date.now()
        const result = await profilePromise as any
        const fetchTime = Date.now() - startTime
        console.log(`📊 Profile fetch completed in ${fetchTime}ms`)
        
        profile = result.data
        profileError = result.error
        
        // Log detailed error information for debugging
        if (profileError) {
          console.error('❌ Profile fetch error details:', {
            code: profileError.code,
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint
          })
        }
      } catch (error: any) {
        console.warn('⚠️ Profile fetch failed, using auth metadata as fallback:', error)
        profileError = error
      }

      let finalRole: UserRole
      let userName = ''

      if (profileError && profileError.code === 'PGRST116') {
        // First-time user
        console.log('👤 First-time user, creating database record')
        finalRole = (supabaseUser.user_metadata?.role as UserRole) || 'athlete'
        userName = supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || ''
        
        // Create user in database (non-blocking)
        supabase
          .from('users')
          .insert({
            id: supabaseUser.id,
            email: supabaseUser.email,
            full_name: userName,
            role: finalRole,
          })
          .then(({ error }) => {
            if (error && error.code !== 'PGRST301') {
              console.log('⚠️ Profile creation failed (non-critical):', error.code)
            }
          })

      } else if (profile) {
        // Existing user
        console.log('👤 Existing user found, using database role')
        finalRole = profile.role as UserRole
        userName = profile.full_name || ''

        // Sync auth metadata in background (non-blocking)
        const authRole = supabaseUser.user_metadata?.role
        if (authRole !== finalRole) {
          supabase.auth.updateUser({
            data: { role: finalRole }
          }).catch(() => {}) // Silent fail
        }
      } else {
        // Database error fallback
        console.log('⚠️ Database error, using auth metadata as fallback')
        console.log('Database error details:', profileError)
        console.log('Error code:', profileError?.code)
        console.log('Error message:', profileError?.message)
        console.log('Error details:', profileError?.details)
        finalRole = (supabaseUser.user_metadata?.role as UserRole) || 'athlete'
        userName = supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || ''
        
        // Try to get the user's actual name from database as fallback
        try {
          console.log('🔄 Attempting fallback query for user name...')
          const { data: fallbackProfile, error: fallbackError } = await supabase
            .from('users')
            .select('full_name, role')
            .eq('id', supabaseUser.id)
            .single()
          
          if (fallbackError) {
            console.warn('⚠️ Fallback query failed:', fallbackError)
          } else if (fallbackProfile?.full_name) {
            userName = fallbackProfile.full_name
            console.log('✅ Fallback query successful, using database name:', userName)
          }
          
          // Also try to get role if we don't have it
          if (fallbackProfile?.role && !finalRole) {
            finalRole = fallbackProfile.role as UserRole
            console.log('✅ Fallback query got role:', finalRole)
          }
        } catch (fallbackError) {
          console.warn('⚠️ Fallback query also failed:', fallbackError)
        }
      }

      // Create user object
      const userData = {
        id: supabaseUser.id,
        name: userName || supabaseUser.email,
        full_name: userName || supabaseUser.email, // Add full_name for compatibility
        email: supabaseUser.email,
        role: finalRole,
        avatar: profile?.avatar || ''
      }

      setUser(userData)
      setError(null)
      
      // Cache user data for instant loading
      try {
        localStorage.setItem('cached_user', JSON.stringify(userData))
        localStorage.setItem('cached_user_timestamp', Date.now().toString())
      } catch (e) {
        console.warn('Failed to cache user data:', e)
      }
      
      console.log(`✅ User session created with role: ${finalRole}`)
      
      // Handle redirect if needed
      if (shouldRedirect && typeof window !== 'undefined') {
        const baseUrl = getBaseUrl()
        const currentPath = window.location.pathname
        
        if (currentPath === '/' || currentPath === '/login') {
          const dashboardUrl = `${baseUrl}/dashboard`
          console.log('🔄 Redirecting to:', dashboardUrl)
          window.location.href = dashboardUrl
        }
      }

    } catch (error: any) {
      console.error('❌ Error handling user session:', error)
      
      // Only sign out for actual security issues
      if (error?.message?.includes('JWT') || error?.code === 'PGRST301') {
        console.log('🔒 Security issue detected, signing out user')
        try {
          await supabase.auth.signOut()
        } catch (signOutError) {
          console.error('Error signing out:', signOutError)
        }
        setUser(null)
        localStorage.removeItem('cached_user')
        localStorage.removeItem('cached_user_timestamp')
      } else {
        console.log('⚠️ Non-security error, keeping user logged in')
        // For non-security errors, try to use cached data
        try {
          const cachedUser = localStorage.getItem('cached_user')
          if (cachedUser) {
            const parsedUser = JSON.parse(cachedUser)
            setUser(parsedUser)
            console.log('🔄 Using cached user data as fallback')
          }
        } catch (e) {
          console.warn('Failed to restore cached user:', e)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Optimized session check with deduplication and throttling
  const checkSession = useCallback(async () => {
    const now = Date.now()
    
    // Throttle auth checks to prevent excessive calls
    if (now - lastAuthCheck.current < AUTH_CHECK_THROTTLE) {
      console.log('⏱️ Auth check throttled')
      return
    }
    
    // Prevent multiple simultaneous auth checks
    if (authCheckPromise.current) {
      console.log('🔄 Auth check already in progress, waiting...')
      return authCheckPromise.current
    }

    lastAuthCheck.current = now
    isInitializing.current = true

    authCheckPromise.current = (async () => {
      try {
        console.log('🔍 Checking session...')
        loadingManager.startLoading('auth-session', 2000)
        
        // Check for cached user first with timestamp validation
        const cachedUser = localStorage.getItem('cached_user')
        const cachedTimestamp = localStorage.getItem('cached_user_timestamp')
        const isCacheValid = cachedTimestamp && (now - parseInt(cachedTimestamp)) < 300000 // 5 minutes

        if (cachedUser && isCacheValid) {
          try {
            const parsedUser = JSON.parse(cachedUser)
            console.log('📱 Using cached user:', parsedUser.email)
            setUser(parsedUser)
            loadingManager.stopLoading('auth-session')
            return
          } catch (e) {
            console.warn('Invalid cached user data, clearing cache')
            localStorage.removeItem('cached_user')
            localStorage.removeItem('cached_user_timestamp')
          }
        }

        // Get session from Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          throw sessionError
        }

        if (session?.user) {
          console.log('✅ Valid session found for:', session.user.email)
          await handleUserSession(session.user, false)
        } else {
          console.log('❌ No session found')
          setUser(null)
          localStorage.removeItem('cached_user')
          localStorage.removeItem('cached_user_timestamp')
        }

      } catch (error: any) {
        console.error('❌ Session check failed:', error)
        
        // Only clear user for actual auth errors, not network errors
        if (error?.message?.includes('JWT') || error?.code === 'PGRST301') {
          setUser(null)
          localStorage.removeItem('cached_user')
          localStorage.removeItem('cached_user_timestamp')
        } else {
          // For network errors, try to use cached data
          try {
            const cachedUser = localStorage.getItem('cached_user')
            if (cachedUser) {
              const parsedUser = JSON.parse(cachedUser)
              setUser(parsedUser)
              console.log('🔄 Using cached user data due to network error')
            }
          } catch (e) {
            console.warn('Failed to restore cached user:', e)
          }
        }
      } finally {
        loadingManager.stopLoading('auth-session')
        isInitializing.current = false
        authCheckPromise.current = null
      }
    })()

    return authCheckPromise.current
  }, [handleUserSession])

  // Hydration effect - restore user from localStorage after mount
  useEffect(() => {
    setIsHydrated(true)
    
    // Restore user from localStorage immediately after hydration
    try {
      const cachedUser = localStorage.getItem('cached_user')
      const cachedTimestamp = localStorage.getItem('cached_user_timestamp')
      const now = Date.now()
      const isCacheValid = cachedTimestamp && (now - parseInt(cachedTimestamp)) < 300000 // 5 minutes

      if (cachedUser && isCacheValid) {
        const parsedUser = JSON.parse(cachedUser)
        console.log('⚡ Restoring cached user after hydration:', parsedUser.email)
        setUser(parsedUser)
      }
    } catch (e) {
      console.error('Error restoring cached user:', e)
      localStorage.removeItem('cached_user')
      localStorage.removeItem('cached_user_timestamp')
    }
  }, [])

  // Check session on mount and handle auth state changes
  useEffect(() => {
    if (!isHydrated) return // Wait for hydration
    
    let mounted = true
    
    const getSession = async () => {
      try {
        console.log('Getting session...')
        loadingManager.startLoading('auth-session', 2000) // Reduced to 2 seconds
        
        // If we have a cached user, validate their session and refresh their data
        if (user) {
          const { data: { session } } = await supabase.auth.getSession()
          if (!session?.user || session.user.id !== user.id) {
            console.log('Cached user session expired, clearing cache')
            localStorage.removeItem('cached_user')
            if (mounted) {
              setUser(null)
            }
            // Continue with normal session check below
          } else {
            // Session is valid, but refresh user data from database to ensure it's current
            console.log('Cached user session valid, refreshing user data from database')
            try {
              const { data: currentProfile, error: profileError } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single()

              if (!profileError && currentProfile && mounted) {
                const updatedUser = {
                  id: currentProfile.id,
                  email: currentProfile.email,
                  name: currentProfile.full_name || currentProfile.email,
                  role: currentProfile.role as UserRole,
                  avatar: currentProfile.avatar || ''
                }
                
                // Update user if data has changed
                if (JSON.stringify(user) !== JSON.stringify(updatedUser)) {
                  console.log('User data updated from database')
                  setUser(updatedUser)
                  localStorage.setItem('cached_user', JSON.stringify(updatedUser))
                }
              }
            } catch (error) {
              console.error('Error refreshing user data:', error)
              // Keep existing cached user if refresh fails
            }
            
            loadingManager.stopLoading('auth-session')
            return
          }
        }
        
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Session result:', session ? 'Session found' : 'No session')
        
        if (!mounted) return // Prevent state updates if component unmounted
        
        if (session?.user) {
          try {
            // For initial session restoration, redirect to appropriate dashboard
            const shouldRedirect = window.location.pathname === '/' || window.location.pathname === '/login'
            await handleUserSession(session.user, shouldRedirect)
          } catch (sessionError: any) {
            console.error('Session handling failed:', sessionError)
            if (!mounted) return
            
            // Only sign out if it's an actual auth error, otherwise keep trying
            if (sessionError?.message?.includes('JWT') || sessionError?.code === 'PGRST301') {
              console.log('Auth error detected, signing out')
              await supabase.auth.signOut()
              if (mounted) setUser(null)
            } else {
              console.log('Non-auth error, keeping session but stopping loading')
              if (mounted) setError('Having trouble loading your profile. You can continue using the app.')
            }
            if (mounted) setIsLoading(false)
          }
        } else {
          // No session, user is anonymous - set user to null and stop loading
          console.log('No session found, user is anonymous')
          if (mounted) {
            setUser(null)
            setIsLoading(false)
            // Clear any stale cached user data
            localStorage.removeItem('cached_user')
          }
        }
      } catch (error) {
        console.error('Error getting session:', error)
        if (mounted) {
          setUser(null)
          setIsLoading(false)
        }
      } finally {
        loadingManager.stopLoading('auth-session')
      }
    }

    // Initial session check
    checkSession().then(() => {
      if (!mounted) return
      
      // Set up auth state change listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('Processing SIGNED_IN event')
        setIsLoading(true)
        // Don't redirect on SIGNED_IN - magic link already handles redirect
        await handleUserSession(session.user, false)
      } else if (event === 'SIGNED_OUT') {
        console.log('Processing SIGNED_OUT event')
        setUser(null)
        setIsLoading(false)
        // Clear cached user data
        localStorage.removeItem('cached_user')
        // Redirect to login page using correct domain
        if (typeof window !== 'undefined') {
          const baseUrl = getBaseUrl()
          window.location.href = `${baseUrl}/login`
        }
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log('Processing TOKEN_REFRESHED event')
        setIsLoading(true)
        // Don't redirect on token refresh - user is already on correct page
        await handleUserSession(session.user, false)
      }
      // Note: handleUserSession manages its own loading state in finally block
    })

    // Handle visibility change to prevent unnecessary re-authentication
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user && !isInitializing.current) {
        // Only check session if it's been more than 5 minutes
        const now = Date.now()
        const cachedTimestamp = localStorage.getItem('cached_user_timestamp')
        const lastCheck = cachedTimestamp ? parseInt(cachedTimestamp) : 0
        
        if (now - lastCheck > 300000) { // 5 minutes
          console.log('👁️ Tab visible - validating session')
          checkSession().catch(() => {}) // Silent fail for background check
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      mounted = false
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
    }) // Close checkSession().then()
  }, [isHydrated]) // Run only when hydrated - removed user dependency to prevent race conditions

  // Sign in with magic link (unified auth method)
  const signInWithMagicLink = async (email: string, role: UserRole) => {
    const baseUrl = getBaseUrl()
    // Always redirect to /dashboard - role-based rendering happens inside the dashboard page
    const redirectUrl = `${baseUrl}/dashboard`
    
    console.log('Magic link will redirect to:', redirectUrl)
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          role: role,
          full_name: '',
        }
      },
    })
    if (error) throw error
  }

  // Update user role (for profile/settings page)
  const updateUserRole = async (newRole: UserRole) => {
    if (!user) throw new Error('No user logged in')
    
    // Update user metadata in Supabase auth
    const { error } = await supabase.auth.updateUser({
      data: { role: newRole }
    })
    if (error) throw error

    // Update local user state immediately
    setUser({ ...user, role: newRole })
    
    // Update database in background (non-blocking)
    supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email,
        full_name: user.name,
        role: newRole,
        updated_at: new Date().toISOString(),
      })
      .then(({ error }) => {
        if (error) {
          console.log('Background role sync failed (non-critical):', error.code)
        } else {
          console.log('Background role sync successful')
        }
      })
  }

  // Refresh user data from database
  const refreshUser = async () => {
    if (!user) return
    
    try {
      console.log('🔄 Refreshing user data from database')
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        console.warn('No session found, cannot refresh user')
        return
      }
      
      // Fetch fresh user profile from database
      const { data: currentProfile, error: profileError } = await supabase
        .from('users')
        .select('id, email, full_name, role, avatar, created_at')
        .eq('id', session.user.id)
        .single()

      if (profileError) {
        console.error('Error refreshing user profile:', profileError)
        return
      }

      if (currentProfile) {
        const updatedUser: User = {
          id: currentProfile.id,
          email: currentProfile.email,
          name: currentProfile.full_name || currentProfile.email,
          full_name: currentProfile.full_name || currentProfile.email,
          role: currentProfile.role as UserRole,
          avatar: currentProfile.avatar || ''
        }
        
        console.log('✅ User data refreshed:', updatedUser.email)
        setUser(updatedUser)
        
        // Update cache
        try {
          localStorage.setItem('cached_user', JSON.stringify(updatedUser))
          localStorage.setItem('cached_user_timestamp', Date.now().toString())
        } catch (e) {
          console.warn('Failed to update cached user:', e)
        }
      }
    } catch (error) {
      console.error('Error in refreshUser:', error)
    }
  }

  // Logout
  const logout = async () => {
    try {
      // Clear user state immediately
      setUser(null)
      localStorage.removeItem('cached_user')
      localStorage.removeItem('cached_user_timestamp')
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
      }
      
      // Redirect to login page using correct domain
      if (typeof window !== 'undefined') {
        const baseUrl = getBaseUrl()
        window.location.href = `${baseUrl}/login`
      }
    } catch (error) {
      console.error('Error during logout:', error)
      // Still redirect even if there's an error
      if (typeof window !== 'undefined') {
        const baseUrl = getBaseUrl()
        window.location.href = `${baseUrl}/login`
      }
    }
  }

  return (
    <AuthContext.Provider value={{ user, signInWithMagicLink, updateUserRole, refreshUser, logout, isLoading, error, clearError, getDashboardRoute }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
