'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { TeamStats } from '@/lib/utils'
import { useTeamMessages } from '@/lib/hooks/useTeamMessages'
import { 
  Users, 
  Activity, 
  Calendar, 
  MessageSquare, 
  Plus, 
  Settings, 
  LogOut,
  TrendingUp,
  Clock,
  CheckCircle,
  Bell,
  Video,
  Phone,
  Send,
  BarChart3,
  Target,
  Award,
  X,
  Dumbbell,
  Timer,
  Repeat,
  Zap
} from 'lucide-react'
import FirebirdLogo from '@/components/ui/FirebirdLogo'

const mockTeamStats: TeamStats = {
  totalAthletes: 24,
  activeAthletes: 18,
  completedWorkouts: 156,
  upcomingEvents: 3
}

const mockRecentActivity = [
  { id: 1, athlete: 'Jake Rodriguez', action: 'completed workout', time: '2 hours ago', type: 'workout' },
  { id: 2, athlete: 'Marcus Johnson', action: 'sent team message', time: '3 hours ago', type: 'message' },
  { id: 3, athlete: 'Tyler Williams', action: 'completed workout', time: '4 hours ago', type: 'workout' },
  { id: 4, athlete: 'Brandon Davis', action: 'joined team call', time: '5 hours ago', type: 'call' },
]

// Removed mockTeamMessages - now using actual data from getTeamMessages

const mockQuickActions = [
  { id: 1, title: 'Create Workout', icon: Plus, color: 'bg-royal-blue', description: 'Design new training' },
  { id: 2, title: 'Add Event', icon: Calendar, color: 'bg-green-500', description: 'Create calendar event' },
  { id: 3, title: 'Send Announcement', icon: Send, color: 'bg-purple-500', description: 'Team message' },
]

const eventTypes = [
  { id: 'practice', label: 'Practice', color: 'bg-blue-500' },
  { id: 'game', label: 'Game', color: 'bg-red-500' },
  { id: 'meeting', label: 'Meeting', color: 'bg-green-500' },
  { id: 'training', label: 'Training', color: 'bg-purple-500' }
]

const exerciseLibrary = [
  { name: 'Push-ups', category: 'strength', muscle: 'Chest, Triceps' },
  { name: 'Pull-ups', category: 'strength', muscle: 'Back, Biceps' },
  { name: 'Squats', category: 'strength', muscle: 'Legs, Glutes' },
  { name: 'Deadlifts', category: 'strength', muscle: 'Back, Legs' },
  { name: 'Bench Press', category: 'strength', muscle: 'Chest, Shoulders' },
  { name: 'Planks', category: 'core', muscle: 'Core, Abs' },
  { name: 'Burpees', category: 'cardio', muscle: 'Full Body' },
  { name: 'Mountain Climbers', category: 'cardio', muscle: 'Core, Cardio' },
  { name: 'Jumping Jacks', category: 'cardio', muscle: 'Cardio' },
  { name: 'Lunges', category: 'strength', muscle: 'Legs, Glutes' },
  { name: 'Russian Twists', category: 'core', muscle: 'Core, Obliques' },
  { name: 'High Knees', category: 'cardio', muscle: 'Cardio, Legs' },
  { name: 'Dumbbell Rows', category: 'strength', muscle: 'Back, Biceps' },
  { name: 'Shoulder Press', category: 'strength', muscle: 'Shoulders' },
  { name: 'Bicep Curls', category: 'strength', muscle: 'Biceps' },
  { name: 'Tricep Dips', category: 'strength', muscle: 'Triceps' },
  { name: 'Leg Press', category: 'strength', muscle: 'Legs' },
  { name: 'Calf Raises', category: 'strength', muscle: 'Calves' },
  { name: 'Side Planks', category: 'core', muscle: 'Core, Obliques' },
  { name: 'Butterfly Kicks', category: 'core', muscle: 'Core, Abs' }
]

