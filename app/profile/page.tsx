'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useTeamContext } from '@/contexts/TeamContext'
import { DashboardErrorBoundary } from '@/components/ui/DashboardErrorBoundary'
import { SmartLoadingMessage, EmptyState } from '@/components/ui/LoadingStates'
import { createTeam, joinTeam, leaveTeam, deleteTeam, getUserTeams, updateTeamName, updateUserProfile, getTeamMembersForTeam, removeTeamMember, UserRole, canCreateTeams, canJoinTeams } from '@/lib/utils'
import PersonalPerformanceCard from '@/components/ui/PersonalPerformanceCard'
import NotificationPreferencesModal from '@/components/ui/NotificationPreferencesModal'
import SettingsModal from '@/components/ui/SettingsModal'
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
import { supabase } from '@/lib/supabaseClient'

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth()
  const { refreshTeams: refreshTeamContext } = useTeamContext()
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
  const [isLeavingTeam, setIsLeavingTeam] = useState(false)
  const [leaveTeamError, setLeaveTeamError] = useState('')
  const [leaveTeamSuccess, setLeaveTeamSuccess] = useState('')
  const [showLeaveTeamConfirm, setShowLeaveTeamConfirm] = useState(false)
  const [isDeletingTeam, setIsDeletingTeam] = useState(false)
  const [deleteTeamError, setDeleteTeamError] = useState('')
  const [deleteTeamSuccess, setDeleteTeamSuccess] = useState('')
  const [showDeleteTeamConfirm, setShowDeleteTeamConfirm] = useState(false)
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null)
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [isLoadingTeamMembers, setIsLoadingTeamMembers] = useState(false)
  const [teamMembersError, setTeamMembersError] = useState('')
  const [showTeamMembers, setShowTeamMembers] = useState(false)
  const [isRemovingMember, setIsRemovingMember] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<any>(null)
  const [showRemoveMemberConfirm, setShowRemoveMemberConfirm] = useState(false)
  const [selectedMemberForPerformance, setSelectedMemberForPerformance] = useState<{ id: string, name: string } | null>(null)
  const [showNotificationPreferences, setShowNotificationPreferences] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    role: 'coach' as UserRole,
    avatar: ''
  })
  const [avatarPreview, setAvatarPreview] = useState('')
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null)
  const [avatarUploadError, setAvatarUploadError] = useState('')
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatarRemoved, setAvatarRemoved] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const localPreviewUrlRef = useRef<string | null>(null)

  // Update profile data when user loads
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || user.full_name || '',
        email: user.email || '',
        role: user.role || 'coach',
        avatar: user.avatar || ''
      })
      setAvatarPreview(user.avatar || '')
    }
  }, [user])

  useEffect(() => {
    return () => {
      if (localPreviewUrlRef.current) {
        URL.revokeObjectURL(localPreviewUrlRef.current)
      }
    }
  }, [])

  const handleAvatarButtonClick = () => {
    if (!isEditing) return
    fileInputRef.current?.click()
  }

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarUploadError('')
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setAvatarUploadError('Please select a valid image file.')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setAvatarUploadError('Image must be smaller than 2MB.')
      return
    }

    if (localPreviewUrlRef.current) {
      URL.revokeObjectURL(localPreviewUrlRef.current)
    }
    const objectUrl = URL.createObjectURL(file)
    localPreviewUrlRef.current = objectUrl

    setNewAvatarFile(file)
    setAvatarPreview(objectUrl)
    setAvatarRemoved(false)
  }

  const handleRemoveAvatar = () => {
    if (localPreviewUrlRef.current) {
      URL.revokeObjectURL(localPreviewUrlRef.current)
      localPreviewUrlRef.current = null
    }
    setNewAvatarFile(null)
    setAvatarRemoved(true)
    setAvatarPreview('')
    setProfileData((prev) => ({ ...prev, avatar: '' }))
  }

  const uploadAvatarIfNeeded = async (): Promise<string | null> => {
    if (!user) return profileData.avatar || null

    if (avatarRemoved) {
      return null
    }

    if (!newAvatarFile) {
      return profileData.avatar || null
    }

    setIsUploadingAvatar(true)
    try {
      const fileExt = newAvatarFile.name.split('.').pop()
      const filePath = `${user.id}/${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, newAvatarFile, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error('Avatar upload error:', uploadError)
        setAvatarUploadError('Failed to upload avatar. Please try again.')
        return profileData.avatar || null
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      return data.publicUrl
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  // Load user's teams when user loads
  useEffect(() => {
    const loadUserTeams = async () => {
      if (!user || userTeams.length > 0) return // Don't reload if already loaded
      
      setIsLoadingTeams(true)
      
      try {
        console.log('🔍 Profile: Loading teams for user:', user.id)
        const teams = await getUserTeams(user.id)
        console.log('✅ Profile: Teams loaded successfully:', teams)
        setUserTeams(teams)
        setTeamsError('') // Clear any previous errors
      } catch (error) {
        console.error('🚨 Profile: Error loading user teams:', error)
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
      const avatarUrl = await uploadAvatarIfNeeded()

      const result = await updateUserProfile(user.id, {
        full_name: profileData.name.trim(),
        email: profileData.email.trim(),
        role: profileData.role,
        avatar: avatarUrl
      })
      
      if (result.success) {
        setProfileSaveSuccess('Profile updated successfully!')
        setIsEditing(false)
        setProfileData((prev) => ({ ...prev, avatar: avatarUrl || '' }))
        setAvatarPreview(avatarUrl || '')
        setNewAvatarFile(null)
        setAvatarRemoved(false)
        if (localPreviewUrlRef.current) {
          URL.revokeObjectURL(localPreviewUrlRef.current)
          localPreviewUrlRef.current = null
        }
        
        // Refresh user context to get updated avatar
        await refreshUser()
        
        // Clear success message after 3 seconds
        setTimeout(() => setProfileSaveSuccess(''), 3000)
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
      name: user?.name || user?.full_name || '',
      email: user?.email || '',
      role: user?.role || 'coach',
      avatar: user?.avatar || ''
    })
    setAvatarPreview(user?.avatar || '')
    setNewAvatarFile(null)
    setAvatarRemoved(false)
    if (localPreviewUrlRef.current) {
      URL.revokeObjectURL(localPreviewUrlRef.current)
      localPreviewUrlRef.current = null
    }
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
      
      // Add a small delay to ensure database transaction is committed
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Refresh user teams after creating - try multiple times if needed
      console.log('🔄 Refreshing teams after creation...')
      console.log('🆔 New team ID:', result.teamId)
      
      let teams = await getUserTeams(user.id)
      console.log('✅ Teams refreshed (first attempt):', teams)
      console.log('🔍 Looking for team ID:', result.teamId)
      console.log('🔍 Found team IDs:', teams.map(t => t.id))
      
      // If the new team isn't found, wait a bit more and try again (up to 3 times)
      let attempts = 0
      const maxAttempts = 3
      while (!teams.some(t => t.id === result.teamId) && attempts < maxAttempts) {
        attempts++
        console.log(`⏳ New team not found (attempt ${attempts}/${maxAttempts}), waiting and retrying...`)
        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
        teams = await getUserTeams(user.id)
        console.log('✅ Teams refreshed (retry):', teams)
        console.log('🔍 Found team IDs:', teams.map(t => t.id))
      }
      
      if (!teams.some(t => t.id === result.teamId)) {
        console.warn('⚠️ New team still not found after retries. Team may need to be refreshed manually.')
      } else {
        console.log('✅ New team found in list!')
      }
      
      setUserTeams(teams)
      
      // Refresh TeamContext to update team selector
      await refreshTeamContext()
    } catch (err: any) {
      console.error('❌ Error creating team:', err)
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
      
      // Refresh TeamContext to update team selector
      refreshTeamContext()
    } catch (err: any) {
      console.error('Join team error:', err)
      setJoinTeamError(err.message || 'Failed to join team. Please try again.')
    } finally {
      setIsJoiningTeam(false)
    }
  }

  const handleLeaveTeam = async () => {
    if (!user || isLeavingTeam) return

    setIsLeavingTeam(true)
    setLeaveTeamError('')
    setLeaveTeamSuccess('')

    try {
      const result = await leaveTeam(user.id)
      
      if (result.success) {
        setLeaveTeamSuccess('Successfully left the team!')
        setShowLeaveTeamConfirm(false)
        
        // Refresh user teams after leaving
        const teams = await getUserTeams(user.id)
        setUserTeams(teams)
        
        // Clear success message after 3 seconds
        setTimeout(() => setLeaveTeamSuccess(''), 3000)
      } else {
        setLeaveTeamError(result.error || 'Failed to leave team. Please try again.')
      }
    } catch (err: any) {
      console.error('Leave team error:', err)
      setLeaveTeamError(err.message || 'Failed to leave team. Please try again.')
    } finally {
      setIsLeavingTeam(false)
    }
  }

  const handleDeleteTeam = async () => {
    if (!user || isDeletingTeam || !teamToDelete) return

    setIsDeletingTeam(true)
    setDeleteTeamError('')
    setDeleteTeamSuccess('')

    try {
      const result = await deleteTeam(user.id, teamToDelete)
      
      if (result.success) {
        setDeleteTeamSuccess('Team deleted successfully!')
        setShowDeleteTeamConfirm(false)
        setTeamToDelete(null)
        
        // Refresh user teams after deletion
        const teams = await getUserTeams(user.id)
        setUserTeams(teams)
        
        // Refresh team context
        refreshTeamContext()
        
        // Clear success message after 3 seconds
        setTimeout(() => setDeleteTeamSuccess(''), 3000)
      } else {
        setDeleteTeamError(result.error || 'Failed to delete team. Please try again.')
      }
    } catch (err: any) {
      console.error('Delete team error:', err)
      setDeleteTeamError(err.message || 'Failed to delete team. Please try again.')
    } finally {
      setIsDeletingTeam(false)
    }
  }

  const handleLoadTeamMembers = async (teamId: string) => {
    if (!user || isLoadingTeamMembers) return

    setIsLoadingTeamMembers(true)
    setTeamMembersError('')
    setTeamMembers([])

    try {
      const result = await getTeamMembersForTeam(teamId, user.id)
      
      if (result.success) {
        setTeamMembers(result.members || [])
        setShowTeamMembers(true)
      } else {
        setTeamMembersError(result.error || 'Failed to load team members. Please try again.')
      }
    } catch (err: any) {
      console.error('Load team members error:', err)
      setTeamMembersError(err.message || 'Failed to load team members. Please try again.')
    } finally {
      setIsLoadingTeamMembers(false)
    }
  }

  const handleRemoveMember = async () => {
    if (!user || !memberToRemove || isRemovingMember) return

    setIsRemovingMember(true)
    setTeamMembersError('')

    try {
      // Find the team ID from the current user's teams
      const currentTeam = userTeams.find(team => team.role === 'coach')
      if (!currentTeam) {
        setTeamMembersError('No team found')
        return
      }

      const result = await removeTeamMember(currentTeam.id, memberToRemove.id, user.id)
      
      if (result.success) {
        // Remove member from local state
        setTeamMembers(prev => prev.filter(member => member.id !== memberToRemove.id))
        setShowRemoveMemberConfirm(false)
        setMemberToRemove(null)
      } else {
        setTeamMembersError(result.error || 'Failed to remove member. Please try again.')
      }
    } catch (err: any) {
      console.error('Remove member error:', err)
      setTeamMembersError(err.message || 'Failed to remove member. Please try again.')
    } finally {
      setIsRemovingMember(false)
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
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
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium hidden sm:block">Team Performance & Communication</p>
              </div>
            </div>
            
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200 hover:scale-110 focus-ring"
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
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </button>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Profile Settings</h2>
          <p className="text-gray-600 dark:text-gray-300">Manage your account and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <div className="card-elevated hover-lift">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">Profile Information</h3>
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
                <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                  <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />
                  <span className="text-green-700 dark:text-green-300 text-sm">{profileSaveSuccess}</span>
                </div>
              )}
              
              {profileSaveError && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
                  <span className="text-red-700 dark:text-red-300 text-sm">{profileSaveError}</span>
                </div>
              )}

              <div className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gradient-to-br from-royal-blue to-dark-blue flex items-center justify-center text-white font-bold text-xl sm:text-2xl overflow-hidden">
                      {avatarPreview ? (
                        <img 
                          src={avatarPreview} 
                          alt={profileData.name} 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        profileData.name.split(' ').map(n => n[0]).join('').slice(0, 2)
                      )}
                    </div>
                    {isEditing && (
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center space-x-2">
                        <button
                          onClick={handleAvatarButtonClick}
                          className="h-8 w-8 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center transition-all duration-200 focus-ring"
                          title="Change avatar"
                        >
                          <Camera className="h-4 w-4 text-white" />
                        </button>
                        {avatarPreview && (
                          <button
                            onClick={handleRemoveAvatar}
                            className="h-8 w-8 bg-gray-500 hover:bg-gray-600 rounded-full flex items-center justify-center transition-all duration-200 focus-ring"
                            title="Remove avatar"
                          >
                            <X className="h-4 w-4 text-white" />
                          </button>
                        )}
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{profileData.name}</h4>
                    <p className="text-gray-600 dark:text-gray-400 capitalize">{profileData.role}</p>
                    {(isUploadingAvatar || avatarUploadError) && (
                      <p className={`text-sm mt-2 ${avatarUploadError ? 'text-red-500' : 'text-gray-500'}`}>
                        {avatarUploadError || 'Uploading photo...'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Full Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                      />
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-2xl">
                        <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                        <span className="text-gray-900 dark:text-gray-100">{profileData.name}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                      />
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-2xl">
                        <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                        <span className="text-gray-900 dark:text-gray-100">{profileData.email}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Role
                    </label>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-2xl">
                      <Shield className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      <span className="text-gray-900 dark:text-gray-100 capitalize">{profileData.role}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Create Team Section - Only for Coaches */}
            {canCreateTeams(user?.role) && (
              <div className="card-elevated hover-lift mt-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">Team Management</h3>
                </div>

                {!showJoinCode ? (
                  <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-300">
                      Create a new team and get a unique join code to share with your athletes.
                    </p>
                    
                    {error && (
                      <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-2xl text-sm font-medium flex items-center space-x-2">
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
                    <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 px-6 py-4 rounded-2xl">
                      <div className="flex items-center space-x-2 mb-3">
                        <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                        <h4 className="font-semibold text-lg">Team Created Successfully!</h4>
                      </div>
                      <p className="text-green-700 dark:text-green-300 mb-4">
                        Share this join code with your athletes so they can join your team:
                      </p>
                      
                      <div className="bg-white dark:bg-slate-800 border-2 border-green-300 dark:border-green-600 rounded-xl p-4 mb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">Join Code</p>
                            <p className="text-3xl font-bold text-green-800 dark:text-green-300 tracking-wider">{joinCode}</p>
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
                   <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">Join Team</h3>
                 </div>

                 <div className="space-y-4">
                   <p className="text-gray-600 dark:text-gray-300">
                     Enter the 6-digit join code provided by your coach to join their team.
                     {user?.role === 'assistant_coach' && (
                       <span className="block mt-1 text-sm text-blue-600 dark:text-blue-400">
                         As an Assistant Coach, you'll be able to create workouts, events, and group chats once you join a team.
                       </span>
                     )}
                   </p>
                   
                   {joinTeamError && (
                     <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-2xl text-sm font-medium flex items-center space-x-2">
                       <AlertCircle className="h-5 w-5 flex-shrink-0" />
                       <span>{joinTeamError}</span>
                     </div>
                   )}

                   {joinTeamSuccess && (
                     <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 px-4 py-3 rounded-2xl text-sm font-medium flex items-center space-x-2">
                       <CheckCircle className="h-5 w-5 flex-shrink-0" />
                       <span>{joinTeamSuccess}</span>
                     </div>
                   )}

                   <form onSubmit={handleJoinTeam} className="space-y-4">
                     <div>
                       <label htmlFor="joinCode" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                         Join Code
                       </label>
                       <input
                         id="joinCode"
                         type="text"
                         value={joinTeamCode}
                         onChange={(e) => setJoinTeamCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                         placeholder="Enter 6-digit code"
                         className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-center text-2xl font-bold tracking-wider"
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
             <DashboardErrorBoundary componentName="My Teams">
               <div className="card-elevated hover-lift mt-6">
                 <div className="flex items-center justify-between mb-6">
                   <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">My Teams</h3>
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
                 <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl mb-4">
                   <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />
                   <span className="text-green-700 dark:text-green-300 text-sm">{teamNameSuccess}</span>
                 </div>
               )}
               
               {teamNameError && (
                 <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl mb-4">
                   <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
                   <span className="text-red-700 dark:text-red-300 text-sm">{teamNameError}</span>
                 </div>
               )}

               {canCreateTeams(user?.role) && isEditingTeams && (
                 <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl">
                   <p className="text-sm text-blue-700 dark:text-blue-300">
                     <strong>Note:</strong> Changing the team name won't affect your join code.
                   </p>
                 </div>
               )}

               <div className="space-y-4">
                 {isLoadingTeams ? (
                   <SmartLoadingMessage 
                     type="teams" 
                     isInitial={userTeams.length === 0}
                     hasData={userTeams.length > 0}
                   />
                 ) : teamsError ? (
                   <div className="flex flex-col items-center justify-center py-8">
                     <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                       <AlertCircle className="h-8 w-8 text-red-500" />
                     </div>
                     <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Error Loading Teams</h4>
                     <p className="text-gray-600 dark:text-gray-300 mb-4 text-center">{teamsError}</p>
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
                       <div key={team.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-2xl border-2 border-gray-100 dark:border-slate-600 hover:border-blue-200 dark:hover:border-blue-500 transition-all duration-200">
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
                                   className="w-full px-3 py-2 border-2 border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-100 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                                   placeholder="Enter team name"
                                />
                               </div>
                             ) : (
                               <h4 className="font-semibold text-gray-900 dark:text-gray-100">{team.name}</h4>
                             )}
                             <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">Role: {team.role}</p>
                           </div>
                         </div>
                         <div className="text-right">
                           <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Join Code</p>
                           <p className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-wider">{team.joinCode}</p>
                           {/* Action Buttons based on role */}
                           {team.role === 'coach' ? (
                             <button
                               onClick={() => {
                                 setTeamToDelete(team.id)
                                 setShowDeleteTeamConfirm(true)
                               }}
                               className="mt-2 px-3 py-1 text-xs bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg transition-all duration-200"
                             >
                               Delete Team
                             </button>
                           ) : (
                             <button
                               onClick={() => setShowLeaveTeamConfirm(true)}
                               className="mt-2 px-3 py-1 text-xs bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg transition-all duration-200"
                             >
                               Leave Team
                             </button>
                           )}
                         </div>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <div className="text-center py-8">
                     <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                       <Users className="h-8 w-8 text-gray-400" />
                     </div>
                     <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Teams Yet</h4>
                     <p className="text-gray-600 dark:text-gray-300">
                       {canCreateTeams(user?.role) 
                         ? "Create your first team to get started!" 
                         : "You are not part of any teams yet."
                       }
                     </p>
                   </div>
                 )}
               </div>

               {/* Leave Team Success/Error Messages */}
               {leaveTeamSuccess && (
                 <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl mb-4">
                   <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />
                   <span className="text-green-700 dark:text-green-300 text-sm">{leaveTeamSuccess}</span>
                 </div>
               )}
               
               {leaveTeamError && (
                 <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl mb-4">
                   <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
                   <span className="text-red-700 dark:text-red-300 text-sm">{leaveTeamError}</span>
                 </div>
               )}

               {/* Delete Team Success/Error Messages */}
               {deleteTeamSuccess && (
                 <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl mb-4">
                   <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />
                   <span className="text-green-700 dark:text-green-300 text-sm">{deleteTeamSuccess}</span>
                 </div>
               )}
               
               {deleteTeamError && (
                 <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl mb-4">
                   <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
                   <span className="text-red-700 dark:text-red-300 text-sm">{deleteTeamError}</span>
                 </div>
               )}
             </div>

             {/* Team Members Section - For Coaches */}
             {canCreateTeams(user?.role) && userTeams.length > 0 && (
               <div className="card-elevated hover-lift mt-6">
                 <div className="flex items-center justify-between mb-6">
                   <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">Team Members</h3>
                   {!showTeamMembers ? (
                     <button
                       onClick={() => {
                         const currentTeam = userTeams.find(team => team.role === 'coach')
                         if (currentTeam) {
                           handleLoadTeamMembers(currentTeam.id)
                         }
                       }}
                       disabled={isLoadingTeamMembers}
                       className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-200 disabled:opacity-50"
                     >
                       <Users className="h-4 w-4" />
                       <span>{isLoadingTeamMembers ? 'Loading...' : 'View Members'}</span>
                     </button>
                   ) : (
                     <button
                       onClick={() => setShowTeamMembers(false)}
                       className="flex items-center space-x-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-xl transition-all duration-200"
                     >
                       <X className="h-4 w-4" />
                       <span>Hide Members</span>
                     </button>
                   )}
                 </div>

                 {showTeamMembers && (
                   <div className="space-y-4">
                     {teamMembersError && (
                       <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                         <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
                         <span className="text-red-700 dark:text-red-300 text-sm">{teamMembersError}</span>
                       </div>
                     )}

                     {isLoadingTeamMembers ? (
                       <div className="flex items-center justify-center py-8">
                         <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
                         <span className="text-gray-600 dark:text-gray-300">Loading team members...</span>
                       </div>
                     ) : teamMembers.length > 0 ? (
                       <div className="space-y-3">
                         {teamMembers.map((member) => (
                           <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-2xl border-2 border-gray-100 dark:border-slate-600 hover:border-blue-200 dark:hover:border-blue-500 transition-all duration-200">
                             <div className="flex items-center space-x-4">
                               <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                 <User className="h-6 w-6 text-white" />
                               </div>
                               <div className="flex-1">
                                 <h4 className="font-semibold text-gray-900 dark:text-gray-100">{member.name}</h4>
                                 <p className="text-sm text-gray-600 dark:text-gray-400">{member.email}</p>
                                 <div className="flex items-center space-x-2 mt-1">
                                   <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                     member.role === 'coach' 
                                       ? 'bg-green-100 text-green-800' 
                                       : member.role === 'assistant_coach'
                                       ? 'bg-blue-100 text-blue-800'
                                       : 'bg-gray-100 text-gray-800'
                                   }`}>
                                     {member.role === 'assistant_coach' ? 'Assistant Coach' : member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                   </span>
                                   <span className="text-xs text-gray-500 dark:text-gray-400">
                                     Joined {new Date(member.joinedAt).toLocaleDateString()}
                                   </span>
                                 </div>
                               </div>
                             </div>
                             <div className="flex items-center space-x-2">
                               {member.role === 'athlete' && (
                                 <button
                                   onClick={() => {
                                     setSelectedMemberForPerformance({ id: member.userId, name: member.name })
                                   }}
                                   className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-lg transition-all duration-200"
                                 >
                                   View Performance
                                 </button>
                               )}
                               {member.role !== 'coach' && (
                                 <button
                                   onClick={() => {
                                     setMemberToRemove(member)
                                     setShowRemoveMemberConfirm(true)
                                   }}
                                   className="px-3 py-1 text-xs bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg transition-all duration-200"
                                 >
                                   Remove
                                 </button>
                               )}
                             </div>
                           </div>
                         ))}
                       </div>
                     ) : (
                       <div className="text-center py-8">
                         <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                           <Users className="h-8 w-8 text-gray-400" />
                         </div>
                         <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Members Yet</h4>
                         <p className="text-gray-600 dark:text-gray-300">Share your join code with athletes and assistant coaches to add them to your team.</p>
                       </div>
                     )}
                     
                     {/* Player Performance Section */}
                     {selectedMemberForPerformance && (
                       <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
                         <div className="flex items-center justify-between mb-4">
                           <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                             {selectedMemberForPerformance.name}'s Performance
                           </h4>
                           <button
                             onClick={() => setSelectedMemberForPerformance(null)}
                             className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                           >
                             <X className="h-5 w-5" />
                           </button>
                         </div>
                         <PersonalPerformanceCard 
                           userId={selectedMemberForPerformance.id}
                           className="mt-4"
                         />
                       </div>
                     )}
                   </div>
                 )}
               </div>
             )}
             </DashboardErrorBoundary>
          </div>

          {/* Settings & Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="card-elevated hover-lift">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => setShowSettings(true)}
                  className="w-full flex items-center space-x-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all duration-200 group"
                >
                  <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">Settings</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">App preferences</p>
                  </div>
                </button>

                <button 
                  onClick={() => setShowNotificationPreferences(true)}
                  className="w-full flex items-center space-x-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all duration-200 group"
                >
                  <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <Bell className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">Notifications</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Manage alerts</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Account Actions */}
            <div className="card-elevated hover-lift">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Account</h3>
              <div className="space-y-3">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 group"
                >
                  <div className="h-10 w-10 bg-red-100 dark:bg-red-900/40 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <LogOut className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-red-900 dark:text-red-300">Sign Out</h4>
                    <p className="text-sm text-red-600 dark:text-red-400">Log out of your account</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leave Team Confirmation Modal */}
      {showLeaveTeamConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-10 w-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Leave Team</h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to leave this team? You'll need a new join code to rejoin later.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowLeaveTeamConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-xl transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleLeaveTeam}
                disabled={isLeavingTeam}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLeavingTeam ? 'Leaving...' : 'Leave Team'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Team Confirmation Modal */}
      {showDeleteTeamConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-10 w-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Delete Team</h3>
            </div>
            
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
              <p className="text-red-800 dark:text-red-300 font-semibold mb-2">⚠️ Warning: This action cannot be undone!</p>
              <p className="text-red-700 dark:text-red-300 text-sm">
                Deleting this team will permanently remove:
              </p>
              <ul className="text-red-700 dark:text-red-300 text-sm mt-2 ml-4 list-disc">
                <li>All team members</li>
                <li>All team workouts and events</li>
                <li>All team chats and messages</li>
                <li>The team join code</li>
              </ul>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you absolutely sure you want to delete this team? This action is permanent and cannot be reversed.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteTeamConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-xl transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTeam}
                disabled={isDeletingTeam}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeletingTeam ? 'Deleting...' : 'Delete Team'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Member Confirmation Modal */}
      {showRemoveMemberConfirm && memberToRemove && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-10 w-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Remove Team Member</h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to remove <strong className="text-gray-900 dark:text-gray-100">{memberToRemove.name}</strong> from your team? 
              They will need a new join code to rejoin.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowRemoveMemberConfirm(false)
                  setMemberToRemove(null)
                }}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-xl transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveMember}
                disabled={isRemovingMember}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRemovingMember ? 'Removing...' : 'Remove Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onOpenNotifications={() => setShowNotificationPreferences(true)}
        userId={user?.id || ''}
      />

      {/* Notification Preferences Modal */}
      <NotificationPreferencesModal
        isOpen={showNotificationPreferences}
        onClose={() => setShowNotificationPreferences(false)}
        userId={user?.id || ''}
      />
    </div>
  )
} 