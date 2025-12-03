'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { 
  isPWA, 
  isIOS, 
  shouldAttemptPWATransfer,
  markSessionTransferNeeded,
  attemptOpenInPWA,
  attemptOpenInPWAWithRetry
} from '@/lib/pwaUtils'
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
        const fullUrl = window.location.href
        
        console.log('🔐 Auth callback - Full URL:', fullUrl)
        console.log('🔐 Auth callback - Hash:', hash)
        console.log('🔐 Auth callback - Search:', window.location.search)
        
        // Check if we have auth tokens in hash or query params
        const hasAuthHash = hash && (hash.includes('access_token') || hash.includes('type=recovery'))
        const hasAuthParams = urlParams.has('access_token') || urlParams.has('type')
        
        if (!hasAuthHash && !hasAuthParams) {
          // No auth tokens found, might be a direct visit or hash was lost
          console.error('❌ No auth tokens found in URL')
          console.error('   Hash:', hash)
          console.error('   Search params:', window.location.search)
          console.error('   Full URL:', fullUrl)
          setStatus('error')
          setErrorMessage('Invalid authentication link. Please request a new magic link.')
          return
        }

        // Supabase will automatically handle the hash and set the session
        // We need to wait for it to process and explicitly check
        console.log('⏳ Processing authentication...')
        
        // Give Supabase time to process the hash - wait longer for reliability
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Try to get session - Supabase should have processed the hash by now
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('❌ Error getting session:', sessionError)
          setStatus('error')
          setErrorMessage(sessionError.message || 'Failed to authenticate')
          return
        }

        let finalSession = session
        
        if (!finalSession) {
          // If no session yet, wait a bit more and try again
          console.log('⏳ No session found, waiting longer...')
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          const { data: { session: retrySession }, error: retryError } = await supabase.auth.getSession()
          
          if (retryError) {
            console.error('❌ Error on retry:', retryError)
            setStatus('error')
            setErrorMessage(retryError.message || 'Failed to authenticate')
            return
          }
          
          if (!retrySession) {
            console.error('❌ No session found after retry')
            setStatus('error')
            setErrorMessage('Authentication failed. The link may have expired. Please request a new magic link.')
            return
          }
          
          // Use the retry session
          finalSession = retrySession
          console.log('✅ Session found on retry')
        } else {
          console.log('✅ Session found on first try')
        }

        if (!finalSession) {
          console.error('❌ No session available after all attempts')
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
          // If in browser, check if we should attempt PWA transfer (iOS)
          const shouldTransfer = shouldAttemptPWATransfer()
          const isIOSDevice = isIOS()
          
          if (shouldTransfer && isIOSDevice) {
            console.log('📱 iOS browser mode detected - attempting PWA transfer')
            
            // Mark session transfer as needed
            markSessionTransferNeeded()
            
            // Attempt automatic redirect to PWA
            // Use dashboard URL since auth is complete
            const dashboardUrl = `${window.location.origin}/dashboard`
            console.log('🔄 Attempting to open PWA with URL:', dashboardUrl)
            
            // Try to open in PWA with retry
            const opened = attemptOpenInPWAWithRetry(dashboardUrl)
            
            if (opened) {
              // Give it a moment to see if redirect worked
              setTimeout(() => {
                // If we're still here after 2 seconds, show the manual option
                if (window.location.pathname === '/auth/callback') {
                  console.log('⚠️ Automatic PWA redirect may have failed, showing manual option')
                  setStatus('browser')
                }
              }, 2000)
            } else {
              // Automatic redirect failed, show manual option
              console.log('⚠️ Automatic PWA redirect failed, showing manual option')
              setStatus('browser')
            }
          } else {
            // Not iOS or PWA not likely installed, show standard browser option
            console.log('🌐 Browser mode - showing PWA open option')
            setStatus('browser')
          }
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
    // Mark session transfer as needed before attempting
    markSessionTransferNeeded()
    
    // Use dashboard URL since auth is complete
    const dashboardUrl = `${window.location.origin}/dashboard`
    
    // Try multiple methods to open PWA
    const opened = attemptOpenInPWAWithRetry(dashboardUrl, 3)
    
    if (!opened) {
      // If all methods failed, show instructions
      console.log('⚠️ All PWA opening methods failed')
      // The UI will remain showing, user can try again or continue in browser
    }
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
    const isIOSDevice = isIOS()
    const shouldTransfer = shouldAttemptPWATransfer()
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 p-4">
        <div className="max-w-md w-full bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 text-center space-y-6">
          <div className="mx-auto">
            <FirebirdLogo className="h-20 w-20 mx-auto mb-4" />
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Open in App</h2>
            <p className="text-gray-600">
              {isIOSDevice && shouldTransfer ? (
                <>
                  You're signed in! To use the Firebird Fit app from your home screen:
                  <br /><br />
                  <strong>1.</strong> Tap the button below to try opening the app
                  <br />
                  <strong>2.</strong> If that doesn't work, go to your home screen and open the Firebird Fit app
                  <br />
                  <strong>3.</strong> Your session will be ready when you open the app
                </>
              ) : (
                "You're signed in! For the best experience, open this link in the Firebird Fit app on your home screen."
              )}
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={handleOpenInPWA}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300"
            >
              {isIOSDevice ? 'Try Opening Firebird Fit App' : 'Open in Firebird Fit App'}
            </button>
            <button
              onClick={handleContinueInBrowser}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-xl transition-all duration-300"
            >
              Continue in Browser
            </button>
          </div>
          {isIOSDevice && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-left text-sm text-blue-800">
              <p className="font-semibold mb-1">💡 Tip:</p>
              <p>If the app doesn't open automatically, find the Firebird Fit icon on your home screen and tap it. Your login is already complete!</p>
            </div>
          )}
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