export default function CoachDashboard() {
  const { user, logout } = useAuth()
  const router = useRouter()
  
  // Refs for modal click-outside detection
  const createWorkoutModalRef = useRef<HTMLDivElement>(null)
  const createEventModalRef = useRef<HTMLDivElement>(null)
  const sendAnnouncementModalRef = useRef<HTMLDivElement>(null)
  
  const [activeTab, setActiveTab] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)
  const [showCreateWorkout, setShowCreateWorkout] = useState(false)
  const [showCreateEvent, setShowCreateEvent] = useState(false)
  const [showSendAnnouncement, setShowSendAnnouncement] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [workoutName, setWorkoutName] = useState('')
  const [workoutType, setWorkoutType] = useState('strength')
  const [workoutDuration, setWorkoutDuration] = useState('60')
  const [workoutDifficulty, setWorkoutDifficulty] = useState('intermediate')
  const [workoutDescription, setWorkoutDescription] = useState('')
  const [exercises, setExercises] = useState<any[]>([])
  const [selectedExercise, setSelectedExercise] = useState('')
  const [exerciseSets, setExerciseSets] = useState('3')
  const [exerciseReps, setExerciseReps] = useState('10')
  const [exerciseRest, setExerciseRest] = useState('60')
  
  // Event form state
  const [eventForm, setEventForm] = useState({
    title: '',
    date: '',
    time: '',
    duration: '60',
    location: '',
    type: 'practice',
    description: '',
    attendees: ''
  })

  // Announcement form state
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    priority: 'normal',
    recipients: 'all',
    scheduled: false,
    scheduledDate: '',
    scheduledTime: ''
  })

  // Use custom hook for team messages
  const { teamMessages, isLoadingMessages } = useTeamMessages(user?.id)

  useEffect(() => {
    // Simulate loading animation
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Messages are now loaded via the useTeamMessages hook

  // Handle click outside modals
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      
      // Close Create Workout modal
      if (showCreateWorkout && createWorkoutModalRef.current && !createWorkoutModalRef.current.contains(target)) {
        setShowCreateWorkout(false)
      }
      
      // Close Create Event modal
      if (showCreateEvent && createEventModalRef.current && !createEventModalRef.current.contains(target)) {
        setShowCreateEvent(false)
      }
      
      // Close Send Announcement modal
      if (showSendAnnouncement && sendAnnouncementModalRef.current && !sendAnnouncementModalRef.current.contains(target)) {
        setShowSendAnnouncement(false)
      }
    }

    // Add event listener if any modal is open
    if (showCreateWorkout || showCreateEvent || showSendAnnouncement) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCreateWorkout, showCreateEvent, showSendAnnouncement])

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }

  const handleCreateWorkout = (e: React.FormEvent) => {
    e.preventDefault()
    if (workoutName.trim() && exercises.length > 0) {
      // Here you would typically save the workout to your backend
      console.log('Creating workout:', {
        name: workoutName,
        type: workoutType,
        duration: workoutDuration,
        difficulty: workoutDifficulty,
        description: workoutDescription,
        exercises: exercises
      })
      setShowCreateWorkout(false)
      // Reset form
      setWorkoutName('')
      setWorkoutType('strength')
      setWorkoutDuration('60')
      setWorkoutDifficulty('intermediate')
      setWorkoutDescription('')
      setExercises([])
    }
  }

  const addExercise = () => {
    if (selectedExercise && exerciseSets && exerciseReps) {
      const exercise = exerciseLibrary.find(ex => ex.name === selectedExercise)
      const newExercise = {
        name: selectedExercise,
        category: exercise?.category || 'strength',
        muscle: exercise?.muscle || 'Full Body',
        sets: parseInt(exerciseSets),
        reps: parseInt(exerciseReps),
        rest: parseInt(exerciseRest)
      }
      setExercises([...exercises, newExercise])
      setSelectedExercise('')
      setExerciseSets('3')
      setExerciseReps('10')
      setExerciseRest('60')
    }
  }

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index))
  }

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault()
    if (eventForm.title && eventForm.date && eventForm.time) {
      // Here you would typically save the event to your backend
      console.log('Creating event:', eventForm)
      setShowCreateEvent(false)
      setShowSuccessMessage(true)
      setEventForm({
        title: '',
        date: '',
        time: '',
        duration: '60',
        location: '',
        type: 'practice',
        description: '',
        attendees: ''
      })
      
      // Hide success message after 3 seconds
      setTimeout(() => setShowSuccessMessage(false), 3000)
    }
  }

  const handleSendAnnouncement = (e: React.FormEvent) => {
    e.preventDefault()
    if (announcementForm.title && announcementForm.message) {
      // Here you would typically send the announcement to your backend
      console.log('Sending announcement:', announcementForm)
      setShowSendAnnouncement(false)
      setShowSuccessMessage(true)
      setAnnouncementForm({
        title: '',
        message: '',
        priority: 'normal',
        recipients: 'all',
        scheduled: false,
        scheduledDate: '',
        scheduledTime: ''
      })
      
      // Hide success message after 3 seconds
      setTimeout(() => setShowSuccessMessage(false), 3000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="glass-effect border-b border-white/20 shadow-sm sticky top-0 z-50 backdrop-blur-md">
        <div className="container-responsive">
                    <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4 sm:space-x-6">
              <div className={`flex items-center space-x-3 sm:space-x-4 transition-all duration-500 ${isLoaded ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
                <div className="relative">
                  <div className="h-12 w-12 sm:h-14 sm:w-14 bg-gradient-to-br from-royal-blue via-blue-600 to-dark-blue rounded-2xl shadow-lg flex items-center justify-center border-2 border-white/20 backdrop-blur-sm">
                    <FirebirdLogo className="h-6 w-6 sm:h-7 sm:w-7 text-white drop-shadow-sm" />
                  </div>
                </div>
                <div className={`transition-all duration-500 delay-100 ${isLoaded ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}`}>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-royal-blue via-blue-600 to-dark-blue bg-clip-text text-transparent font-elegant tracking-tight">Firebird Fit</h1>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium hidden sm:block tracking-wide">Team Performance & Communication</p>
                </div>
              </div>
            </div>
            
            {/* Navigation Tabs */}
            <div className="flex items-center justify-center flex-1">
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
                        router.push(tab.href)
                      }}
                      className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 min-w-[80px] ${
                        isActive
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:block text-sm">{tab.label}</span>
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
                <span className="text-xs sm:text-sm font-semibold text-gray-700 hidden sm:block">{user?.name}</span>
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

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-2xl shadow-lg transform transition-all duration-300 animate-in slide-in-from-right">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span className="font-semibold">Action completed successfully!</span>
          </div>
        </div>
      )}

      <div className="container-responsive py-6 sm:py-8">
        {/* Welcome Section */}
        <div className={`mb-6 sm:mb-8 transition-all duration-500 delay-200 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Welcome back, Coach!</h2>
        </div>



        {/* Communication & Quick Actions */}
        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8 transition-all duration-500 delay-400 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          {/* Team Communication */}
          <div className="lg:col-span-2 card-elevated hover-lift cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl" onClick={() => router.push('/messages')}>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Team Communication</h3>
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
          <div className="card-elevated hover-lift">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Quick Actions</h3>
            <div className="space-y-2 sm:space-y-3">
              {mockQuickActions.map((action, index) => (
                <button 
                  key={action.id} 
                  className="w-full flex items-center space-x-3 sm:space-x-4 p-2.5 sm:p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all duration-200 group focus-ring"
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => {
                    if (action.title === 'Create Workout') {
                      setShowCreateWorkout(true)
                    } else if (action.title === 'Add Event') {
                      setShowCreateEvent(true)
                    } else if (action.title === 'Send Announcement') {
                      setShowSendAnnouncement(true)
                    }
                  }}
                >
                                     <div className={`h-8 w-8 sm:h-10 sm:w-10 ${action.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                     <action.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
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

        {/* Recent Activity & Team Performance */}
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 transition-all duration-500 delay-500 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          {/* Recent Activity */}
          <div className="card-elevated hover-lift">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Recent Activity</h3>
              <button className="text-royal-blue hover:text-dark-blue text-sm font-semibold transition-colors duration-200 focus-ring">
                View All
              </button>
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              {mockRecentActivity.slice(0, 3).map((activity, index) => (
                <div 
                  key={activity.id} 
                  className="flex items-center space-x-3 p-2 sm:p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all duration-200 hover:scale-[1.02] focus-ring"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`h-6 w-6 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center transition-transform duration-200 hover:scale-110 ${
                    activity.type === 'workout' ? 'bg-green-100' :
                    activity.type === 'message' ? 'bg-blue-100' : 'bg-purple-100'
                  }`}>
                    {activity.type === 'workout' ? <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" /> :
                     activity.type === 'message' ? <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" /> :
                     <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-semibold text-gray-900">
                      <span className="text-royal-blue">{activity.athlete}</span> {activity.action}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Performance */}
          <div className="card-elevated hover-lift">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Team Performance</h3>
              <Award className="h-5 w-5 sm:h-6 sm:w-6 text-gold" />
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold gradient-text mb-1">92%</div>
                <p className="text-xs sm:text-sm text-gray-600">Overall Performance</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Attendance</span>
                  <span className="text-xs sm:text-sm font-semibold text-green-600">95%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div className="bg-green-500 h-1.5 rounded-full transition-all duration-1000" style={{ width: '95%' }}></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Completion</span>
                  <span className="text-xs sm:text-sm font-semibold text-blue-600">88%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-1000" style={{ width: '88%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Create Workout Modal */}
        {showCreateWorkout && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div ref={createWorkoutModalRef} className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-royal-blue to-dark-blue rounded-full flex items-center justify-center">
                    <Dumbbell className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Create New Workout</h3>
                    <p className="text-sm text-gray-500">Design a training session for your team</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateWorkout(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <form onSubmit={handleCreateWorkout} className="space-y-6">
                  {/* Workout Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Workout Name
                      </label>
                      <input
                        type="text"
                        value={workoutName}
                        onChange={(e) => setWorkoutName(e.target.value)}
                        placeholder="Enter workout name..."
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-base"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Workout Type
                      </label>
                      <select
                        value={workoutType}
                        onChange={(e) => setWorkoutType(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-base"
                      >
                        <option value="strength">Strength Training</option>
                        <option value="cardio">Cardio</option>
                        <option value="core">Core Workout</option>
                        <option value="flexibility">Flexibility</option>
                        <option value="mixed">Mixed Training</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Duration (minutes)
                      </label>
                      <select
                        value={workoutDuration}
                        onChange={(e) => setWorkoutDuration(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-base"
                      >
                        <option value="30">30 minutes</option>
                        <option value="45">45 minutes</option>
                        <option value="60">60 minutes</option>
                        <option value="75">75 minutes</option>
                        <option value="90">90 minutes</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Difficulty Level
                      </label>
                      <select
                        value={workoutDifficulty}
                        onChange={(e) => setWorkoutDifficulty(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-base"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={workoutDescription}
                      onChange={(e) => setWorkoutDescription(e.target.value)}
                      placeholder="Describe the workout goals and focus areas..."
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-base resize-none"
                    />
                  </div>

                  {/* Exercises Section */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Exercises</h4>
                    
                    {/* Add Exercise Form */}
                    <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Exercise</label>
                          <select
                            value={selectedExercise}
                            onChange={(e) => setSelectedExercise(e.target.value)}
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-sm"
                          >
                            <option value="">Select exercise...</option>
                            {exerciseLibrary.map((exercise) => (
                              <option key={exercise.name} value={exercise.name}>
                                {exercise.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Sets</label>
                          <input
                            type="number"
                            value={exerciseSets}
                            onChange={(e) => setExerciseSets(e.target.value)}
                            min="1"
                            max="10"
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Reps</label>
                          <input
                            type="number"
                            value={exerciseReps}
                            onChange={(e) => setExerciseReps(e.target.value)}
                            min="1"
                            max="50"
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-sm"
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={addExercise}
                            disabled={!selectedExercise}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Exercise List */}
                    <div className="space-y-3">
                      {exercises.map((exercise, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-2xl">
                          <div className="flex items-center space-x-4">
                            <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                              <Dumbbell className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h5 className="font-semibold text-gray-900">{exercise.name}</h5>
                              <p className="text-sm text-gray-500">{exercise.muscle}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <p className="text-sm font-semibold text-gray-900">{exercise.sets}</p>
                              <p className="text-xs text-gray-500">Sets</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-semibold text-gray-900">{exercise.reps}</p>
                              <p className="text-xs text-gray-500">Reps</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeExercise(index)}
                              className="p-2 text-red-500 hover:text-red-700 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setShowCreateWorkout(false)}
                    className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateWorkout}
                    disabled={!workoutName.trim() || exercises.length === 0}
                    className="bg-gradient-to-r from-royal-blue to-dark-blue hover:from-dark-blue hover:to-royal-blue text-white px-6 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create Workout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Event Modal */}
        {showCreateEvent && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div ref={createEventModalRef} className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Create New Event</h3>
                    <p className="text-sm text-gray-500">Schedule team activities and meetings</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateEvent(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <form onSubmit={handleCreateEvent} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Title
                    </label>
                    <input
                      type="text"
                      value={eventForm.title}
                      onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date
                      </label>
                      <input
                        type="date"
                        value={eventForm.date}
                        onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time
                      </label>
                      <input
                        type="time"
                        value={eventForm.time}
                        onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration (min)
                      </label>
                      <select
                        value={eventForm.duration}
                        onChange={(e) => setEventForm({ ...eventForm, duration: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300"
                      >
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="90">1.5 hours</option>
                        <option value="120">2 hours</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type
                      </label>
                      <select
                        value={eventForm.type}
                        onChange={(e) => setEventForm({ ...eventForm, type: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300"
                      >
                        {eventTypes.map((type) => (
                          <option key={type.id} value={type.id}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={eventForm.location}
                      onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={eventForm.description}
                      onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 resize-none"
                    />
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      setShowCreateEvent(false)
                      setEventForm({
                        title: '',
                        date: '',
                        time: '',
                        duration: '60',
                        location: '',
                        type: 'practice',
                        description: '',
                        attendees: ''
                      })
                    }}
                    className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateEvent}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                  >
                    Create Event
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Send Announcement Modal */}
        {showSendAnnouncement && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div ref={sendAnnouncementModalRef} className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Send className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Send Team Announcement</h3>
                    <p className="text-sm text-gray-500">Communicate important updates to your team</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSendAnnouncement(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <form onSubmit={handleSendAnnouncement} className="space-y-6">
                  {/* Announcement Title */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Announcement Title
                    </label>
                    <input
                      type="text"
                      value={announcementForm.title}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                      placeholder="Enter announcement title..."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 text-base"
                      required
                    />
                  </div>

                  {/* Priority Level */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Priority Level
                    </label>
                    <select
                      value={announcementForm.priority}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, priority: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 text-base"
                    >
                      <option value="low">Low Priority</option>
                      <option value="normal">Normal Priority</option>
                      <option value="high">High Priority</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  {/* Recipients */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Recipients
                    </label>
                    <select
                      value={announcementForm.recipients}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, recipients: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 text-base"
                    >
                      <option value="all">All Team Members</option>
                      <option value="starters">Starting Lineup Only</option>
                      <option value="bench">Bench Players Only</option>
                      <option value="captains">Team Captains Only</option>
                      <option value="coaches">Coaching Staff Only</option>
                    </select>
                  </div>

                  {/* Message Content */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Message Content
                    </label>
                    <textarea
                      value={announcementForm.message}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                      placeholder="Enter your announcement message..."
                      rows={6}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 text-base resize-none"
                      required
                    />
                  </div>

                  {/* Schedule Option */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="schedule-announcement"
                      checked={announcementForm.scheduled}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, scheduled: e.target.checked })}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label htmlFor="schedule-announcement" className="text-sm font-medium text-gray-700">
                      Schedule for later
                    </label>
                  </div>

                  {/* Schedule Date/Time */}
                  {announcementForm.scheduled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date
                        </label>
                        <input
                          type="date"
                          value={announcementForm.scheduledDate}
                          onChange={(e) => setAnnouncementForm({ ...announcementForm, scheduledDate: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300"
                          required={announcementForm.scheduled}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Time
                        </label>
                        <input
                          type="time"
                          value={announcementForm.scheduledTime}
                          onChange={(e) => setAnnouncementForm({ ...announcementForm, scheduledTime: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300"
                          required={announcementForm.scheduled}
                        />
                      </div>
                    </div>
                  )}
                </form>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setShowSendAnnouncement(false)}
                    className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendAnnouncement}
                    disabled={!announcementForm.title.trim() || !announcementForm.message.trim()}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {announcementForm.scheduled ? 'Schedule Announcement' : 'Send Announcement'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 