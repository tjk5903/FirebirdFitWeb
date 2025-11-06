'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useAppState } from '@/contexts/AppStateContext'
import { TeamStats, createWorkout, createEvent, createChat, getTeamMembers, getPersonalizedWelcome, getTeamEvents, formatTime } from '@/lib/utils'
import { useTeamMessages } from '@/lib/hooks/useTeamMessages'
import NotificationCenter from '@/components/ui/NotificationCenter'
import PushNotificationSetup from '@/components/ui/PushNotificationSetup'
import TeamPerformanceCard from '@/components/ui/TeamPerformanceCard'
import { 
  Users, 
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
  Zap,
  Menu,
  ChevronDown,
  MapPin
} from 'lucide-react'
import FirebirdLogo from '@/components/ui/FirebirdLogo'
import { SmartLoadingMessage, EmptyState } from '@/components/ui/LoadingStates'
import { MemoizedMessageItem, MemoizedQuickAction } from '@/components/ui/MemoizedComponents'
import MemberSelector from '@/components/ui/MemberSelector'

const mockTeamStats: TeamStats = {
  totalAthletes: 24,
  activeAthletes: 18,
  completedWorkouts: 156,
  upcomingEvents: 3
}

// Real recent activity will come from actual data - no mock data

// Removed mockTeamMessages - now using actual data from getTeamMessages

