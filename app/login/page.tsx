'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { UserRole } from '@/lib/utils'
import { Shield, Users, Activity, Mail, CheckCircle, AlertCircle } from 'lucide-react'
import FirebirdLogo from '@/components/ui/FirebirdLogo'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('athlete')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  
  const { user, signInWithMagicLink } = useAuth()
  const router = useRouter()

  // Check if user is already authenticated
  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push('/dashboard')
      } else {
        setIsCheckingSession(false)
      }
    }
  }, [user, isLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setIsLoading(true)

    try {
      // Store the selected role in localStorage for retrieval after magic link auth
      localStorage.setItem('selectedRole', role)
      
      await signInWithMagicLink(email, role)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to send magic link. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }



  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 p-4 relative overflow-hidden">
      {/* Enhanced Animated Background Gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-gold/10 animate-pulse-slow"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-gold/15 to-transparent rounded-full blur-3xl animate-bounce-slow"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-blue-400/15 to-transparent rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl animate-pulse"></div>
      
      {/* Refined Background Pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.08'%3E%3Ccircle cx='50' cy='50' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      <div className="max-w-md w-full space-y-8 relative z-10 animate-fade-in">
        {/* Logo and Title */}
        <div className="text-center animate-slide-up">
          <div className="mx-auto mb-6">
            <FirebirdLogo className="h-24 w-24 mx-auto mb-4 drop-shadow-2xl animate-scale-in" />
          </div>
          <h2 className="text-5xl font-bold text-white mb-3 font-sans drop-shadow-xl bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">Firebird Fit</h2>
          <p className="text-blue-100 text-xl font-medium tracking-wide">Welcome Back!</p>
        </div>

        {/* Login Form */}
        <div className="bg-gray-50/95 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 space-y-6 border border-white/40 animate-slide-up drop-shadow-2xl" style={{ animationDelay: '0.2s' }}>
          {/* Role Selection */}
          <div className="relative bg-gray-100 rounded-2xl p-1 mb-6">
            <div 
              className={`absolute top-1 bottom-1 w-1/3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-md transition-all duration-500 ease-in-out ${
                role === 'athlete' ? 'left-1' : 
                role === 'coach' ? 'left-[calc(33.33%+2px)]' : 
                'left-[calc(66.66%+4px)]'
              }`}
            ></div>
            <div className="relative flex">
              <button
                type="button"
                onClick={() => setRole('athlete')}
                className={`flex-1 py-4 px-4 rounded-xl transition-all duration-500 flex items-center justify-center space-x-2 relative z-10 ${
                  role === 'athlete'
                    ? 'text-white font-bold'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Activity className={`h-5 w-5 transition-all duration-300 ${role === 'athlete' ? 'text-white' : 'text-gray-400'}`} />
                <span className="font-bold text-sm">Athlete</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('coach')}
                className={`flex-1 py-4 px-4 rounded-xl transition-all duration-500 flex items-center justify-center space-x-2 relative z-10 ${
                  role === 'coach'
                    ? 'text-white font-bold'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Shield className={`h-5 w-5 transition-all duration-300 ${role === 'coach' ? 'text-white' : 'text-gray-400'}`} />
                <span className="font-bold text-sm">Coach</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('assistant_coach')}
                className={`flex-1 py-4 px-4 rounded-xl transition-all duration-500 flex items-center justify-center space-x-2 relative z-10 ${
                  role === 'assistant_coach'
                    ? 'text-white font-bold'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Users className={`h-5 w-5 transition-all duration-300 ${role === 'assistant_coach' ? 'text-white' : 'text-gray-400'}`} />
                <span className="font-bold text-sm">Assistant</span>
              </button>
            </div>
          </div>

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="relative group">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-300">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-base bg-white/90 backdrop-blur-sm hover:border-gray-300 group-hover:shadow-md"
                  placeholder="Enter your email"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm font-medium animate-bounce-in flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-500 transform hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg active:scale-95"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Sending magic link...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Mail className="h-5 w-5" />
                    <span>Send Magic Link</span>
                  </div>
                )}
              </button>
            </form>
          ) : (
            /* Success Message */
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Check your email!</h3>
                <p className="text-gray-600 mb-4">
                  We've sent a magic link to <span className="font-semibold text-blue-600">{email}</span>
                </p>
                <p className="text-sm text-gray-500">
                  Click the link in your email to sign in as a <span className="font-semibold">
                    {role === 'assistant_coach' ? 'Assistant Coach' : role}
                  </span>.
                </p>
              </div>
              
              {/* Resend option */}
              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    setSuccess(false)
                    setError('')
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  Send to a different email
                </button>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="text-center pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500 font-medium">
              No password required - just click the link in your email
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 