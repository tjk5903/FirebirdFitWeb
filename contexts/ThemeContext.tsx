'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { UserPreferences, getUserPreferences, saveUserPreferences } from '@/lib/utils'
import { useAuth } from './AuthContext'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  actualTheme: 'light' | 'dark' // The actual theme being applied
  preferences: UserPreferences | null
  setTheme: (theme: Theme) => void
  updatePreferences: (newPreferences: Partial<UserPreferences>) => Promise<void>
  toggleTheme: () => void
  isLoading: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [theme, setThemeState] = useState<Theme>('system')
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light')
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load user preferences when user is available
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user?.id) {
        setIsLoading(false)
        return
      }

      try {
        const userPrefs = await getUserPreferences(user.id)
        if (userPrefs) {
          setPreferences(userPrefs)
          setThemeState(userPrefs.theme)
        }
      } catch (error) {
        console.error('Error loading user preferences:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPreferences()
  }, [user?.id])

  // Update actual theme based on theme setting and system preference
  useEffect(() => {
    const updateActualTheme = () => {
      if (theme === 'system') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setActualTheme(systemPrefersDark ? 'dark' : 'light')
      } else {
        setActualTheme(theme)
      }
    }

    updateActualTheme()

    // Listen for system theme changes when using system theme
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', updateActualTheme)
      return () => mediaQuery.removeEventListener('change', updateActualTheme)
    }
  }, [theme])

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement
    
    if (actualTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [actualTheme])

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme)
    
    // Update preferences in database if user is logged in
    if (user?.id && preferences) {
      try {
        const updatedPreferences = { ...preferences, theme: newTheme }
        await saveUserPreferences(updatedPreferences)
        setPreferences(updatedPreferences)
      } catch (error) {
        console.error('Error saving theme preference:', error)
      }
    }
  }

  const updatePreferences = async (newPreferences: Partial<UserPreferences>) => {
    if (!user?.id || !preferences) return

    try {
      const updatedPreferences = { ...preferences, ...newPreferences }
      const result = await saveUserPreferences(updatedPreferences)
      
      if (result.success) {
        setPreferences(updatedPreferences)
        
        // Update theme if it was changed
        if (newPreferences.theme) {
          setThemeState(newPreferences.theme)
        }
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error updating preferences:', error)
      throw error
    }
  }

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      actualTheme, 
      preferences, 
      setTheme, 
      updatePreferences, 
      toggleTheme, 
      isLoading 
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
