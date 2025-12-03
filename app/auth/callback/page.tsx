'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { isPWA } from '@/lib/pwaUtils'
import FirebirdLogo from '@/components/ui/FirebirdLogo'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'processing' | 'success' | 'error' | 'browser'>('processing')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [isInPWA, setIsInPWA] = useState(false)

  useEffect(() => {
    // Check if we're in PWA mode
    const pwaMode = isPWA()
    setIsInPWA(pwaMode)

    const handleAuth = async () => {
      try {
        // Get the hash from URL (magic link contains auth tokens in hash)
        const hash = window.location.hash
        const urlParams = new URLSearchParams(window.location.search)
        
        // Check if we have auth tokens in hash or query params
        const hasAuthHash = hash.includes('access_token') || hash.includes('type=recovery')
        const hasAuthParams = urlParams.has('access_token') || urlParams.has('type')
        
        if (!hasAuthHash && !hasAuthParams) {
          // No auth tokens found, might be a direct visit
          console.log('No auth tokens found in URL')
          setStatus('error')
          setErrorMessage('Invalid authentication link. Please request a new magic link.')
          return
        }

        // Supabase will automatically handle the hash and set the session
        // We just need to wait for it to process
        console.log('Processing authentication...')
        
        // Wait a moment for Supabase to process the auth
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Check if session was created
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Error getting session:', sessionError)
          setStatus('error')
          setErrorMessage(sessionError.message || 'Failed to authenticate')
          return
        }

        if (!session) {
          console.log('No session found after processing')
          setStatus('error')
          setErrorMessage('Authentication failed. Please try again.')
          return
        }

        console.log('✅ Authentication successful')
        setStatus('success')

        // If in PWA, redirect directly to dashboard
        if (pwaMode) {
          console.log('🔄 PWA mode - redirecting to dashboard')
          // Small delay to show success state
          setTimeout(() => {
            router.push('/dashboard')
          }, 500)
        } else {
          // If in browser, show option to open in PWA
          console.log('🌐 Browser mode - showing PWA open option')
          setStatus('browser')
        }

      } catch (error: any) {
        console.error('Error in auth callback:', error)
        setStatus('error')
        setErrorMessage(error.message || 'An unexpected error occurred')
      }
    }

    handleAuth()
  }, [router])

  const handleOpenInPWA = () => {
    // Import and use the PWA utility
    const { attemptOpenInPWA } = require('@/lib/pwaUtils')
    attemptOpenInPWA(window.location.href)
  }

  const handleContinueInBrowser = () => {
    // User chooses to continue in browser
    router.push('/dashboard')
  }

  if (status === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700">
        <div className="text-center space-y-6">
          <div className="mx-auto mb-6">
            <FirebirdLogo className="h-24 w-24 mx-auto mb-4 drop-shadow-2xl animate-pulse" />
          </div>
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
          <p className="text-white text-lg font-medium">Completing sign in...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 p-4">
        <div className="max-w-md w-full bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 text-center space-y-6">
          <div className="mx-auto">
            <FirebirdLogo className="h-20 w-20 mx-auto mb-4" />
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Authentication Error</h2>
            <p className="text-gray-600">{errorMessage}</p>
          </div>
          <button
            onClick={() => router.push('/login')}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300"
          >
            Return to Login
          </button>
        </div>
      </div>
    )
  }

  if (status === 'browser') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 p-4">
        <div className="max-w-md w-full bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 text-center space-y-6">
          <div className="mx-auto">
            <FirebirdLogo className="h-20 w-20 mx-auto mb-4" />
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Open in App</h2>
            <p className="text-gray-600">
              You're signed in! For the best experience, open this link in the Firebird Fit app on your home screen.
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={handleOpenInPWA}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300"
            >
              Open in Firebird Fit App
            </button>
            <button
              onClick={handleContinueInBrowser}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-xl transition-all duration-300"
            >
              Continue in Browser
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Success state (briefly shown before redirect in PWA)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700">
      <div className="text-center space-y-6">
        <div className="mx-auto mb-6">
          <FirebirdLogo className="h-24 w-24 mx-auto mb-4 drop-shadow-2xl" />
        </div>
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-white text-lg font-medium">Sign in successful!</p>
        <p className="text-blue-100 text-sm">Redirecting...</p>
      </div>
    </div>
  )
}

