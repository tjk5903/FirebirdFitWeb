'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { User, UserRole, upsertUser } from '@/lib/utils'
import { loadingManager } from '@/lib/loadingManager'

interface AuthContextType {
  user: User | null
  signInWithMagicLink: (email: string, role: UserRole) => Promise<void>
  updateUserRole: (newRole: UserRole) => Promise<void>
  logout: () => Promise<void>
  isLoading: boolean
  error: string | null
  clearError: () => void
  getDashboardRoute: (role: UserRole) => string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  // Check session on mount and handle auth state changes
  useEffect(() => {
    let mounted = true
    
    const getSession = async () => {
      try {
        console.log('Getting session...')
        loadingManager.startLoading('auth-session', 5000) // 5 second timeout
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

    const handleUserSession = async (supabaseUser: any, shouldRedirect: boolean = false) => {
      try {
        console.log('Handling user session for:', supabaseUser.email)
        
        // Database-first approach: Check database for the true role
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', supabaseUser.id)
          .single()

        let finalRole: UserRole
        let userName = ''

        if (profileError && profileError.code === 'PGRST116') {
          // User doesn't exist in database - first time sign-in
          console.log('First-time user, creating database record')
          
          // Use role from auth metadata (from magic link signup)
          finalRole = (supabaseUser.user_metadata?.role as UserRole) || 'athlete'
          userName = supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || ''
          
          // Create user in database
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: supabaseUser.id,
              email: supabaseUser.email,
              full_name: userName,
              role: finalRole,
            })

          if (insertError && insertError.code !== 'PGRST301') {
            // Non-auth error creating profile - continue with basic info
            console.log('Profile creation failed (non-critical):', insertError.code)
            setError('Could not save your profile, but you can continue using the app.')
          }

        } else if (profile) {
          // User exists in database - use database role as source of truth
          console.log('Existing user found, using database role')
          finalRole = profile.role as UserRole
          userName = profile.full_name || ''

          // Check if auth metadata needs updating
          const authRole = supabaseUser.user_metadata?.role
          if (authRole !== finalRole) {
            console.log(`Role mismatch: auth=${authRole}, db=${finalRole}. Updating auth metadata.`)
            
            // Update auth metadata to match database (background, non-blocking)
            supabase.auth.updateUser({
              data: { role: finalRole }
            }).then(({ error }) => {
              if (error) {
                console.log('Auth metadata update failed (non-critical):', error.message)
              } else {
                console.log('Auth metadata synced with database role')
              }
            })
          }

        } else {
          // Database error that's not "user not found"
          console.log('Database query error, using auth metadata as fallback')
          finalRole = (supabaseUser.user_metadata?.role as UserRole) || 'athlete'
          userName = supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || ''
          setError('Could not load your full profile. Using basic information.')
        }

        // Create user object with correct role from database
        setError(null) // Clear any previous errors (unless set above)
        setUser({
          id: supabaseUser.id,
          name: userName,
          email: supabaseUser.email,
          role: finalRole,
        })
        
        console.log(`User session created with role: ${finalRole}`)
        
        // Redirect to appropriate dashboard if requested (for session restoration)
        if (shouldRedirect && typeof window !== 'undefined') {
          const baseUrl = getBaseUrl()
          // Always redirect to /dashboard - role-based rendering happens inside the dashboard page
          const dashboardUrl = `${baseUrl}/dashboard`
          console.log('Session restoration redirecting to:', dashboardUrl)
          window.location.href = dashboardUrl
        }
      } catch (error: any) {
        console.error('Error handling user session:', error)
        // Only sign out for actual security issues
        if (error?.message?.includes('JWT') || error?.code === 'PGRST301') {
          console.log('Security issue detected, signing out user')
          try {
            await supabase.auth.signOut()
          } catch (signOutError) {
            console.error('Error signing out:', signOutError)
          }
          setUser(null)
        } else {
          console.log('Non-security error, keeping user logged in')
          // For non-security errors, just log and continue
        }
      } finally {
        // Always clear loading state when session handling is complete
        setIsLoading(false)
      }
    }

    getSession()

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
      if (document.visibilityState === 'visible' && user) {
        // Tab became visible and user is logged in - just refresh session silently
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user && mounted) {
            console.log('Tab visible - session still valid')
          }
        }).catch(error => {
          console.log('Session check on visibility change failed:', error)
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      mounted = false
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user])

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

  // Logout
  const logout = async () => {
    try {
      // Clear user state immediately
      setUser(null)
      
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
    <AuthContext.Provider value={{ user, signInWithMagicLink, updateUserRole, logout, isLoading, error, clearError, getDashboardRoute }}>
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
