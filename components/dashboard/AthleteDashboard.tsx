'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { AthleteStats, getPersonalizedWelcome } from '@/lib/utils'
import { useTeamMessages } from '@/lib/hooks/useTeamMessages'
import { useUserWorkouts } from '@/lib/hooks/useUserWorkouts'
import { getUncompletedUserWorkouts } from '@/lib/utils'
import NotificationCenter from '@/components/ui/NotificationCenter'
import PushNotificationSetup from '@/components/ui/PushNotificationSetup'
import PersonalPerformanceCard from '@/components/ui/PersonalPerformanceCard'
import { 
  Activity, 
  Calendar, 
  MessageSquare, 
  Play, 
  LogOut,
  TrendingUp,
  Clock,
  CheckCircle,
  Target,
  Trophy,
  Video,
  Phone,
  Send,
  Users,
  Award,
  Star,
  Heart,
  Dumbbell,
  Menu,
  ChevronDown
} from 'lucide-react'
import FirebirdLogo from '@/components/ui/FirebirdLogo'
import { SmartLoadingMessage, EmptyState } from '@/components/ui/LoadingStates'
import { DashboardErrorBoundary } from '@/components/ui/DashboardErrorBoundary'

const mockAthleteStats: AthleteStats = {
  totalWorkouts: 45,
  completedWorkouts: 42,
  nextWorkout: 'Upper Body Strength - Tomorrow 9:00 AM',
  upcomingEvents: 2,
  teamMessages: 3
}

// Real upcoming events will come from actual data - no mock data

// Removed mockTeamMessages - now using actual data from getTeamMessages

const MAX_COLLAPSED_CHATS = 2
const MAX_EXPANDED_CHATS = 4