const quickActions = [
  { id: 1, title: 'Create Workout', icon: Plus, color: 'bg-royal-blue', description: 'Design new training' },
  { id: 2, title: 'Create Event', icon: Calendar, color: 'bg-green-500', description: 'Create calendar event' },
  { id: 3, title: 'Create Chat', icon: MessageSquare, color: 'bg-purple-500', description: 'Start team conversation' },
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

const CoachDashboard = React.memo(function CoachDashboard() {
  const { user, logout } = useAuth()
  const { teams, workouts, updateWorkouts, refreshWorkouts, chats, updateChats, refreshChats } = useAppState()
  const router = useRouter()
  
  // Get the first team (coaches typically manage one team at a time)
  const selectedTeam = teams?.[0]
  
  // Refs for modal click-outside detection
  const createWorkoutModalRef = useRef<HTMLDivElement>(null)
  const createEventModalRef = useRef<HTMLDivElement>(null)
  const createChatModalRef = useRef<HTMLDivElement>(null)
  
  const [activeTab, setActiveTab] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [showCreateWorkout, setShowCreateWorkout] = useState(false)
  const [showCreateEvent, setShowCreateEvent] = useState(false)
  const [showCreateChat, setShowCreateChat] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [isSuccessMessageFading, setIsSuccessMessageFading] = useState(false)
  const [workoutName, setWorkoutName] = useState('')
  const [workoutType, setWorkoutType] = useState('strength')

  const [workoutDescription, setWorkoutDescription] = useState('')
  const [exercises, setExercises] = useState<any[]>([])
  const [selectedExercise, setSelectedExercise] = useState('')
  const [customExerciseName, setCustomExerciseName] = useState('')
  const [useCustomExercise, setUseCustomExercise] = useState(false)
  const [exerciseSets, setExerciseSets] = useState('3')
  const [exerciseReps, setExerciseReps] = useState('10')
  const [exerciseRest, setExerciseRest] = useState('60')
  const [isCreatingWorkout, setIsCreatingWorkout] = useState(false)
  const [isCreatingEvent, setIsCreatingEvent] = useState(false)
  
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

  // Create Chat modal state
  const [newChatName, setNewChatName] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [isCreatingChat, setIsCreatingChat] = useState(false)

  // Events state
  const [events, setEvents] = useState<Array<{
    id: string
    title: string
    description: string | null
    event_type: string
    start_time: string
    end_time: string
    location: string | null
    created_at: string
  }>>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(false)

  // Use custom hook for team messages
  const { teamMessages, isLoadingMessages } = useTeamMessages(user?.id)

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

  // Messages are now loaded via the useTeamMessages hook

  // Load events when user loads
  useEffect(() => {
    const loadEvents = async () => {
      if (!user) return
      
      setIsLoadingEvents(true)
      try {
        const teamEvents = await getTeamEvents(user.id)
        setEvents(teamEvents)
      } catch (error) {
        console.error('Error loading events:', error)
      } finally {
        setIsLoadingEvents(false)
      }
    }

    loadEvents()
  }, [user])

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
      
      // Close Create Chat modal
      if (showCreateChat && createChatModalRef.current && !createChatModalRef.current.contains(target)) {
        setShowCreateChat(false)
      }
    }

    // Add event listener if any modal is open
    if (showCreateWorkout || showCreateEvent || showCreateChat) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCreateWorkout, showCreateEvent, showCreateChat])

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }

  const showSuccessWithFadeOut = () => {
    setShowSuccessMessage(true)
    setIsSuccessMessageFading(false)
    
    // Start fade out after 2.5 seconds
    setTimeout(() => {
      setIsSuccessMessageFading(true)
    }, 2500)
    
    // Hide completely after fade out animation (3 seconds total)
    setTimeout(() => {
      setShowSuccessMessage(false)
      setIsSuccessMessageFading(false)
    }, 3000)
  }

  const handleCreateWorkout = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🚀 handleCreateWorkout function called!')
    console.log('Form event:', e)
    console.log('Workout name:', workoutName)
    console.log('User:', user)
    console.log('Is creating workout:', isCreatingWorkout)
    console.log('Exercises:', exercises)
    
    // Prevent multiple submissions
    if (isCreatingWorkout) {
      console.log('Already creating workout, ignoring duplicate submission')
      return
    }
    
    if (!workoutName.trim()) {
      console.log('❌ Workout name is empty')
      alert('Please enter a workout name')
      return
    }
    
    if (!user?.id) {
      console.log('❌ User not authenticated')
      alert('User not authenticated')
      return
    }
    
    setIsCreatingWorkout(true)
    
    try {
      console.log('Starting workout creation process...')
      console.log('Workout name:', workoutName)
      console.log('Exercises:', exercises)
      
      // Format exercises for database
      const formattedExercises = exercises.map(exercise => ({
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        rest_seconds: exercise.rest,
        notes: `${exercise.category} - ${exercise.muscle}`
      }))

      console.log('Formatted exercises:', formattedExercises)

      const result = await createWorkout(user.id, {
        title: workoutName,
        description: workoutDescription,
        exercises: formattedExercises
      })
      
      console.log('Create workout result:', result)
      
      if (result.success) {
        console.log('Workout created successfully, updating local state...')
        
        // Create the new workout object for immediate UI update
        const newWorkout = {
          id: result.workoutId || '',
          title: workoutName,
          description: workoutDescription,
          date_assigned: new Date().toISOString(),
          assigned_to: null,
          team_id: teams?.[0]?.id || '',
          exercises: formattedExercises.map(exercise => ({
            name: exercise.name,
            sets: exercise.sets,
            reps: exercise.reps,
            rest_seconds: exercise.rest_seconds,
            notes: exercise.notes || null
          })),
          created_at: new Date().toISOString()
        }
        
        // Update local state immediately
        const updatedWorkouts = [...workouts, newWorkout]
        updateWorkouts(updatedWorkouts)
        
        // Refresh from server as backup
        refreshWorkouts()
        
        // Reset form and close modal
        setWorkoutName('')
        setWorkoutType('strength')
        setWorkoutDescription('')
        setExercises([])
        setShowCreateWorkout(false)
        
        // Show success message with fade out
        showSuccessWithFadeOut()
        
        console.log('Workout creation process completed successfully')
      } else {
        console.error('Failed to create workout:', result.error)
        alert(`Failed to create workout: ${result.error}`)
      }
    } catch (error) {
      console.error('Error creating workout:', error)
      alert('An error occurred while creating the workout')
    } finally {
      console.log('Setting isCreatingWorkout to false')
      setIsCreatingWorkout(false)
    }
  }

  const addExercise = () => {
    const exerciseName = useCustomExercise ? customExerciseName.trim() : selectedExercise
    
    if (exerciseName && exerciseSets && exerciseReps) {
      const exercise = exerciseLibrary.find(ex => ex.name === exerciseName)
      const newExercise = {
        name: exerciseName,
        category: exercise?.category || 'custom',
        muscle: exercise?.muscle || 'Custom Exercise',
        sets: parseInt(exerciseSets),
        reps: parseInt(exerciseReps),
        rest: parseInt(exerciseRest)
      }
      setExercises([...exercises, newExercise])
      setSelectedExercise('')
      setCustomExerciseName('')
      setExerciseSets('3')
      setExerciseReps('10')
      setExerciseRest('60')
    }
  }

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index))
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !eventForm.title || !eventForm.date || !eventForm.time) return

    setIsCreatingEvent(true)
    
    try {
      // Create start and end times
      const startDateTime = `${eventForm.date}T${eventForm.time}:00`
      const startTime = new Date(startDateTime)
      const endTime = new Date(startTime.getTime() + parseInt(eventForm.duration) * 60 * 1000)

      const result = await createEvent(user.id, {
        title: eventForm.title,
        description: eventForm.description || '',
        event_type: eventForm.type,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        location: eventForm.location || ''
      })
      
      if (result.success) {
        console.log('Event created successfully')
        
        // Refresh events list
        if (user) {
          try {
            const teamEvents = await getTeamEvents(user.id)
            setEvents(teamEvents)
          } catch (error) {
            console.error('Error refreshing events:', error)
          }
        }
        
        // Reset form and close modal
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
        setShowCreateEvent(false)
        showSuccessWithFadeOut()
      } else {
        console.error('Failed to create event:', result.error)
        alert(`Failed to create event: ${result.error}`)
      }
    } catch (error) {
      console.error('Error creating event:', error)
      alert('An error occurred while creating the event')
    } finally {
      setIsCreatingEvent(false)
    }
  }


  // Toggle member selection for chat
  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }

  // Handle create chat
  const handleCreateChat = async () => {
    if (!newChatName.trim() || !user?.id) return

    setIsCreatingChat(true)
    try {
      const result = await createChat(user.id, newChatName.trim(), selectedMembers)
      
      if (result.success) {
        console.log('Chat created successfully, updating local state...')
        
        // Create the new chat object for immediate UI update
        const newChat = {
          id: result.chatId || '',
          name: newChatName.trim(),
          lastMessage: null,
          lastMessageTime: null,
          unread: false,
          memberCount: selectedMembers.length + 1 // +1 for the creator
        }
        
        // Update local state immediately
        const updatedChats = [...chats, newChat]
        updateChats(updatedChats)
        
        // Refresh from server as backup
        refreshChats()
        
        // Close modal and reset form
        setShowCreateChat(false)
        setNewChatName('')
        setSelectedMembers([])
        showSuccessWithFadeOut()
        
        console.log('Chat creation process completed successfully')
      } else {
        console.error('Failed to create group chat:', result.error)
      }
    } catch (error) {
      console.error('Error creating group chat:', error)
    } finally {
      setIsCreatingChat(false)
    }
  }

  // Helper functions for events
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const getEventTypeColor = (type: string) => {
    return eventTypes.find(t => t.id === type)?.color || 'bg-gray-500'
  }

  const getEventTypeLabel = (type: string) => {
    return eventTypes.find(t => t.id === type)?.label || 'Event'
  }

  // Get upcoming events (next 2 events)
  const getUpcomingEvents = () => {
    const now = new Date()
    return events
      .filter(event => {
        const eventDate = new Date(event.start_time)
        return eventDate >= now
      })
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(0, 2) // Get next 2 events
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <PushNotificationSetup />
      {/* Header */}
      <header className="glass-effect border-b border-white/20 dark:border-slate-700/20 shadow-sm sticky top-0 z-50 backdrop-blur-md">
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
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-slate-700/50 active:bg-white/70 dark:active:bg-slate-700/70'
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

      {/* Success Message */}
      {showSuccessMessage && (
        <div className={`fixed top-4 right-4 z-50 bg-green-500 dark:bg-green-600 text-white px-6 py-3 rounded-2xl shadow-lg transform transition-all duration-500 ${
          isSuccessMessageFading 
            ? 'opacity-0 translate-x-4 scale-95' 
            : 'opacity-100 translate-x-0 scale-100 animate-in slide-in-from-right'
        }`}>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span className="font-semibold">Action completed successfully!</span>
          </div>
        </div>
      )}

      <div className="container-responsive py-4 sm:py-6 md:py-8">
        {/* Welcome Section */}
        <div className={`mb-4 sm:mb-6 md:mb-8 transition-all duration-500 delay-200 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 px-1">{getPersonalizedWelcome(user)}</h2>
        </div>

        {/* Communication & Quick Actions */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-4 sm:mb-6 md:mb-8 transition-all duration-500 delay-400 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          {/* Team Communication */}
          <div className="md:col-span-2 lg:col-span-2 card-elevated mobile-card hover-lift cursor-pointer transition-all duration-300 hover:scale-[1.01] md:hover:scale-[1.02] hover:shadow-2xl touch-manipulation active:scale-[0.99]" onClick={() => router.push('/messages')}>
            <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6">
              <h3 className="mobile-heading font-bold text-gray-900 dark:text-gray-100">Team Communication</h3>
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              {isLoadingMessages ? (
                <SmartLoadingMessage 
                  type="messages" 
                  isInitial={teamMessages.length === 0}
                  hasData={teamMessages.length > 0}
                />
              ) : teamMessages.length > 0 ? (
                teamMessages.slice(0, 3).map((message, index) => (
                  <div 
                    key={message.id} 
                    className={`message-bubble transition-all duration-200 hover:scale-[1.02] ${message.unread ? 'ring-2 ring-royal-blue/20 dark:ring-blue-500/30' : ''}`}
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
                  actionText="Start Conversation"
                  onAction={() => router.push('/messages')}
                />
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card-elevated mobile-card hover-lift">
            <h3 className="mobile-heading font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4 md:mb-6">Quick Actions</h3>
            <div className="space-y-2 sm:space-y-3">
              {quickActions.map((action, index) => (
                <button 
                  key={action.id} 
                  className="w-full flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-600 active:bg-gray-200 dark:active:bg-slate-500 transition-all duration-200 group focus-ring touch-manipulation"
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => {
                    if (action.title === 'Create Workout') {
                      setShowCreateWorkout(true)
                    } else if (action.title === 'Create Event') {
                      setShowCreateEvent(true)
                    } else if (action.title === 'Create Chat') {
                      setShowCreateChat(true)
                    }
                  }}
                >
                                     <div className={`h-8 w-8 sm:h-10 sm:w-10 ${action.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                     <action.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                   </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mobile-text">{action.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 hidden sm:block">{action.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Events & Team Performance */}
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 transition-all duration-500 delay-500 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          {/* Upcoming Events */}
          <div className="card-elevated hover-lift">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">Upcoming Events</h3>
              <button 
                onClick={() => router.push('/calendar')}
                className="text-royal-blue dark:text-blue-400 hover:text-dark-blue dark:hover:text-blue-300 text-sm font-semibold transition-colors duration-200 focus-ring"
              >
                View Calendar
              </button>
            </div>
            
            <div className="space-y-3">
              {isLoadingEvents ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
                  <span className="text-gray-600 dark:text-gray-300">Loading events...</span>
                </div>
              ) : getUpcomingEvents().length > 0 ? (
                getUpcomingEvents().map((event) => (
                  <div 
                    key={event.id} 
                    className="group relative bg-gradient-to-r from-gray-50 to-white dark:from-slate-700 dark:to-slate-800 border border-gray-200 dark:border-slate-600 rounded-2xl p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-blue-200 dark:hover:border-blue-500 cursor-pointer"
                    onClick={() => router.push('/calendar')}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className={`h-2 w-2 rounded-full ${getEventTypeColor(event.event_type)} shadow-md`}></div>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base">{event.title}</h4>
                          <span className="text-xs bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 px-2 py-0.5 rounded-full font-semibold">
                            {getEventTypeLabel(event.event_type)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                            <span>{formatDate(event.start_time)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                            <span>{formatTime(event.start_time)}</span>
                          </div>
                          {event.location && (
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500" />
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>
                        
                        {event.description && (
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-2 overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"></div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-300 text-sm font-semibold">No upcoming events</p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">Team events will appear here when scheduled</p>
                </div>
              )}
            </div>
          </div>

          {/* Team Performance */}
          <TeamPerformanceCard teamId={selectedTeam?.id || ''} />
        </div>

        {/* Create Workout Modal */}
        {showCreateWorkout && (
          <div className="fixed inset-0 z-50 flex justify-center p-4 pt-24 animate-fade-in">
            <div ref={createWorkoutModalRef} className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col animate-scale-in" style={{ maxHeight: 'calc(100vh - 10rem)' }}>
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-royal-blue to-dark-blue rounded-full flex items-center justify-center">
                    <Dumbbell className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">Create New Workout</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-300">Design a training session for your team</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateWorkout(false)}
                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                        Workout Name
                      </label>
                      <input
                        type="text"
                        value={workoutName}
                        onChange={(e) => setWorkoutName(e.target.value)}
                        placeholder="Enter workout name..."
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-base bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                        Workout Type
                      </label>
                      <select
                        value={workoutType}
                        onChange={(e) => setWorkoutType(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-base bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="strength">Strength</option>
                        <option value="cardio">Cardio</option>
                        <option value="mobility">Mobility</option>
                      </select>
                    </div>


                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      Description
                    </label>
                    <textarea
                      value={workoutDescription}
                      onChange={(e) => setWorkoutDescription(e.target.value)}
                      placeholder="Describe the workout goals and focus areas..."
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-base bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 resize-none"
                    />
                  </div>

                  {/* Exercises Section */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Exercises</h4>
                    
                    {/* Add Exercise Form */}
                    <div className="bg-gray-50 dark:bg-slate-700/50 dark:text-gray-100 rounded-2xl p-4 mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Exercise</label>
                          
                          {/* Toggle between library and custom */}
                          <div className="flex items-center space-x-3 mb-2">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name="exerciseType"
                                checked={!useCustomExercise}
                                onChange={() => setUseCustomExercise(false)}
                                className="mr-1 text-xs"
                              />
                              <span className="text-xs text-gray-600 dark:text-gray-300">Library</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name="exerciseType"
                                checked={useCustomExercise}
                                onChange={() => setUseCustomExercise(true)}
                                className="mr-1 text-xs"
                              />
                              <span className="text-xs text-gray-600 dark:text-gray-300">Custom</span>
                            </label>
                          </div>

                          {/* Conditional input */}
                          {useCustomExercise ? (
                            <input
                              type="text"
                              value={customExerciseName}
                              onChange={(e) => setCustomExerciseName(e.target.value)}
                              placeholder="Enter exercise name..."
                              className="w-full px-3 py-2 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                            />
                          ) : (
                            <select
                              value={selectedExercise}
                              onChange={(e) => setSelectedExercise(e.target.value)}
                              className="w-full px-3 py-2 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                            >
                              <option value="">Select exercise...</option>
                              {exerciseLibrary.map((exercise) => (
                                <option key={exercise.name} value={exercise.name}>
                                  {exercise.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Sets</label>
                          <input
                            type="number"
                            value={exerciseSets}
                            onChange={(e) => setExerciseSets(e.target.value)}
                            min="1"
                            max="10"
                            className="w-full px-3 py-2 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Reps</label>
                          <input
                            type="number"
                            value={exerciseReps}
                            onChange={(e) => setExerciseReps(e.target.value)}
                            min="1"
                            max="50"
                            className="w-full px-3 py-2 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={addExercise}
                            disabled={(!useCustomExercise && !selectedExercise) || (useCustomExercise && !customExerciseName.trim())}
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
                        <div key={index} className="flex items-center justify-between p-4 bg-white dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 rounded-2xl">
                          <div className="flex items-center space-x-4">
                            <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                              <Dumbbell className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h5 className="font-semibold text-gray-900 dark:text-gray-100">{exercise.name}</h5>
                              <p className="text-sm text-gray-500 dark:text-gray-300">{exercise.muscle}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{exercise.sets}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-300">Sets</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{exercise.reps}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-300">Reps</p>
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
                    className="px-6 py-3 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!workoutName.trim() || isCreatingWorkout}
                    onClick={() => {
                      console.log('🖱️ Direct onClick handler called!')
                      const fakeEvent = { preventDefault: () => {} } as React.FormEvent
                      handleCreateWorkout(fakeEvent)
                    }}
                    className="bg-gradient-to-r from-royal-blue to-dark-blue hover:from-dark-blue hover:to-royal-blue text-white px-6 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingWorkout ? 'Creating...' : 'Create Workout'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Event Modal */}
        {showCreateEvent && (
          <div className="fixed inset-0 z-50 flex justify-center p-4 pt-24 animate-fade-in">
            <div ref={createEventModalRef} className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md flex flex-col animate-scale-in" style={{ maxHeight: 'calc(100vh - 10rem)' }}>
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">Create New Event</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-300">Schedule team activities and meetings</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateEvent(false)}
                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <form onSubmit={handleCreateEvent} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Event Title
                    </label>
                    <input
                      type="text"
                      value={eventForm.title}
                      onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Date
                      </label>
                      <input
                        type="date"
                        value={eventForm.date}
                        onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Time
                      </label>
                      <input
                        type="time"
                        value={eventForm.time}
                        onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Duration (min)
                      </label>
                      <select
                        value={eventForm.duration}
                        onChange={(e) => setEventForm({ ...eventForm, duration: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="90">1.5 hours</option>
                        <option value="120">2 hours</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Type
                      </label>
                      <select
                        value={eventForm.type}
                        onChange={(e) => setEventForm({ ...eventForm, type: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                      >
                        {eventTypes.map((type) => (
                          <option key={type.id} value={type.id}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={eventForm.location}
                      onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Description
                    </label>
                    <textarea
                      value={eventForm.description}
                      onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 resize-none bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
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
                    className="px-6 py-3 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!eventForm.title.trim() || !eventForm.date || !eventForm.time || isCreatingEvent}
                    onClick={() => {
                      console.log('🖱️ Event creation button clicked!')
                      const fakeEvent = { preventDefault: () => {} } as React.FormEvent
                      handleCreateEvent(fakeEvent)
                    }}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingEvent ? 'Creating...' : 'Create Event'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Chat Modal */}
        {showCreateChat && (
          <div className="fixed inset-0 z-50 flex justify-center p-4 pt-24 animate-fade-in">
            <div ref={createChatModalRef} className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md flex flex-col animate-scale-in" style={{ maxHeight: 'calc(100vh - 10rem)' }}>
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">Create Chat</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-300">Start a team conversation</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateChat(false)}
                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={newChatName}
                    onChange={(e) => setNewChatName(e.target.value)}
                    placeholder="Enter group name..."
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div className="mb-6">
                  <MemberSelector
                    selectedMembers={selectedMembers}
                    onMemberToggle={toggleMemberSelection}
                    onMembersChange={setSelectedMembers}
                    userId={user?.id || ''}
                    title="Select Members (Optional)"
                    description="You can add members now or later. Group chats can be created without initial members."
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-200">
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => setShowCreateChat(false)}
                    className="px-6 py-3 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateChat}
                    disabled={!newChatName.trim() || isCreatingChat}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingChat ? (
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      'Create Chat'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

export default CoachDashboard 