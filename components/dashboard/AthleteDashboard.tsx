'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { AthleteStats } from '@/lib/utils'
import { useTeamMessages } from '@/lib/hooks/useTeamMessages'
import { useUserWorkouts } from '@/lib/hooks/useUserWorkouts'
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
  Dumbbell
} from 'lucide-react'
import FirebirdLogo from '@/components/ui/FirebirdLogo'

const mockAthleteStats: AthleteStats = {
  totalWorkouts: 45,
  completedWorkouts: 42,
  nextWorkout: 'Upper Body Strength - Tomorrow 9:00 AM',
  upcomingEvents: 2,
  teamMessages: 3
}

const mockUpcomingEvents = [
  { id: 1, title: 'Team Practice', date: 'Tomorrow', time: '3:00 PM', type: 'practice', location: 'Main Gym' },
  { id: 2, title: 'Championship Game', date: 'Saturday', time: '2:00 PM', type: 'game', location: 'Stadium' },
]

// Removed mockTeamMessages - now using actual data from getTeamMessages

const mockQuickActions = [
  { id: 1, title: 'Start Workout', icon: Play, color: 'bg-royal-blue', description: 'Begin training', href: '/workouts' },
  { id: 2, title: 'View Schedule', icon: Calendar, color: 'bg-green-500', description: 'Check calendar', href: '/calendar' },
  { id: 3, title: 'Team Chat', icon: MessageSquare, color: 'bg-purple-500', description: 'Send message', href: '/messages' },
]

