'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Calendar, Plus, Edit, Trash2, Clock, MapPin, Users, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react'
import MainNavigation from '@/components/navigation/MainNavigation'

// Mock calendar events
const mockEvents = [
  {
    id: 1,
    title: 'Team Practice',
    date: '2024-12-15',
    time: '15:00',
    duration: '90',
    location: 'Main Gym',
    type: 'practice',
    attendees: ['Jake Rodriguez', 'Marcus Johnson', 'Tyler Williams'],
    description: 'Focus on strength training and team coordination'
  },
  {
    id: 2,
    title: 'Championship Game',
    date: '2024-12-20',
    time: '14:00',
    duration: '120',
    location: 'Stadium',
    type: 'game',
    attendees: ['All Team Members'],
    description: 'Final championship match against rival team'
  },
  {
    id: 3,
    title: 'Team Meeting',
    date: '2024-12-18',
    time: '10:00',
    duration: '60',
    location: 'Conference Room',
    type: 'meeting',
    attendees: ['Coaches', 'Team Captains'],
    description: 'Strategy discussion and upcoming schedule review'
  },
  {
    id: 4,
    title: 'Morning Training',
    date: '2024-12-22',
    time: '07:00',
    duration: '60',
    location: 'Training Center',
    type: 'training',
    attendees: ['All Athletes'],
    description: 'Early morning conditioning session'
  },
  {
    id: 5,
    title: 'Recovery Session',
    date: '2024-12-25',
    time: '16:00',
    duration: '45',
    location: 'Recovery Room',
    type: 'training',
    attendees: ['Selected Athletes'],
    description: 'Active recovery and stretching'
  }
]

const eventTypes = [
  { id: 'practice', label: 'Practice', color: 'bg-blue-500' },
  { id: 'game', label: 'Game', color: 'bg-red-500' },
  { id: 'meeting', label: 'Meeting', color: 'bg-green-500' },
  { id: 'training', label: 'Training', color: 'bg-purple-500' }
]

