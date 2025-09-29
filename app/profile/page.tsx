'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createTeam, joinTeam, getUserTeams, updateTeamName, updateUserProfile, UserRole, canCreateTeams, canJoinTeams } from '@/lib/utils'
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Shield, 
  Settings, 
  Bell, 
  LogOut,
  Camera,
  Edit3,
  Save,
  X,
  Users,
  Copy,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import FirebirdLogo from '@/components/ui/FirebirdLogo'

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [isLoaded, setIsLoaded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreatingTeam, setIsCreatingTeam] = useState(false)
  const [showJoinCode, setShowJoinCode] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [isJoiningTeam, setIsJoiningTeam] = useState(false)
  const [joinTeamCode, setJoinTeamCode] = useState('')
  const [joinTeamError, setJoinTeamError] = useState('')
  const [joinTeamSuccess, setJoinTeamSuccess] = useState('')
  const [userTeams, setUserTeams] = useState<Array<{ id: string, name: string, joinCode: string, role: string }>>([])
  const [isLoadingTeams, setIsLoadingTeams] = useState(false)
  const [teamsError, setTeamsError] = useState('')
  const [isEditingTeams, setIsEditingTeams] = useState(false)
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null)
  const [teamNameError, setTeamNameError] = useState('')
  const [teamNameSuccess, setTeamNameSuccess] = useState('')
  const [isSavingTeamName, setIsSavingTeamName] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileSaveError, setProfileSaveError] = useState('')
  const [profileSaveSuccess, setProfileSaveSuccess] = useState('')
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    role: 'coach' as UserRole,
    avatar: ''
  })

  // Update profile data when user loads
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'coach',
        avatar: user.avatar || ''
      })
    }
  }, [user])

  // Load user's teams when user loads
  useEffect(() => {
    const loadUserTeams = async () => {
      if (!user || userTeams.length > 0) return // Don't reload if already loaded
      
      setIsLoadingTeams(true)
      
      // Add timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        console.warn('Teams loading timeout - stopping loading state')
        setIsLoadingTeams(false)
      }, 5000) // 5 second timeout
      
      try {
        console.log('🔍 Profile: Loading teams for user:', user.id)
        const teams = await getUserTeams(user.id)
        clearTimeout(timeout)
        console.log('✅ Profile: Teams loaded successfully:', teams)
        setUserTeams(teams)
        setTeamsError('') // Clear any previous errors
      } catch (error) {
        console.error('🚨 Profile: Error loading user teams:', error)
        clearTimeout(timeout)
        setUserTeams([]) // Set empty array on error
        
        // Show detailed error message
        let errorMessage = 'Failed to load teams. Please try again.'
        if (error instanceof Error) {
          errorMessage = error.message || errorMessage
        }
        
        console.log('🚨 Profile: Setting error message:', errorMessage)
        setTeamsError(errorMessage)
      } finally {
        setIsLoadingTeams(false)
      }
    }

    loadUserTeams()
  }, [user?.id]) // Only depend on user ID, not the whole user object

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleLogout = async () => {
    try {
      // Clear teams data before logout
      setUserTeams([])
      setIsLoadingTeams(false)
      await logout()
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }

  const refreshTeams = async () => {
    if (!user) return
    
    setIsLoadingTeams(true)
    setTeamsError('')
    
    // Clear cache before refreshing
    try {
      localStorage.removeItem(`teams_${user.id}`)
      console.log('🗑️ Profile: Cleared teams cache for user:', user.id)
    } catch (cacheError) {
      console.warn('⚠️ Profile: Failed to clear teams cache:', cacheError)
    }
    
    try {
      console.log('🔄 Profile: Refreshing teams for user:', user.id)
      const teams = await getUserTeams(user.id)
      console.log('✅ Profile: Teams refreshed successfully:', teams)
      setUserTeams(teams)
      setTeamsError('')
    } catch (error) {
      console.error('🚨 Profile: Error refreshing teams:', error)
      setUserTeams([])
      
      // Show detailed error message
      let errorMessage = 'Failed to refresh teams. Please try again.'
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage
      }
      
      console.log('🚨 Profile: Setting refresh error message:', errorMessage)
      setTeamsError(errorMessage)
    } finally {
      setIsLoadingTeams(false)
    }
  }

  const handleSave = async () => {
    if (!user) return
    
    setIsSavingProfile(true)
    setProfileSaveError('')
    setProfileSaveSuccess('')
    
    try {
      const result = await updateUserProfile(user.id, {
        full_name: profileData.name.trim(),
        email: profileData.email.trim(),
        role: profileData.role
      })
      
      if (result.success) {
        setProfileSaveSuccess('Profile updated successfully!')
        setIsEditing(false)
        
        // Clear success message after 3 seconds
        setTimeout(() => setProfileSaveSuccess(''), 3000)
        
        // TODO: Update user context with new data
        // This would require adding a refresh function to AuthContext
      } else {
        setProfileSaveError(result.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      setProfileSaveError('An unexpected error occurred')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleCancel = () => {
    setProfileData({
      name: user?.name || '',
      email: user?.email || '',
      role: user?.role || 'coach',
      avatar: user?.avatar || ''
    })
    setIsEditing(false)
    setProfileSaveError('')
    setProfileSaveSuccess('')
  }

  const handleEdit = () => {
    setIsEditing(true)
    setProfileSaveError('')
    setProfileSaveSuccess('')
  }

  const handleCreateTeam = async () => {
    if (!user) return

    setIsCreatingTeam(true)
    setError('')
    setShowJoinCode(false)
    setJoinCode('')

    try {
      const result = await createTeam(user.id, user.name)
      setJoinCode(result.joinCode)
      setShowJoinCode(true)
      
      // Refresh user teams after creating
      const teams = await getUserTeams(user.id)
      setUserTeams(teams)
    } catch (err: any) {
      setError(err.message || 'Failed to create team. Please try again.')
    } finally {
      setIsCreatingTeam(false)
    }
  }

  const handleCopyJoinCode = async () => {
    try {
      await navigator.clipboard.writeText(joinCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy join code:', err)
    }
  }

  const handleCloseJoinCode = () => {
    setShowJoinCode(false)
    setJoinCode('')
    setError('')
  }

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || isJoiningTeam) return // Prevent multiple submissions

    setIsJoiningTeam(true)
    setJoinTeamError('')
    setJoinTeamSuccess('')

    try {
      const result = await joinTeam(user.id, joinTeamCode)
      setJoinTeamSuccess(`Successfully joined ${result.teamName}!`)
      setJoinTeamCode('')
      
      // Refresh user teams after joining
      const teams = await getUserTeams(user.id)
      setUserTeams(teams)
    } catch (err: any) {
      console.error('Join team error:', err)
      setJoinTeamError(err.message || 'Failed to join team. Please try again.')
    } finally {
      setIsJoiningTeam(false)
    }
  }

  const handleSaveAllTeams = async () => {
    if (!user) return

    setIsSavingTeamName(true)
    setTeamNameError('')
    setTeamNameSuccess('')

    try {
      // Save all teams sequentially
      for (const team of userTeams) {
        if (team.name.trim()) {
          const result = await updateTeamName(user.id, team.id, team.name.trim())
          if (!result.success) {
            throw new Error(result.error || `Failed to update ${team.name}`)
          }
        }
      }
      
      // If we get here, all teams were saved successfully
      setEditingTeamId(null)
      setIsEditingTeams(false)
      
      // Show success message
      setTeamNameSuccess('Team names updated successfully!')
      
      // Clear success message after 3 seconds
      setTimeout(() => setTeamNameSuccess(''), 3000)
      
    } catch (err: any) {
      setTeamNameError(err.message || 'An unexpected error occurred')
    } finally {
      setIsSavingTeamName(false)
    }
  }

  const handleCancelTeamEdit = () => {
    // Reset to original team names
    const loadUserTeams = async () => {
      if (!user) return
      
      try {
        const teams = await getUserTeams(user.id)
        setUserTeams(teams)
      } catch (error) {
        console.error('Error loading user teams:', error)
      }
    }
    
    loadUserTeams()
    setEditingTeamId(null)
    setIsEditingTeams(false)
    setTeamNameError('')
    setTeamNameSuccess('')
  }

  // Redirect to login if no user (with small delay to allow auth restoration)
  useEffect(() => {
    if (!user) {
      const redirectTimeout = setTimeout(() => {
        router.push('/login')
      }, 150)
      return () => clearTimeout(redirectTimeout)
    }
  }, [user, router])

  // Show nothing briefly if no user to prevent flash
  if (!user) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50" />
  }

  // Redirect to login if no user
  if (!user) {
    router.push('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="glass-effect border-b border-white/20 shadow-sm sticky top-0 z-50 backdrop-blur-md">
        <div className="container-responsive">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4 sm:space-x-6">
              <div className={`transition-all duration-500 ${isLoaded ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
                <FirebirdLogo className="h-10 w-10 sm:h-12 sm:w-12" />
              </div>
              <div className={`transition-all duration-500 delay-100 ${isLoaded ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}`}>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold gradient-text font-elegant">Firebird Fit</h1>
                <p className="text-xs sm:text-sm text-gray-600 font-medium hidden sm:block">Team Performance & Communication</p>
              </div>
            </div>
            
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 text-gray-400 hover:text-gray-600 transition-all duration-200 hover:scale-110 focus-ring"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className={`container-responsive py-6 transition-all duration-500 delay-200 ${
        isLoaded ? 'translate-y-0 opacity-100' : 'opacity-0 translate-y-4'
      }`}>
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </button>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Profile Settings</h2>
          <p className="text-gray-600">Manage your account and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <div className="card-elevated hover-lift">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Profile Information</h3>
                {!isEditing ? (
                  <button
                    onClick={handleEdit}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-200"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSave}
                      disabled={isSavingProfile}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="h-4 w-4" />
                      <span>{isSavingProfile ? 'Saving...' : 'Save'}</span>
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-xl transition-all duration-200"
                    >
                      <X className="h-4 w-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Success/Error Messages */}
              {profileSaveSuccess && (
                <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-green-700 text-sm">{profileSaveSuccess}</span>
                </div>
              )}
              
              {profileSaveError && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <span className="text-red-700 text-sm">{profileSaveError}</span>
                </div>
              )}

              <div className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="h-20 w-20 sm:h-24 sm:w-24 bg-gradient-to-br from-royal-blue to-dark-blue rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xl sm:text-2xl">
                        {profileData.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    {isEditing && (
                      <button className="absolute -bottom-1 -right-1 h-8 w-8 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center transition-all duration-200">
                        <Camera className="h-4 w-4 text-white" />
                      </button>
                    )}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{profileData.name}</h4>
                    <p className="text-gray-600 capitalize">{profileData.role}</p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                      />
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-2xl">
                        <User className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-900">{profileData.name}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                      />
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-2xl">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-900">{profileData.email}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Role
                    </label>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-2xl">
                      <Shield className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-900 capitalize">{profileData.role}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Create Team Section - Only for Coaches */}
            {canCreateTeams(user?.role) && (
              <div className="card-elevated hover-lift mt-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">Team Management</h3>
                </div>

                {!showJoinCode ? (
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      Create a new team and get a unique join code to share with your athletes.
                    </p>
                    
                    {error && (
                      <div className="bg-red-50 border-2 border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm font-medium flex items-center space-x-2">
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <button
                      onClick={handleCreateTeam}
                      disabled={isCreatingTeam}
                      className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-royal-blue to-dark-blue hover:from-dark-blue hover:to-royal-blue text-white rounded-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreatingTeam ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Creating Team...</span>
                        </>
                      ) : (
                        <>
                          <Users className="h-5 w-5" />
                          <span>Create New Team</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-green-50 border-2 border-green-200 text-green-800 px-6 py-4 rounded-2xl">
                      <div className="flex items-center space-x-2 mb-3">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                        <h4 className="font-semibold text-lg">Team Created Successfully!</h4>
                      </div>
                      <p className="text-green-700 mb-4">
                        Share this join code with your athletes so they can join your team:
                      </p>
                      
                      <div className="bg-white border-2 border-green-300 rounded-xl p-4 mb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-green-600 font-medium mb-1">Join Code</p>
                            <p className="text-3xl font-bold text-green-800 tracking-wider">{joinCode}</p>
                          </div>
                          <button
                            onClick={handleCopyJoinCode}
                            className="flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all duration-200"
                          >
                            {copied ? (
                              <>
                                <CheckCircle className="h-4 w-4" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      
                      <button
                        onClick={handleCloseJoinCode}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all duration-200"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

                         {/* Join Team Section - For Athletes and Assistant Coaches */}
             {canJoinTeams(user?.role) && (
               <div className="card-elevated hover-lift mt-6">
                 <div className="flex items-center justify-between mb-6">
                   <h3 className="text-lg sm:text-xl font-bold text-gray-900">Join Team</h3>
                 </div>

                 <div className="space-y-4">
                   <p className="text-gray-600">
                     Enter the 6-digit join code provided by your coach to join their team.
                     {user?.role === 'assistant_coach' && (
                       <span className="block mt-1 text-sm text-blue-600">
                         As an Assistant Coach, you'll be able to create workouts, events, and group chats once you join a team.
                       </span>
                     )}
                   </p>
                   
                   {joinTeamError && (
                     <div className="bg-red-50 border-2 border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm font-medium flex items-center space-x-2">
                       <AlertCircle className="h-5 w-5 flex-shrink-0" />
                       <span>{joinTeamError}</span>
                     </div>
                   )}

                   {joinTeamSuccess && (
                     <div className="bg-green-50 border-2 border-green-200 text-green-800 px-4 py-3 rounded-2xl text-sm font-medium flex items-center space-x-2">
                       <CheckCircle className="h-5 w-5 flex-shrink-0" />
                       <span>{joinTeamSuccess}</span>
                     </div>
                   )}

                   <form onSubmit={handleJoinTeam} className="space-y-4">
                     <div>
                       <label htmlFor="joinCode" className="block text-sm font-semibold text-gray-700 mb-2">
                         Join Code
                       </label>
                       <input
                         id="joinCode"
                         type="text"
                         value={joinTeamCode}
                         onChange={(e) => setJoinTeamCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                         placeholder="Enter 6-digit code"
                         className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-center text-2xl font-bold tracking-wider"
                         maxLength={6}
                         required
                       />
                     </div>

                     <button
                       type="submit"
                       disabled={isJoiningTeam || joinTeamCode.length !== 6}
                       className="w-full flex items-center justify-center space-x-3 px-6 py-3 bg-gradient-to-r from-royal-blue to-dark-blue hover:from-dark-blue hover:to-royal-blue text-white rounded-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                     >
                       {isJoiningTeam ? (
                         <>
                           <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                           <span>Joining Team...</span>
                         </>
                       ) : (
                         <>
                           <Users className="h-5 w-5" />
                           <span>Join Team</span>
                         </>
                       )}
                     </button>
                   </form>
                 </div>
               </div>
             )}

             {/* My Teams Section - For All Users */}
             <div className="card-elevated hover-lift mt-6">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-lg sm:text-xl font-bold text-gray-900">My Teams</h3>
                 {canCreateTeams(user?.role) && userTeams.length > 0 && (
                   <div className="flex items-center space-x-2">
                     {!isEditingTeams ? (
                       <button
                         onClick={() => {
                           setIsEditingTeams(true)
                           setTeamNameError('')
                           setTeamNameSuccess('')
                         }}
                         className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-200"
                       >
                         <Edit3 className="h-4 w-4" />
                         <span>Edit Team Name</span>
                       </button>
                     ) : (
                       <div className="flex items-center space-x-2">
                         <button
                           onClick={handleSaveAllTeams}
                           disabled={isSavingTeamName}
                           className="flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all duration-200 disabled:opacity-50"
                         >
                           <Save className="h-4 w-4" />
                           <span>{isSavingTeamName ? 'Saving...' : 'Save All'}</span>
                         </button>
                         <button
                           onClick={handleCancelTeamEdit}
                           className="flex items-center space-x-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-xl transition-all duration-200"
                         >
                           <X className="h-4 w-4" />
                           <span>Cancel</span>
                         </button>
                       </div>
                     )}
                   </div>
                 )}
               </div>

               {/* Team Success/Error Messages */}
               {teamNameSuccess && (
                 <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-xl mb-4">
                   <CheckCircle className="h-5 w-5 text-green-500" />
                   <span className="text-green-700 text-sm">{teamNameSuccess}</span>
                 </div>
               )}
               
               {teamNameError && (
                 <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-4">
                   <AlertCircle className="h-5 w-5 text-red-500" />
                   <span className="text-red-700 text-sm">{teamNameError}</span>
                 </div>
               )}

               {canCreateTeams(user?.role) && isEditingTeams && (
                 <div className="mb-4 p-3 bg-blue-50 border-2 border-blue-200 rounded-xl">
                   <p className="text-sm text-blue-700">
                     <strong>Note:</strong> Changing the team name won't affect your join code.
                   </p>
                 </div>
               )}

               <div className="space-y-4">
                 {isLoadingTeams ? (
                   <div className="flex items-center justify-center py-8">
                     <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
                     <span className="text-gray-600">Loading teams...</span>
                   </div>
                 ) : teamsError ? (
                   <div className="flex flex-col items-center justify-center py-8">
                     <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                       <AlertCircle className="h-8 w-8 text-red-500" />
                     </div>
                     <h4 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Teams</h4>
                     <p className="text-gray-600 mb-4 text-center">{teamsError}</p>
                     <button
                       onClick={refreshTeams}
                       className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-200"
                     >
                       <span>Try Again</span>
                     </button>
                   </div>
                 ) : userTeams.length > 0 ? (
                   <div className="space-y-3">
                     {userTeams.map((team) => (
                       <div key={team.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border-2 border-gray-100 hover:border-blue-200 transition-all duration-200">
                         <div className="flex items-center space-x-4">
                           <div className="h-12 w-12 bg-gradient-to-br from-royal-blue to-dark-blue rounded-xl flex items-center justify-center">
                             <Users className="h-6 w-6 text-white" />
                           </div>
                           <div className="flex-1">
                             {isEditingTeams && canCreateTeams(user?.role) ? (
                               <div className="space-y-2">
                                 <input
                                   type="text"
                                   value={team.name}
                                   onChange={(e) => {
                                     const updatedTeams = userTeams.map(t => 
                                       t.id === team.id ? { ...t, name: e.target.value } : t
                                     );
                                     setUserTeams(updatedTeams);
                                   }}
                                   className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                                   placeholder="Enter team name"
                                />
                               </div>
                             ) : (
                               <h4 className="font-semibold text-gray-900">{team.name}</h4>
                             )}
                             <p className="text-sm text-gray-600 capitalize">Role: {team.role}</p>
                           </div>
                         </div>
                         <div className="text-right">
                           <p className="text-xs text-gray-500 font-medium mb-1">Join Code</p>
                           <p className="text-lg font-bold text-gray-900 tracking-wider">{team.joinCode}</p>
                         </div>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <div className="text-center py-8">
                     <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                       <Users className="h-8 w-8 text-gray-400" />
                     </div>
                     <h4 className="text-lg font-semibold text-gray-900 mb-2">No Teams Yet</h4>
                     <p className="text-gray-600">
                       {canCreateTeams(user?.role) 
                         ? "Create your first team to get started!" 
                         : "You are not part of any teams yet."
                       }
                     </p>
                   </div>
                 )}
               </div>
             </div>
          </div>

          {/* Settings & Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="card-elevated hover-lift">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center space-x-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all duration-200 group">
                  <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <Settings className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-900">Settings</h4>
                    <p className="text-sm text-gray-600">App preferences</p>
                  </div>
                </button>

                <button className="w-full flex items-center space-x-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all duration-200 group">
                  <div className="h-10 w-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <Bell className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-900">Notifications</h4>
                    <p className="text-sm text-gray-600">Manage alerts</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Account Actions */}
            <div className="card-elevated hover-lift">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Account</h3>
              <div className="space-y-3">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 p-3 rounded-xl bg-red-50 hover:bg-red-100 transition-all duration-200 group"
                >
                  <div className="h-10 w-10 bg-red-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <LogOut className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-red-900">Sign Out</h4>
                    <p className="text-sm text-red-600">Log out of your account</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 