export default function AthleteDashboard() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)

  // Use custom hooks for team messages and workouts
  const { teamMessages, isLoadingMessages } = useTeamMessages(user?.id)
  const { workouts, isLoadingWorkouts } = useUserWorkouts(user?.id)

  useEffect(() => {
    // Simulate loading animation
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="glass-effect border-b border-white/20 shadow-sm sticky top-0 z-50 backdrop-blur-md">
        <div className="container-responsive">
          <div className="flex justify-between items-center h-16 md:h-20">
            <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-6">
              <div className={`flex items-center space-x-2 sm:space-x-3 md:space-x-4 transition-all duration-500 ${isLoaded ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
                <div className="relative">
                  <FirebirdLogo className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 drop-shadow-lg" />
                </div>
                <div className={`transition-all duration-500 delay-100 ${isLoaded ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}`}>
                  <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-royal-blue via-blue-600 to-dark-blue bg-clip-text text-transparent font-elegant tracking-tight">Firebird Fit</h1>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium hidden sm:block tracking-wide">Team Performance & Communication</p>
                </div>
              </div>
            </div>
            
            {/* Navigation Tabs */}
            <div className="flex items-center justify-center flex-1 px-2 sm:px-4">
              <div className="flex space-x-0.5 sm:space-x-1 p-1 sm:p-2 bg-gray-100 rounded-xl sm:rounded-2xl overflow-x-auto scrollbar-hide">
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
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-white/50 active:bg-white/70'
                      }`}
                    >
                      <Icon className="h-4 w-4 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="hidden sm:block text-sm whitespace-nowrap">{tab.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button 
                onClick={() => router.push('/profile')}
                className="flex items-center space-x-2 sm:space-x-3 bg-white rounded-xl px-2 sm:px-3 py-2 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer"
              >
                <div className="h-6 w-6 sm:h-8 sm:w-8 bg-gradient-to-br from-royal-blue to-dark-blue rounded-full flex items-center justify-center border-2 border-royal-blue">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
              </button>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-600 transition-all duration-200 hover:scale-110 focus-ring"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container-responsive py-4 sm:py-6 md:py-8">
        {/* Welcome Section */}
        <div className={`mb-4 sm:mb-6 md:mb-8 transition-all duration-500 delay-200 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 px-1">Welcome back, Athlete!</h2>
        </div>

        {/* Messages & Quick Actions */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-4 sm:mb-6 md:mb-8 transition-all duration-500 delay-400 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          {/* Messages */}
          <div className="md:col-span-2 lg:col-span-2 card-elevated mobile-card hover-lift cursor-pointer transition-all duration-300 hover:scale-[1.01] md:hover:scale-[1.02] hover:shadow-2xl touch-manipulation active:scale-[0.99]" onClick={() => router.push('/messages')}>
            <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6">
              <h3 className="mobile-heading font-bold text-gray-900">Messages</h3>
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
                  <span className="text-gray-600">Loading messages...</span>
                </div>
              ) : teamMessages.length > 0 ? (
                teamMessages.slice(0, 3).map((message, index) => (
                  <div 
                    key={message.id} 
                    className={`message-bubble transition-all duration-200 hover:scale-[1.02] ${message.unread ? 'ring-2 ring-royal-blue/20' : ''}`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center transition-transform duration-200 hover:scale-110 ${
                        message.type === 'group' 
                          ? 'bg-gradient-to-br from-purple-500 to-purple-600' 
                          : 'bg-gradient-to-br from-royal-blue to-dark-blue'
                      }`}>
                        {message.type === 'group' ? (
                          <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        ) : (
                          <span className="text-white font-semibold text-xs sm:text-sm">
                            {message.avatar}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-gray-900 mobile-text">{message.name}</p>
                          <span className="text-xs text-gray-500">{message.time}</span>
                        </div>
                        <p className="text-gray-700 mobile-text">{message.lastMessage}</p>
                        {message.unread && (
                          <div className="flex items-center space-x-2 mt-2">
                            <span className="status-indicator"></span>
                            <span className="text-xs text-royal-blue font-medium">New message</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-sm">No messages yet</p>
                  <p className="text-gray-500 text-xs mt-1">Team conversations will appear here</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card-elevated mobile-card hover-lift">
            <h3 className="mobile-heading font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6">Quick Actions</h3>
            <div className="space-y-2 sm:space-y-3">
              {mockQuickActions.map((action, index) => (
                <button 
                  key={action.id} 
                  onClick={() => router.push(action.href)}
                  className="w-full flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 group focus-ring touch-manipulation"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`h-10 w-10 sm:h-12 sm:w-12 ${action.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                    <action.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-900 mobile-text">{action.title}</h4>
                    <p className="text-sm text-gray-600 hidden sm:block">{action.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Next Workout & Upcoming Events */}
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 transition-all duration-500 delay-500 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                     {/* Next Workout */}
           <div className="card-elevated mobile-card hover-lift">
             <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6">
               <h3 className="mobile-heading font-bold text-gray-900">Next Workout</h3>
             </div>
            
            {isLoadingWorkouts ? (
              <div className="relative p-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl shadow-lg animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 bg-gray-300 rounded-xl"></div>
                    <div className="h-6 w-32 bg-gray-300 rounded"></div>
                  </div>
                  <div className="h-10 w-16 bg-gray-300 rounded-xl"></div>
                </div>
              </div>
            ) : workouts.length > 0 ? (
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
                      <h4 className="font-bold text-lg sm:text-xl">{workouts[0].title}</h4>
                      {workouts[0].description && (
                        <p className="text-white/80 text-sm mt-1">{workouts[0].description}</p>
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
              <div className="relative p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-lg border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <div className="h-12 w-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Dumbbell className="h-6 w-6 text-gray-400" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">No Workouts Yet</h4>
                  <p className="text-sm text-gray-600 mb-4">Your coach hasn't assigned any workouts yet.</p>
                  <button 
                    onClick={() => router.push('/workouts')}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg touch-manipulation"
                  >
                    View All Workouts
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Upcoming Events */}
          <div className="card-elevated hover-lift">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Upcoming Events</h3>
              <button className="text-royal-blue hover:text-dark-blue text-sm font-semibold transition-colors duration-200 focus-ring">
                View Calendar
              </button>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              {mockUpcomingEvents.map((event, index) => (
                <div 
                  key={event.id} 
                  className="p-3 sm:p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all duration-200 hover:scale-[1.02] focus-ring"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center transition-transform duration-200 hover:scale-110 ${
                      event.type === 'game' ? 'bg-gradient-to-br from-red-100 to-red-200' : 'bg-gradient-to-br from-blue-100 to-blue-200'
                    }`}>
                      <Calendar className={`h-4 w-4 sm:h-5 sm:w-5 ${
                        event.type === 'game' ? 'text-red-600' : 'text-blue-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-gray-900 mobile-text">{event.title}</p>
                        {event.type === 'game' && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">Game</span>
                        )}
                        {event.type === 'practice' && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">Practice</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{event.date} • {event.time}</p>
                      <p className="text-xs text-gray-500">{event.location}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 