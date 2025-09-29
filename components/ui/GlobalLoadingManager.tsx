'use client'

import React, { useEffect, useState } from 'react'
import { LoadingSpinner } from './LoadingSpinner'
import { loadingManager } from '@/lib/loadingManager'

interface GlobalLoadingManagerProps {
  children: React.ReactNode
}

export const GlobalLoadingManager: React.FC<GlobalLoadingManagerProps> = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const handleLoadingChange = (key: string, isLoading: boolean) => {
      setLoadingStates(prev => ({
        ...prev,
        [key]: isLoading
      }))
    }

    // Subscribe to loading state changes
    loadingManager.subscribe(handleLoadingChange)

    return () => {
      loadingManager.unsubscribe(handleLoadingChange)
    }
  }, [])

  const hasAnyLoading = Object.values(loadingStates).some(Boolean)
  const loadingKeys = Object.keys(loadingStates).filter(key => loadingStates[key])

  return (
    <>
      {children}
      
      {/* Global loading overlay */}
      {hasAnyLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full mx-4">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-600">
                {loadingKeys.length === 1 
                  ? `Loading ${loadingKeys[0].replace(/-/g, ' ')}...`
                  : 'Loading...'
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
