'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { UserRole } from '@/lib/utils'
import { Eye, EyeOff, Shield, Users, MessageSquare, Activity } from 'lucide-react'
import FirebirdLogo from '@/components/ui/FirebirdLogo'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('athlete')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(email, password, role)
      router.push('/dashboard')
    } catch (err) {
      setError('Invalid credentials. Please try again.')
    } finally {
      setIsLoading(false)
    }
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
              className={`absolute top-1 bottom-1 w-1/2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-md transition-all duration-500 ease-in-out ${
                role === 'athlete' ? 'left-1' : 'left-[calc(50%-2px)]'
              }`}
            ></div>
            <div className="relative flex">
              <button
                type="button"
                onClick={() => setRole('athlete')}
                className={`flex-1 py-4 px-6 rounded-xl transition-all duration-500 flex items-center justify-center space-x-3 relative z-10 ${
                  role === 'athlete'
                    ? 'text-white font-bold'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Activity className={`h-6 w-6 transition-all duration-300 ${role === 'athlete' ? 'text-white' : 'text-gray-400'}`} />
                <span className="font-bold text-lg">Athlete</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('coach')}
                className={`flex-1 py-4 px-6 rounded-xl transition-all duration-500 flex items-center justify-center space-x-3 relative z-10 ${
                  role === 'coach'
                    ? 'text-white font-bold'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Shield className={`h-6 w-6 transition-all duration-300 ${role === 'coach' ? 'text-white' : 'text-gray-400'}`} />
                <span className="font-bold text-lg">Coach</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-300">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-base bg-white/90 backdrop-blur-sm hover:border-gray-300 group-hover:shadow-md"
                placeholder="Email"
              />
            </div>

            {/* Password Field */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-300">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-base bg-white/90 backdrop-blur-sm hover:border-gray-300 group-hover:shadow-md"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-300 hover:scale-110"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm font-medium animate-bounce-in">
                {error}
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
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="text-center pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500 font-medium">
              Demo: Use any email/password combination
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 