export default function CalendarPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showCreateEvent, setShowCreateEvent] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showEventDetails, setShowEventDetails] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  
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

  const isCoach = user?.role === 'coach'

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Calendar navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Get calendar data
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const getEventsForDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateString = `${year}-${month}-${day}`
    return mockEvents.filter(event => event.date === dateString)
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSelectedDate = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString()
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    const events = getEventsForDate(date)
    if (events.length > 0) {
      setSelectedEvent(events[0])
      setShowEventDetails(true)
    } else {
      // If no events on this date, open create event modal with date pre-filled
      setEventForm({
        ...eventForm,
        date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      })
      setShowCreateEvent(true)
    }
  }

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault()
    if (eventForm.title && eventForm.date && eventForm.time) {
      // Here you would typically save the event to your backend
      console.log('Creating event:', eventForm)
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
    }
  }

  const handleEditEvent = (event: any) => {
    setEditingEvent(event)
    setEventForm({
      title: event.title,
      date: event.date,
      time: event.time,
      duration: event.duration,
      location: event.location,
      type: event.type,
      description: event.description,
      attendees: event.attendees.join(', ')
    })
    setShowCreateEvent(true)
  }

  const handleDeleteEvent = (eventId: number) => {
    // Here you would typically delete the event from your backend
    console.log('Deleting event:', eventId)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getEventTypeColor = (type: string) => {
    return eventTypes.find(t => t.id === type)?.color || 'bg-gray-500'
  }

  const getEventTypeLabel = (type: string) => {
    return eventTypes.find(t => t.id === type)?.label || 'Event'
  }

  // Get upcoming events (next 7 days)
  const getUpcomingEvents = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset time to start of day
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    return mockEvents.filter(event => {
      const eventDate = new Date(event.date)
      eventDate.setHours(0, 0, 0, 0) // Reset time to start of day
      return eventDate >= today && eventDate <= nextWeek
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  const calendarDays = getDaysInMonth(currentDate)
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <MainNavigation />
      
      <div className={`container-responsive py-6 transition-all duration-500 delay-200 ${
        isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4 sm:gap-0">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </button>
            <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Calendar</h1>
              <p className="text-sm sm:text-base text-gray-600">Manage your team schedule and events</p>
            </div>
          </div>
          {isCoach && (
            <button
              onClick={() => {
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
                setShowCreateEvent(true)
              }}
              className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-2xl transition-colors text-sm sm:text-base"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Create Event</span>
            </button>
          )}
        </div>

        {/* Calendar Navigation */}
        <div className="bg-white rounded-3xl shadow-2xl p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4 sm:gap-0">
            <div className="flex items-center justify-center sm:justify-start space-x-2 sm:space-x-4">
              <button
                onClick={goToPreviousMonth}
                className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button
                onClick={goToNextMonth}
                className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
            <button
              onClick={goToToday}
              className="px-3 sm:px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors text-sm sm:text-base"
            >
              Today
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
            {/* Day Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="p-2 sm:p-3 text-center">
                <span className="text-xs sm:text-sm font-semibold text-gray-600">{day}</span>
              </div>
            ))}

            {/* Calendar Days */}
            {calendarDays.map((date, index) => {
              const events = date ? getEventsForDate(date) : []
              const isCurrentMonth = date && date.getMonth() === currentDate.getMonth()
              
              return (
                <div
                  key={index}
                  className={`min-h-[80px] sm:min-h-[120px] p-1 sm:p-2 border border-gray-100 transition-all duration-200 ${
                    date ? 'cursor-pointer hover:bg-gray-50' : ''
                  } ${
                    date && isToday(date) ? 'bg-blue-50 border-blue-200' : ''
                  } ${
                    date && isSelectedDate(date) ? 'bg-blue-100 border-blue-300' : ''
                  } ${
                    !isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
                  }`}
                  onClick={() => date && handleDateClick(date)}
                >
                  {date && (
                    <>
                      <div className="text-right mb-1">
                        <span className={`text-xs sm:text-sm font-medium ${
                          isToday(date) ? 'bg-blue-500 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full' : ''
                        }`}>
                          {date.getDate()}
                        </span>
                      </div>
                      
                      {/* Events */}
                      <div className="space-y-1">
                        {events.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            className={`text-xs p-1 rounded truncate ${getEventTypeColor(event.type)} text-white font-medium`}
                            title={`${event.title} - ${formatTime(event.time)}`}
                          >
                            {event.title}
                          </div>
                        ))}
                        {events.length > 2 && (
                          <div className="text-xs text-gray-500 font-medium">
                            +{events.length - 2} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-3xl shadow-2xl p-4 sm:p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-900">Upcoming Events</h3>
          </div>
          
          <div className="space-y-3 sm:space-y-4">
                         {getUpcomingEvents().length > 0 ? (
               getUpcomingEvents().map((event) => (
                 <div 
                   key={event.id} 
                   className="group relative bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-2xl p-3 sm:p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-blue-200 cursor-pointer"
                   onClick={() => {
                     setSelectedEvent(event)
                     setShowEventDetails(true)
                   }}
                 >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                        <div className={`h-2 w-2 sm:h-3 sm:w-3 rounded-full ${getEventTypeColor(event.type)} shadow-md`}></div>
                        <h4 className="font-semibold text-gray-900 text-sm sm:text-base">{event.title}</h4>
                        <span className="text-xs bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-semibold">
                          {getEventTypeLabel(event.type)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                        <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                          <span>{formatDate(event.date)}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                          <span>{formatTime(event.time)}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500" />
                          <span>{event.location}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                          <Users className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" />
                          <span>{Array.isArray(event.attendees) ? event.attendees.length : 'All'} people</span>
                        </div>
                      </div>
                      
                      {event.description && (
                        <p className="text-xs sm:text-sm text-gray-600 mt-2 sm:mt-3 overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{event.description}</p>
                      )}
                    </div>
                    
                    {isCoach && (
                      <div className="flex items-center space-x-1 ml-2 sm:ml-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditEvent(event)
                          }}
                          className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                        >
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteEvent(event.id)
                          }}
                          className="p-1.5 sm:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"></div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 sm:py-8">
                <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-3 sm:mb-4" />
                <h4 className="text-base sm:text-lg font-semibold text-gray-600 mb-2">No upcoming events</h4>
                <p className="text-sm sm:text-base text-gray-500 mb-3 sm:mb-4">No events scheduled for the next 7 days</p>
                {isCoach && (
                  <button
                    onClick={() => setShowCreateEvent(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-xl transition-colors text-sm sm:text-base"
                  >
                    Create First Event
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Event Modal */}
      {showCreateEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingEvent ? 'Edit Event' : 'Create New Event'}
              </h3>
            </div>

            <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Title
                </label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateEvent(false)
                    setEditingEvent(null)
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
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-2xl transition-colors"
                >
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {showEventDetails && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{selectedEvent.title}</h3>
                <button
                  onClick={() => setShowEventDetails(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-2xl">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(selectedEvent.date)}</p>
                  <p className="text-xs text-gray-500">Date</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-2xl">
                <Clock className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{formatTime(selectedEvent.time)}</p>
                  <p className="text-xs text-gray-500">{selectedEvent.duration} min</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-2xl">
                <MapPin className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{selectedEvent.location}</p>
                  <p className="text-xs text-gray-500">Location</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-2xl">
                <div className={`h-5 w-5 rounded-full ${getEventTypeColor(selectedEvent.type)}`}></div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{getEventTypeLabel(selectedEvent.type)}</p>
                  <p className="text-xs text-gray-500">Event Type</p>
                </div>
              </div>
              
              {selectedEvent.description && (
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedEvent.description}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowEventDetails(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Close
                </button>
                {isCoach && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        handleEditEvent(selectedEvent)
                        setShowEventDetails(false)
                      }}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        handleDeleteEvent(selectedEvent.id)
                        setShowEventDetails(false)
                      }}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 