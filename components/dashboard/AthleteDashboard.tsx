'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { AthleteStats } from '@/lib/utils'
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
  Bell,
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
  nextWorkout: 'Strength Training - Tomorrow 9:00 AM',
  upcomingEvents: 2,
  teamMessages: 3
}

const mockUpcomingEvents = [
  { id: 1, title: 'Team Practice', date: 'Tomorrow', time: '3:00 PM', type: 'practice', location: 'Main Gym' },
  { id: 2, title: 'Championship Game', date: 'Saturday', time: '2:00 PM', type: 'game', location: 'Stadium' },
]

const mockTeamMessages = [
  { id: 1, from: 'Coach Johnson', message: 'Great work on today\'s training session! Your form has improved significantly.', time: '1 hour ago', unread: true, type: 'coach' },
  { id: 2, from: 'Team Captain', message: 'Team meeting tomorrow before practice. Important updates to discuss.', time: '3 hours ago', unread: false, type: 'captain' },
  { id: 3, from: 'Coach Johnson', message: 'New workout plan uploaded. Check your schedule for this week.', time: '1 day ago', unread: false, type: 'coach' },
]

const mockQuickActions = [
  { id: 1, title: 'Start Workout', icon: Play, color: 'bg-royal-blue', description: 'Begin training' },
  { id: 2, title: 'View Schedule', icon: Calendar, color: 'bg-green-500', description: 'Check calendar' },
  { id: 3, title: 'Team Chat', icon: MessageSquare, color: 'bg-purple-500', description: 'Send message' },
]

export default function AthleteDashboard() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(() => {
    const pathname = window.location.pathname
    if (pathname.startsWith('/workouts')) return 'workouts'
    if (pathname.startsWith('/calendar')) return 'calendar'
    if (pathname.startsWith('/messages')) return 'messages'
    return 'workouts'
  })
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Simulate loading animation
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleLogout = () => {
    logout()
  }

  const progressPercentage = (mockAthleteStats.completedWorkouts / mockAthleteStats.totalWorkouts) * 100

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
                <p className="text-xs sm:text-sm text-gray-600 font-medium hidden sm:block">Performance & Team Communication</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-all duration-200 hover:scale-110 focus-ring">
                <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="absolute -top-1 -right-1 h-2 w-2 sm:h-3 sm:w-3 bg-red-500 rounded-full animate-pulse"></span>
              </button>
              <button 
                onClick={() => router.push('/profile')}
                className="flex items-center space-x-2 sm:space-x-3 bg-white rounded-xl px-2 sm:px-3 py-2 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer"
              >
                <div className="h-6 w-6 sm:h-8 sm:w-8 bg-gradient-to-br from-royal-blue to-dark-blue rounded-full flex items-center justify-center border-2 border-royal-blue">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-gray-700 hidden sm:block">{user?.name}</span>
              </button>
              <div className="flex items-center space-x-2 sm:space-x-3 bg-white rounded-xl px-2 sm:px-3 py-2 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="h-6 w-6 sm:h-8 sm:w-8 bg-gradient-to-br from-royal-blue to-dark-blue rounded-full flex items-center justify-center border-2 border-royal-blue">
                  <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-gray-700 hidden sm:block">{user?.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-600 transition-all duration-200 hover:scale-110 focus-ring"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex justify-center pb-4">
            <div className="flex space-x-1 p-2 bg-gray-100 rounded-2xl">
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
                      setActiveTab(tab.id)
                      router.push(tab.href)
                    }}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="hidden sm:block">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </header>

      <div className="container-responsive py-6 sm:py-8">
        {/* Welcome Section */}
        <div className={`mb-6 sm:mb-8 transition-all duration-500 delay-200 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.name}!</h2>
          <p className="text-gray-600 mobile-text">Ready to crush your next workout and connect with your team?</p>
        </div>



        {/* Messages & Quick Actions */}
        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8 transition-all duration-500 delay-400 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          {/* Messages */}
          <div className="lg:col-span-2 card-elevated hover-lift cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl" onClick={() => router.push('/messages')}>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Messages</h3>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              {mockTeamMessages.map((message, index) => (
                <div 
                  key={message.id} 
                  className={`message-bubble transition-all duration-200 hover:scale-[1.02] ${message.unread ? 'ring-2 ring-royal-blue/20' : ''}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center transition-transform duration-200 hover:scale-110 ${
                      message.type === 'coach' ? 'bg-gradient-to-br from-royal-blue to-dark-blue' : 'bg-gradient-to-br from-gold to-yellow-400'
                    }`}>
                      <span className="text-white font-semibold text-xs sm:text-sm">
                        {message.from.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-semibold text-gray-900 mobile-text">{message.from}</p>
                          {message.type === 'coach' && (
                            <span className="text-xs bg-royal-blue text-white px-2 py-1 rounded-full">Coach</span>
                          )}
                          {message.type === 'captain' && (
                            <span className="text-xs bg-gold text-gray-800 px-2 py-1 rounded-full">Captain</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">{message.time}</span>
                      </div>
                      <p className="text-gray-700 mobile-text">{message.message}</p>
                      {message.unread && (
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="status-indicator"></span>
                          <span className="text-xs text-royal-blue font-medium">New message</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card-elevated hover-lift">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Quick Actions</h3>
            <div className="space-y-3 sm:space-y-4">
              {mockQuickActions.map((action, index) => (
                <button 
                  key={action.id} 
                  className="w-full flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all duration-200 group focus-ring"
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
          <div className="card-elevated hover-lift">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Next Workout</h3>
              <div className="h-6 w-6 sm:h-8 sm:w-8 bg-gradient-to-br from-royal-blue to-dark-blue rounded-xl flex items-center justify-center">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              <div className="p-4 sm:p-6 bg-gradient-to-br from-royal-blue to-dark-blue rounded-2xl text-white shadow-lg">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <h4 className="font-bold text-base sm:text-lg">Strength Training</h4>
                  <Star className="h-4 w-4 sm:h-5 sm:w-5 text-gold" />
                </div>
                <p className="text-blue-100 mb-3 sm:mb-4 text-sm sm:text-base">Focus on upper body and core strength. Coach Johnson will be leading this session.</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm">Tomorrow • 9:00 AM</span>
                  </div>
                  <button className="btn-secondary text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-2">
                    Start Training
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600">
                <span>Estimated duration: 45 minutes</span>
                <span className="flex items-center">
                  <Heart className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-red-500" />
                  High Intensity
                </span>
              </div>
            </div>
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