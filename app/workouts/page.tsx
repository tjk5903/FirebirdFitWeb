'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getUserWorkouts, createWorkout, formatDate } from '@/lib/utils'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar,
  Clock,
  Users,
  Target,
  Dumbbell,
  Zap,
  Heart,
  Activity,
  Star,
  MoreVertical,
  ArrowLeft
} from 'lucide-react'
import FirebirdLogo from '@/components/ui/FirebirdLogo'
import MainNavigation from '@/components/navigation/MainNavigation'

// Mock workout data
const mockWorkouts = [
  {
    id: 1,
    name: 'Upper Body Strength',
    type: 'strength',
    duration: 60,
    difficulty: 'intermediate',
    description: 'Focus on chest, shoulders, and arms with compound movements',
    exercises: [
      { name: 'Bench Press', sets: 4, reps: 8, rest: 90 },
      { name: 'Pull-ups', sets: 3, reps: 10, rest: 60 },
      { name: 'Shoulder Press', sets: 3, reps: 12, rest: 60 },
      { name: 'Bicep Curls', sets: 3, reps: 15, rest: 45 }
    ],
    assignedAthletes: 12,
    completionRate: 85,
    lastUsed: '2024-01-15',
    createdAt: '2024-01-10'
  }
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

export default function WorkoutsPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [workouts, setWorkouts] = useState<any[]>([])
  const [filteredWorkouts, setFilteredWorkouts] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [showCreateWorkout, setShowCreateWorkout] = useState(false)
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null)
  const [showWorkoutDetails, setShowWorkoutDetails] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingWorkout, setIsCreatingWorkout] = useState(false)

  const isCoach = user?.role === 'coach'

  // Create workout form state
  const [workoutName, setWorkoutName] = useState('')
  const [workoutType, setWorkoutType] = useState('strength')
  const [workoutDescription, setWorkoutDescription] = useState('')
  const [exercises, setExercises] = useState<any[]>([])
  const [selectedExercise, setSelectedExercise] = useState('')
  const [exerciseSets, setExerciseSets] = useState('3')
  const [exerciseReps, setExerciseReps] = useState('10')
  const [exerciseRest, setExerciseRest] = useState('60')

  // Fetch workouts from Supabase
  useEffect(() => {
    const fetchWorkouts = async () => {
      if (!user?.id) return
      
      try {
        setIsLoading(true)
        console.log('Fetching workouts for user:', user.id)
        const fetchedWorkouts = await getUserWorkouts(user.id)
        setWorkouts(fetchedWorkouts)
      } catch (error) {
        console.error('Error fetching workouts:', error)
        // Fallback to mock data if there's an error
        setWorkouts(mockWorkouts)
      } finally {
        setIsLoading(false)
      }
    }

    fetchWorkouts()
  }, [user?.id])

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    filterWorkouts()
  }, [searchTerm, selectedType, workouts])

  const filterWorkouts = () => {
    let filtered = workouts

    if (searchTerm) {
      filtered = filtered.filter(workout =>
        workout.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (workout.description && workout.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Note: We'll need to add a type field to the workouts table or handle this differently
    // For now, we'll skip type filtering since the database schema doesn't include it
    // if (selectedType !== 'all') {
    //   filtered = filtered.filter(workout => workout.type === selectedType)
    // }

    setFilteredWorkouts(filtered)
  }

  const handleCreateWorkout = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!workoutName.trim()) {
      alert('Please enter a workout name')
      return
    }
    
    if (!user?.id) {
      alert('User not authenticated')
      return
    }
    
    setIsCreatingWorkout(true)
    
    try {
      const result = await createWorkout(user.id, {
        title: workoutName,
        description: workoutDescription,
        assigned_to: [] // Empty array for now
      })
      
      if (result.success) {
        // Refresh the workout list
        const fetchedWorkouts = await getUserWorkouts(user.id)
        setWorkouts(fetchedWorkouts)
        
        // Reset form and close modal
        setWorkoutName('')
        setWorkoutType('strength')
        setWorkoutDescription('')
        setExercises([])
        setShowCreateWorkout(false)
        
        alert('Workout created successfully!')
      } else {
        console.error('Failed to create workout:', result.error)
        alert(`Failed to create workout: ${result.error}`)
      }
    } catch (error) {
      console.error('Error creating workout:', error)
      alert('An error occurred while creating the workout')
    } finally {
      setIsCreatingWorkout(false)
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

  const deleteWorkout = (workoutId: number) => {
    setWorkouts(workouts.filter(workout => workout.id !== workoutId))
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = () => {
    // For now, use a default icon since we don't have type in the database
    return <Dumbbell className="h-4 w-4" />
  }

  const getTypeColor = () => {
    // For now, use a default color since we don't have type in the database
    return 'bg-blue-100 text-blue-800'
  }

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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Workouts</h1>
              <p className="text-sm sm:text-base text-gray-600">Manage your training programs</p>
            </div>
          </div>

          {isCoach && (
            <button
              onClick={() => setShowCreateWorkout(true)}
              className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-2xl transition-colors text-sm sm:text-base"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Create Workout</span>
            </button>
          )}
        </div>
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
            <input
              type="text"
              placeholder="Search workouts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 bg-white/80 backdrop-blur-sm border-2 border-blue-200/50 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 placeholder-blue-400/70 shadow-lg text-sm sm:text-base"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 sm:px-4 py-2.5 sm:py-3 bg-white/80 backdrop-blur-sm border-2 border-blue-200/50 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-gray-700 shadow-lg text-sm sm:text-base"
            >
              <option value="all">All Types</option>
              <option value="strength">Strength</option>
              <option value="running">Running</option>
              <option value="mobility">Mobility</option>
            </select>
          </div>
        </div>

        {/* Workouts Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-pulse">
                <div className="h-1 bg-gray-200"></div>
                <div className="p-4 sm:p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="h-10 w-10 bg-gray-200 rounded-xl"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredWorkouts.map((workout: any, index: number) => (
            <div 
              key={workout.id} 
              className="group relative bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden hover:shadow-3xl transition-all duration-300 hover:scale-[1.02] cursor-pointer active:scale-[0.98]"
              onClick={() => {
                setSelectedWorkout(workout)
                setShowWorkoutDetails(true)
              }}
            >
              {/* Header with type indicator */}
              <div className={`h-1 ${getTypeColor().replace('bg-', 'bg-gradient-to-r from-').replace(' text-', ' to-')}`}></div>
              
              <div className="p-4 sm:p-6">
                {/* Workout Header */}
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className={`h-8 w-8 sm:h-10 sm:w-10 ${getTypeColor()} rounded-xl flex items-center justify-center shadow-sm`}>
                      {getTypeIcon()}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-base sm:text-lg mb-1">{workout.title}</h3>
                      <p className="text-xs sm:text-sm text-gray-600" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {workout.description || 'No description available'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Workout Info */}
                <div className="mb-3 sm:mb-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex items-center justify-between p-1.5 sm:p-2 bg-gray-50 rounded-lg">
                      <span className="text-xs sm:text-sm font-medium text-gray-700">Assigned Date</span>
                      <span className="text-xs font-bold text-gray-500 bg-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ml-1.5 sm:ml-2">
                        {formatDate(workout.date_assigned)}
                      </span>
                    </div>
                    {workout.assigned_to && workout.assigned_to.length > 0 && (
                      <div className="flex items-center justify-between p-1.5 sm:p-2 bg-gray-50 rounded-lg">
                        <span className="text-xs sm:text-sm font-medium text-gray-700">Assigned To</span>
                        <span className="text-xs font-bold text-gray-500 bg-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ml-1.5 sm:ml-2">
                          {workout.assigned_to.length} athlete{workout.assigned_to.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                 

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>Created: {formatDate(workout.created_at)}</span>
                  </div>
                  
                  {isCoach && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          // Edit workout logic
                        }}
                        className="p-1 sm:p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteWorkout(workout.id)
                        }}
                        className="p-1 sm:p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-3xl"></div>
            </div>
          ))}
        </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredWorkouts.length === 0 && (
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-12 border border-gray-100 text-center">
            <Dumbbell className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">No workouts found</h3>
            <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">
              {isCoach ? 'Create your first workout to get started' : 'No workouts have been assigned yet'}
            </p>
            {isCoach && (
              <button
                onClick={() => setShowCreateWorkout(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-2xl transition-colors text-sm sm:text-base"
              >
                Create Workout
              </button>
            )}
          </div>
        )}

        {/* Create Workout Modal */}
        {showCreateWorkout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-24 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col animate-scale-in" style={{ maxHeight: 'calc(100vh - 10rem)' }}>
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-royal-blue to-dark-blue rounded-full flex items-center justify-center">
                    <Plus className="h-5 w-5 text-white" />
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
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 p-6 overflow-y-auto">
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
                          <option value="strength">Strength</option>
                          <option value="running">Running</option>
                          <option value="mobility">Mobility</option>
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
                    <p className="text-gray-600 mb-4">Exercise functionality will be added in a future update. For now, you can create workouts with basic information.</p>
                    
                    {/* Add Exercise Form */}
                    <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Exercise</label>
                          <select
                            value={selectedExercise}
                            onChange={(e) => setSelectedExercise(e.target.value)}
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-sm"
                            disabled
                          >
                            <option value="">Coming soon...</option>
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
                            disabled
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
                            disabled
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={addExercise}
                            disabled={true}
                            className="w-full bg-gray-400 text-white px-4 py-2 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Coming Soon
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Exercise List */}
                    <div className="space-y-3">
                      <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl text-center">
                        <p className="text-gray-500">Exercise management will be available soon</p>
                      </div>
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
                    disabled={!workoutName.trim() || isCreatingWorkout}
                    className="bg-gradient-to-r from-royal-blue to-dark-blue hover:from-dark-blue hover:to-royal-blue text-white px-6 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingWorkout ? 'Creating...' : 'Create Workout'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Workout Details Modal */}
        {showWorkoutDetails && selectedWorkout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-scale-in">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className={`h-10 w-10 ${getTypeColor()} rounded-full flex items-center justify-center`}>
                    {getTypeIcon()}
                  </div>
                                     <div>
                     <h3 className="font-bold text-gray-900">{selectedWorkout.title}</h3>
                     <p className="text-sm text-gray-500">Workout</p>
                   </div>
                </div>
                <button
                  onClick={() => setShowWorkoutDetails(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Workout Info */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                    <p className="text-gray-600">{selectedWorkout.description || 'No description available'}</p>
                  </div>

                  

                  {/* Workout Details */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">Workout Details</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <span className="text-sm font-medium text-gray-700">Assigned Date</span>
                        <span className="text-xs font-bold text-gray-500 bg-white px-2 py-1 rounded-full">
                          {formatDate(selectedWorkout.date_assigned)}
                        </span>
                      </div>
                      {selectedWorkout.assigned_to && selectedWorkout.assigned_to.length > 0 && (
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <span className="text-sm font-medium text-gray-700">Assigned To</span>
                          <span className="text-xs font-bold text-gray-500 bg-white px-2 py-1 rounded-full">
                            {selectedWorkout.assigned_to.length} athlete{selectedWorkout.assigned_to.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <span className="text-sm font-medium text-gray-700">Created</span>
                        <span className="text-xs font-bold text-gray-500 bg-white px-2 py-1 rounded-full">
                          {formatDate(selectedWorkout.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-200">
                                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setShowWorkoutDetails(false)}
                      className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                    >
                      Close
                    </button>
                    {isCoach && (
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => {
                            // Edit workout logic
                            setShowWorkoutDetails(false)
                          }}
                          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl transition-all duration-300"
                        >
                          Edit Workout
                        </button>
                        <button
                          onClick={() => {
                            // Assign workout logic
                            setShowWorkoutDetails(false)
                          }}
                          className="px-6 py-3 bg-gradient-to-r from-royal-blue to-dark-blue text-white rounded-2xl transition-all duration-300"
                        >
                          Assign to Team
                        </button>
                      </div>
                    )}
                  </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 