const AthleteDashboard = React.memo(function AthleteDashboard() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Use custom hooks for team messages and workouts
  const { teamMessages, isLoadingMessages } = useTeamMessages(user?.id)
  const [showAllChats, setShowAllChats] = useState(false)

  const chatLimit = showAllChats ? MAX_EXPANDED_CHATS : MAX_COLLAPSED_CHATS
  const visibleTeamMessages = teamMessages.slice(0, chatLimit)
  const canToggleChats = teamMessages.length > MAX_COLLAPSED_CHATS
  const chatListMaxHeight = showAllChats ? 520 : 260
  const { workouts, isLoadingWorkouts } = useUserWorkouts(user?.id)
  
  // State for uncompleted workouts (for Next Workout section)
  const [nextWorkouts, setNextWorkouts] = useState<any[]>([])
  const [isLoadingNextWorkouts, setIsLoadingNextWorkouts] = useState(true)

  useEffect(() => {
    // Simulate loading animation
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false)
      }
    }

    if (showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [showMobileMenu])

  // Fetch uncompleted workouts for Next Workout section
  useEffect(() => {
    if (!user?.id) {
      setNextWorkouts([])
      setIsLoadingNextWorkouts(false)
      return
    }

    const fetchNextWorkouts = async () => {
      try {
        setIsLoadingNextWorkouts(true)
        const uncompletedWorkouts = await getUncompletedUserWorkouts(user.id)
        setNextWorkouts(uncompletedWorkouts)
      } catch (error) {
        console.error('Error fetching next workouts:', error)
        setNextWorkouts([])
      } finally {
        setIsLoadingNextWorkouts(false)
      }
    }

    fetchNextWorkouts()
  }, [user?.id])

  // Messages are now loaded via the useTeamMessages hook

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }

  // Calculate real progress based on workouts
  const totalWorkouts = workouts.length
  const completedWorkouts = Math.floor(totalWorkouts * 0.8) // Assume 80% completion for demo
  const progressPercentage = totalWorkouts > 0 ? (completedWorkouts / totalWorkouts) * 100 : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <PushNotificationSetup />
      {/* Header */}
      <header className="glass-effect border-b border-white/20 shadow-sm sticky top-0 z-50 backdrop-blur-md">
        <div className="container-responsive">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo Section - Ultra Compact on Mobile */}
            <div className="flex items-center space-x-1 sm:space-x-3 md:space-x-6 flex-shrink-0">
              <div className={`flex items-center space-x-1 sm:space-x-3 md:space-x-4 transition-all duration-500 ${isLoaded ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
                <div className="relative">
                  <FirebirdLogo className="h-8 w-8 sm:h-12 sm:w-12 md:h-14 md:w-14 drop-shadow-lg" />
                </div>
                <div className={`transition-all duration-500 delay-100 ${isLoaded ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'} hidden sm:block`}>
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-royal-blue via-blue-600 to-dark-blue bg-clip-text text-transparent font-elegant tracking-tight">Firebird Fit</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-medium tracking-wide">Team Performance & Communication</p>
                </div>
              </div>
            </div>
            
            {/* Navigation Tabs - Compact on Mobile */}
            <div className="flex items-center justify-center flex-1 px-1 sm:px-4 min-w-0">
              <div className="flex space-x-0.5 sm:space-x-1 p-0.5 sm:p-2 bg-gray-100 dark:bg-slate-800 rounded-lg sm:rounded-2xl overflow-x-auto scrollbar-hide">
                {[
                  { id: 'workouts', label: 'Workouts', icon: Dumbbell, href: '/workouts' },
                  { id: 'calendar', label: 'Calendar', icon: Calendar, href: '/calendar' },
                  { id: 'messages', label: 'Messages', icon: MessageSquare, href: '/messages' }
                ].map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        router.push(tab.href)
                      }}
                      className={`flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg sm:rounded-xl font-medium transition-all duration-200 min-w-[60px] sm:min-w-[80px] touch-manipulation ${
                        isActive
                          ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-slate-700/50 active:bg-white/70 dark:active:bg-slate-700/70'
                      }`}
                    >
                      <Icon className="h-4 w-4 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="hidden sm:block text-sm whitespace-nowrap">{tab.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            
            {/* Right Side - Ultra Compact Mobile */}
            <div className="flex items-center space-x-0.5 sm:space-x-3 flex-shrink-0">
              <NotificationCenter />
              
              {/* Mobile Menu Button */}
              <div className="relative" ref={menuRef}>
                <button 
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="flex items-center space-x-0.5 sm:space-x-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg sm:rounded-xl px-1.5 sm:px-3 py-1.5 sm:py-2 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer border border-white/50 dark:border-slate-700/50"
                >
                  <div className="h-6 w-6 sm:h-8 sm:w-8 bg-gradient-to-br from-royal-blue to-dark-blue rounded-full flex items-center justify-center border-2 border-royal-blue">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <ChevronDown className={`h-3 w-3 sm:h-4 sm:w-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${showMobileMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showMobileMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                    <button
                      onClick={() => {
                        router.push('/profile')
                        setShowMobileMenu(false)
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center space-x-3 transition-colors duration-200 rounded-lg mx-1"
                    >
                      <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        handleLogout()
                        setShowMobileMenu(false)
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-red-50 flex items-center space-x-3 transition-colors duration-200 text-red-600 rounded-lg mx-1"
                    >
                      <LogOut className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium">Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container-responsive py-4 sm:py-6 md:py-8">
        {/* Welcome Section */}
        <div className={`mb-4 sm:mb-6 md:mb-8 transition-all duration-500 delay-200 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 px-1">{getPersonalizedWelcome(user)}</h2>
        </div>

        {/* Messages & Quick Actions */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-2 sm:mb-4 md:mb-6 transition-all duration-500 delay-400 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          {/* Messages */}
          <DashboardErrorBoundary componentName="Messages">
            <div className="md:col-span-2 lg:col-span-2 card-elevated mobile-card hover-lift cursor-pointer transition-all duration-300 hover:scale-[1.01] md:hover:scale-[1.02] hover:shadow-2xl touch-manipulation active:scale-[0.99]" onClick={() => router.push('/messages')}>
              <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6">
                <h3 className="mobile-heading font-bold text-gray-900 dark:text-gray-100">Messages</h3>
                {canToggleChats && (
                  <button
                    className="flex items-center space-x-2 rounded-full bg-white/70 dark:bg-slate-700/70 px-3 py-1 text-xs font-semibold text-royal-blue dark:text-blue-300 shadow-sm hover:shadow focus-ring"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowAllChats(!showAllChats)
                    }}
                  >
                    <span>{showAllChats ? 'Show less' : 'Show more'}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showAllChats ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
            
            <div
              className="space-y-2 sm:space-y-3 overflow-hidden transition-[max-height] duration-600 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-[max-height]"
              style={{ maxHeight: `${chatListMaxHeight}px` }}
            >
              {isLoadingMessages ? (
                <SmartLoadingMessage 
                  type="messages" 
                  isInitial={teamMessages.length === 0}
                  hasData={teamMessages.length > 0}
                />
              ) : teamMessages.length > 0 ? (
                visibleTeamMessages.map((message, index) => (
                  <div 
                    key={message.id} 
                    className={`message-bubble transition-all duration-200 hover:scale-[1.02] ${message.unread ? 'ring-2 ring-royal-blue/20' : ''}`}
                    style={{ animationDelay: `${index * 100}ms` }}
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/messages?chat=${message.id}`)
                    }}
                  >
                    <div className="flex items-start space-x-3">
                          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center transition-transform duration-200 hover:scale-110 bg-gradient-to-br from-purple-500 to-purple-600 overflow-hidden text-white font-semibold">
                            {message.avatarUrl ? (
                              <img
                                src={message.avatarUrl}
                                alt={message.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-xs sm:text-sm">{message.initials}</span>
                            )}
                          </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-gray-900 dark:text-gray-100 mobile-text">{message.name}</p>
                          <span className="text-xs text-gray-500 dark:text-gray-300">{message.time}</span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 mobile-text">{message.lastMessage}</p>
                        {message.unread && (
                          <div className="flex items-center space-x-2 mt-2">
                            <span className="status-indicator"></span>
                            <span className="text-xs text-royal-blue dark:text-blue-400 font-medium">New message</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState 
                  type="messages"
                  actionText="View Messages"
                  onAction={() => router.push('/messages')}
                />
              )}
            </div>
          </div>
          </DashboardErrorBoundary>

          {/* Upcoming Events */}
          <div className="card-elevated mobile-card hover-lift">
            <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6">
              <h3 className="mobile-heading font-bold text-gray-900 dark:text-gray-100">Upcoming Events</h3>
              <button 
                onClick={() => router.push('/calendar')}
                className="text-royal-blue dark:text-blue-400 hover:text-dark-blue dark:hover:text-blue-300 text-sm font-semibold transition-colors duration-200 focus-ring"
              >
                View Calendar
              </button>
            </div>
            
            {/* Show upcoming events message for now - will be replaced with real events later */}
            <div className="text-center py-6">
              <Calendar className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-300 text-sm font-semibold">No upcoming events</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">Team events will appear here when scheduled</p>
            </div>
          </div>
        </div>

        {/* Bottom Row: Next Workout & Personal Performance */}
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 transition-all duration-500 delay-400 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          {/* Next Workout */}
          <div className="card-elevated mobile-card hover-lift">
            <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6">
              <h3 className="mobile-heading font-bold text-gray-900 dark:text-gray-100">Next Workout</h3>
            </div>
           
           {isLoadingNextWorkouts ? (
             <SmartLoadingMessage 
               type="workouts" 
               isInitial={nextWorkouts.length === 0}
               hasData={nextWorkouts.length > 0}
             />
           ) : nextWorkouts.length > 0 ? (
             <div className="relative p-6 bg-gradient-to-br from-royal-blue via-blue-600 to-dark-blue rounded-2xl text-white shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
               {/* Background Pattern */}
               <div className="absolute inset-0 opacity-10">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
                 <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
               </div>
               
               {/* Content */}
               <div className="relative flex items-center justify-between">
                 <div className="flex items-center space-x-3">
                   <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                     <Dumbbell className="h-6 w-6 text-white group-hover:scale-110 transition-transform duration-300" />
                   </div>
                   <div>
                     <h4 className="font-bold text-lg sm:text-xl">{nextWorkouts[0].title}</h4>
                     {nextWorkouts[0].description && (
                       <p className="text-white/80 text-sm mt-1">{nextWorkouts[0].description}</p>
                     )}
                   </div>
                 </div>
                 <button 
                   onClick={() => router.push('/workouts')}
                   className="bg-white/20 hover:bg-white/30 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg backdrop-blur-sm group-hover:bg-white/25 touch-manipulation"
                 >
                   Start
                 </button>
               </div>
               
               {/* Subtle Animation */}
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
             </div>
           ) : (
             <EmptyState 
               type="workouts"
               title="No Workouts Yet"
               description="Your coach hasn't assigned any workouts yet."
               actionText="View All Workouts"
               onAction={() => router.push('/workouts')}
             />
           )}
         </div>

         {/* Personal Performance */}
         <PersonalPerformanceCard userId={user?.id || ''} />
        </div>

      </div>
    </div>
  )
})

export default AthleteDashboard 