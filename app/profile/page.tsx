'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
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
  X
} from 'lucide-react'
import FirebirdLogo from '@/components/ui/FirebirdLogo'

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [isLoaded, setIsLoaded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'coach',
    avatar: user?.avatar || ''
  })

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }

  const handleSave = () => {
    // Here you would typically save the profile data to your backend
    console.log('Saving profile:', profileData)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setProfileData({
      name: user?.name || '',
      email: user?.email || '',
      role: user?.role || 'coach',
      avatar: user?.avatar || ''
    })
    setIsEditing(false)
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
                    onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-200"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSave}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all duration-200"
                    >
                      <Save className="h-4 w-4" />
                      <span>Save</span>
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
                <button className="w-full flex items-center space-x-3 p-3 rounded-xl bg-red-50 hover:bg-red-100 transition-all duration-200 group">
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