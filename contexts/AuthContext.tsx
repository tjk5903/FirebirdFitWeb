'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { User, UserRole, upsertUser } from '@/lib/utils'

interface AuthContextType {
  user: User | null
  login: (email: string, password: string, role: UserRole) => Promise<void>
  signInWithMagicLink: (email: string, role: UserRole) => Promise<void>
  signup: (email: string, password: string, role: UserRole) => Promise<void>
  logout: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check session on mount and handle auth state changes
  useEffect(() => {
    // ULTIMATE FAILSAFE: Clear loading after maximum time regardless of what happens
    const maxLoadingTimeout = setTimeout(() => {
      console.warn('ULTIMATE FAILSAFE: Clearing loading state after 15 seconds')
      setIsLoading(false)
    }, 15000)

    // Clear the timeout when component unmounts or loading completes
    const clearFailsafe = () => clearTimeout(maxLoadingTimeout)
    const getSession = async () => {
      try {
        console.log('Getting session...')
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Session result:', session ? 'Session found' : 'No session')
        if (session?.user) {
          // Add timeout protection for handleUserSession
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Session handling timeout')), 10000)
          )
          
          try {
            await Promise.race([handleUserSession(session.user), timeoutPromise])
            // Note: setIsLoading(false) is handled in handleUserSession's finally block
          } catch (timeoutError) {
            console.error('Session handling timed out or failed:', timeoutError)
            // Timeout or error in handleUserSession - sign out for safety
            await supabase.auth.signOut()
            setUser(null)
            setIsLoading(false)
          }
        } else {
          // No session, user is anonymous - set user to null and stop loading
          console.log('No session found, user is anonymous')
          setUser(null)
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Error getting session:', error)
        // Even if there's an error, stop loading and treat as anonymous
        setUser(null)
        setIsLoading(false)
      } finally {
        // BULLETPROOF: Always ensure loading is cleared, even if handleUserSession fails
        console.log('FAILSAFE: Ensuring isLoading is false in getSession finally')
        setIsLoading(false)
      }
    }

    const handleUserSession = async (supabaseUser: any) => {
      try {
        console.log('Handling user session for:', supabaseUser.email)
        // Check if user exists in our users table
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', supabaseUser.id)
          .single()

        if (error && error.code === 'PGRST116') {
          console.log('User not found in database, creating new user')
          // User doesn't exist in our table, create them
          const storedRole = localStorage.getItem('selectedRole') as UserRole || 'athlete'
          
          const { data: newProfile, error: insertError } = await supabase
            .from('users')
            .insert({
              id: supabaseUser.id,
              email: supabaseUser.email,
              full_name: '',
              role: storedRole,
            })
            .select()
            .single()

          if (insertError) {
            console.error('Error creating user profile:', insertError)
            // If we can't create a user profile, this might indicate RLS issues or invalid session
            // For security, sign out the user rather than creating a partial user object
            console.log('Cannot create user profile, signing out for security')
            await supabase.auth.signOut()
            setUser(null)
          } else {
            // Clear stored role
            localStorage.removeItem('selectedRole')

            setUser({
              id: newProfile.id,
              name: newProfile.full_name || '',
              email: newProfile.email,
              role: newProfile.role as UserRole,
            })
            console.log('New user created and set')
          }
        } else if (profile) {
          console.log('User found in database')
          // User exists, set their profile
          setUser({
            id: profile.id,
            name: profile.full_name || '',
            email: profile.email,
            role: profile.role as UserRole,
          })
        } else if (error) {
          console.error('Error querying user profile:', error)
          // If database query fails, it likely means the session is invalid or RLS is blocking
          // Sign out the user gracefully to prevent security issues
          console.log('Session appears invalid, signing out user')
          await supabase.auth.signOut()
          setUser(null)
        } else {
          // Handle case where profile is null but no error - this shouldn't happen normally
          console.log('No user profile found but no error - signing out for security')
          await supabase.auth.signOut()
          setUser(null)
        }
      } catch (error) {
        console.error('Error handling user session:', error)
        // If we can't validate the session properly, sign out for security
        console.log('Cannot validate session, signing out user')
        try {
          await supabase.auth.signOut()
        } catch (signOutError) {
          console.error('Error signing out:', signOutError)
        }
        setUser(null)
      } finally {
        // CRITICAL: Always clear loading state regardless of success/failure
        console.log('Clearing loading state in handleUserSession')
        setIsLoading(false)
      }
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)
      
      try {
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('Processing SIGNED_IN event')
          setIsLoading(true) // Set loading for sign in process
          await handleUserSession(session.user)
        } else if (event === 'SIGNED_OUT') {
          console.log('Processing SIGNED_OUT event')
          setUser(null)
          setIsLoading(false) // Clear loading immediately
          localStorage.removeItem('selectedRole')
          // Redirect to login page
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('Processing TOKEN_REFRESHED event')
          setIsLoading(true) // Set loading for token refresh
          await handleUserSession(session.user)
        } else {
          // Handle any other auth events by clearing loading
          console.log('Processing other auth event:', event)
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Error in auth state change handler:', error)
        // Always clear loading if auth event handling fails
        setIsLoading(false)
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
      clearFailsafe() // Clear the ultimate failsafe timeout
    }
  }, [])

  // Login existing user (password-based)
  const login = async (email: string, password: string, _role: UserRole) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  // Sign in with magic link
  const signInWithMagicLink = async (email: string, role: UserRole) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })
    if (error) throw error
  }

  // Signup new user
  const signup = async (email: string, password: string, role: UserRole) => {
    // Sign up with Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error

    // Insert profile into users table
    const { error: insertError } = await supabase.from('users').insert({
      id: data.user?.id,
      email,
      full_name: '',
      role,
    })
    if (insertError) throw insertError
  }

  // Logout
  const logout = async () => {
    try {
      // Clear user state immediately
      setUser(null)
      localStorage.removeItem('selectedRole')
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
      }
      
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    } catch (error) {
      console.error('Error during logout:', error)
      // Still redirect even if there's an error
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, signInWithMagicLink, signup, logout, isLoading }}>
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
