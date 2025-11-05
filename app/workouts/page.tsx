'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useAppState } from '@/contexts/AppStateContext'
import { useToast } from '@/contexts/ToastContext'
import { createWorkout, formatDate, getWorkoutExercises, deleteWorkout as deleteWorkoutFromDB, isCoachOrAssistant, updateWorkout } from '@/lib/utils'
import WorkoutCompletionButton from '@/components/ui/WorkoutCompletionButton'
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
  ArrowLeft,
  X
} from 'lucide-react'
import FirebirdLogo from '@/components/ui/FirebirdLogo'
import MainNavigation from '@/components/navigation/MainNavigation'
import { WorkoutCardSkeleton, DashboardStatsSkeleton } from '@/components/ui/SkeletonLoader'

// Mock workout data removed - now using only real data from database

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

// Component to display workout exercises (full view for modal)
function WorkoutExercises({ workoutId }: { workoutId: string }) {
  const [exercises, setExercises] = useState<Array<{
    id: string
    exercise_name: string
    sets: number
    reps: number
    rest_seconds: number
    notes: string | null
  }>>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadExercises = async () => {
      if (!workoutId) return
      
      setIsLoading(true)
      try {
        const workoutExercises = await getWorkoutExercises(workoutId)
        setExercises(workoutExercises)
      } catch (error) {
        console.error('Error loading workout exercises:', error)
        setExercises([])
      } finally {
        setIsLoading(false)
      }
    }

    loadExercises()
  }, [workoutId])

  if (isLoading) {
    return (
      <div>
        <h4 className="font-semibold text-gray-900 mb-4">Exercises</h4>
        <div className="text-center py-4">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading exercises...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {exercises.length > 0 ? (
        <div className="space-y-4">
          {exercises.map((exercise, index) => (
            <div key={exercise.id} className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Dumbbell className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h5 className="font-bold text-gray-900 text-base mb-1">{exercise.exercise_name}</h5>
                    {exercise.notes && (
                      <p className="text-sm text-gray-600 leading-relaxed">{exercise.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-6 ml-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{exercise.sets}</p>
                    <p className="text-xs text-gray-500 font-medium">Sets</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{exercise.reps}</p>
                    <p className="text-xs text-gray-500 font-medium">Reps</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-blue-600">{exercise.rest_seconds}s</p>
                    <p className="text-xs text-gray-500 font-medium">Rest</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 bg-gray-50 rounded-xl text-center">
          <Dumbbell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No exercises added to this workout</p>
        </div>
      )}
    </div>
  )
}

// Component to display exercise preview for workout cards
function WorkoutExercisePreview({ workoutId }: { workoutId: string }) {
  const [exercises, setExercises] = useState<Array<{
    id: string
    exercise_name: string
    sets: number
    reps: number
    rest_seconds: number
    notes: string | null
  }>>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadExercises = async () => {
      if (!workoutId) return
      
      setIsLoading(true)
      try {
        const workoutExercises = await getWorkoutExercises(workoutId)
        setExercises(workoutExercises)
      } catch (error) {
        console.error('Error loading workout exercises:', error)
        setExercises([])
      } finally {
        setIsLoading(false)
      }
    }

    loadExercises()
  }, [workoutId])

  if (isLoading) {
    return (
      <div className="space-y-1.5 sm:space-y-2">
        <div className="flex items-center justify-between p-1.5 sm:p-2 bg-gray-50 rounded-lg">
          <span className="text-xs sm:text-sm font-medium text-gray-700">Exercises</span>
          <div className="w-4 h-4 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1.5 sm:space-y-2">
      {exercises.length > 0 ? (
        <div className="space-y-1">
          {exercises.slice(0, 3).map((exercise, index) => (
            <div key={index} className="flex items-center justify-between p-1.5 sm:p-2 bg-gray-50 rounded-lg">
              <span className="text-xs sm:text-sm font-medium text-gray-700 capitalize">
                {exercise.exercise_name}
              </span>
              <div className="flex items-center space-x-1">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {exercise.sets}x{exercise.reps}
                </span>
              </div>
            </div>
          ))}
          {exercises.length > 3 && (
            <div className="p-1.5 sm:p-2 bg-gray-50 rounded-lg text-center">
              <span className="text-xs text-gray-500">+{exercises.length - 3} more exercises</span>
            </div>
          )}
        </div>
      ) : (
        <div className="p-1.5 sm:p-2 bg-gray-50 rounded-lg text-center">
          <span className="text-xs sm:text-sm text-gray-500">No exercises added</span>
        </div>
      )}
    </div>
  )
}

export default function WorkoutsPage() {
  const { user, logout } = useAuth()
  const { 
    workouts, 
    teamMembers, 
    teams,
    isLoadingWorkouts, 
    isLoadingTeamMembers, 
    workoutsError,
    teamMembersError,
    refreshWorkouts,
    refreshTeamMembers,
    updateWorkouts,
    removeWorkout
  } = useAppState()
  const { showToast } = useToast()
  const router = useRouter()
  const [filteredWorkouts, setFilteredWorkouts] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [showCreateWorkout, setShowCreateWorkout] = useState(false)
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null)
  const [showWorkoutDetails, setShowWorkoutDetails] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isCreatingWorkout, setIsCreatingWorkout] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [isEditingWorkout, setIsEditingWorkout] = useState(false)
  const [editWorkoutData, setEditWorkoutData] = useState<any>(null)
  const [editWorkoutExercises, setEditWorkoutExercises] = useState<any[]>([])
  const [isLoadingEditExercises, setIsLoadingEditExercises] = useState(false)
  
  // Custom modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [workoutToDelete, setWorkoutToDelete] = useState<any>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const isCoach = user?.role ? isCoachOrAssistant(user.role) : false

  // Create workout form state
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

  // Initialize loaded state
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
    console.log('🚀 handleCreateWorkout function called!')
    
    // Prevent multiple submissions
    if (isCreatingWorkout) {
      console.log('Already creating workout, ignoring duplicate submission')
      return
    }
    
    if (!workoutName.trim()) {
      showToast('Please enter a workout name', 'warning')
      return
    }

    if (!user?.id) {
      showToast('User not authenticated', 'error')
      return
    }
    
    setIsCreatingWorkout(true)
    
    try {
      console.log('Starting workout creation process...')
      console.log('Workout name:', workoutName)
      console.log('Selected members:', selectedMembers)
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
        assigned_to: selectedMembers.length > 0 ? selectedMembers : [],
        exercises: formattedExercises
      })
      
      console.log('Create workout result:', result)
      
      if (result.success) {
        console.log('Workout created successfully, updating local state...')
        
        // Create the new workout object for immediate UI update
        const newWorkout = {
          id: result.workoutId || '', // Ensure id is always a string
          title: workoutName,
          description: workoutDescription,
          date_assigned: new Date().toISOString(),
          assigned_to: selectedMembers.length > 0 ? selectedMembers[0] : null,
          team_id: teams?.[0]?.id || '', // Get team_id from AppState teams
          exercises: exercises.map(exercise => ({
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
        
        // Also update filtered workouts immediately
        const updatedFilteredWorkouts = [...filteredWorkouts, newWorkout]
        setFilteredWorkouts(updatedFilteredWorkouts)
        
        // Refresh from server as backup
        refreshWorkouts()
        
        // Reset form and close modal
        setWorkoutName('')
        setWorkoutType('strength')
        setWorkoutDescription('')
        setExercises([])
        setSelectedMembers([])
        setShowCreateWorkout(false)
        
        showToast('Workout created successfully!', 'success')
        console.log('Workout creation process completed successfully')
      } else {
        console.error('Failed to create workout:', result.error)
        showToast(`Failed to create workout: ${result.error}`, 'error')
      }
    } catch (error) {
      console.error('Error creating workout:', error)
      showToast('An error occurred while creating the workout', 'error')
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
        rest: 60 // Default rest period of 60 seconds
      }
      setExercises([...exercises, newExercise])
      setSelectedExercise('')
      setCustomExerciseName('')
      setExerciseSets('3')
      setExerciseReps('10')
    }
  }

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index))
  }

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }

  const handleDeleteClick = (workout: any) => {
    console.log('🗑️ Delete button clicked for workout:', workout)
    setWorkoutToDelete(workout)
    setShowDeleteModal(true)
  }

  const confirmDeleteWorkout = async () => {
    if (!workoutToDelete) {
      console.log('🚨 No workout selected for deletion')
      return
    }

    console.log('🔥 Confirming deletion for workout:', workoutToDelete)

    try {
      console.log('🗑️ Deleting workout:', workoutToDelete.id)
      const result = await deleteWorkoutFromDB(workoutToDelete.id)
      console.log('🔥 Delete result:', result)
      
      if (result.success) {
        // Remove from local state and cache only if database deletion succeeded
        removeWorkout(workoutToDelete.id)
        console.log('✅ Workout deleted successfully')
        showToast('Workout deleted successfully!', 'success')
      } else {
        console.error('❌ Failed to delete workout:', result.error)
        showToast(`Failed to delete workout: ${result.error}`, 'error')
      }
    } catch (error) {
      console.error('💥 Error deleting workout:', error)
      showToast('An error occurred while deleting the workout', 'error')
    } finally {
      setShowDeleteModal(false)
      setWorkoutToDelete(null)
    }
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
        {isLoadingWorkouts && workouts.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3].map((i) => (
              <WorkoutCardSkeleton key={i} />
            ))}
          </div>
        ) : workoutsError ? (
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">
              <Activity className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Error Loading Workouts</h3>
              <p className="text-sm text-gray-600">{workoutsError}</p>
              <button 
                onClick={refreshWorkouts}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Try Again
              </button>
            </div>
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
                    </div>
                  </div>
                </div>

                {/* Workout Exercise Preview */}
                <div className="mb-3 sm:mb-4">
                  <WorkoutExercisePreview workoutId={workout.id} />
                  {workout.assigned_to && (
                    <div className="mt-1.5 sm:mt-2">
                      <div className="flex items-center justify-between p-1.5 sm:p-2 bg-gray-50 rounded-lg">
                        <span className="text-xs sm:text-sm font-medium text-gray-700">Assigned To</span>
                        <span className="text-xs font-bold text-gray-500 bg-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ml-1.5 sm:ml-2">
                          Individual
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Workout Completion Button */}
                <div className="mb-3">
                  <WorkoutCompletionButton 
                    workoutId={workout.id}
                    size="sm"
                    onCompletionChange={(completed) => {
                      console.log('Workout completion changed:', completed)
                      // Could refresh workout stats here if needed
                    }}
                  />
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
                        onClick={async (e) => {
                          e.stopPropagation()
                          // Open edit modal directly
                          setEditWorkoutData({
                            id: workout.id,
                            title: workout.title,
                            description: workout.description || ''
                          })
                          
                          // Load existing exercises
                          setIsLoadingEditExercises(true)
                          try {
                            const exercises = await getWorkoutExercises(workout.id)
                            setEditWorkoutExercises(exercises)
                          } catch (error) {
                            console.error('Error loading exercises:', error)
                            setEditWorkoutExercises([])
                          }
                          setIsLoadingEditExercises(false)
                          
                          setIsEditingWorkout(true)
                        }}
                        className="p-1 sm:p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteClick(workout)
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
        {!isLoadingWorkouts && filteredWorkouts.length === 0 && (
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-96 animate-fade-in">
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
                          <option value="cardio">Cardio</option>
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
                    <p className="text-gray-600 mb-4">Add exercises to your workout with sets and reps.</p>
                    
                    {/* Add Exercise Form */}
                    <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Exercise</label>
                          
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
                              <span className="text-xs text-gray-600">Library</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name="exerciseType"
                                checked={useCustomExercise}
                                onChange={() => setUseCustomExercise(true)}
                                className="mr-1 text-xs"
                              />
                              <span className="text-xs text-gray-600">Custom</span>
                            </label>
                          </div>

                          {/* Conditional input */}
                          {useCustomExercise ? (
                            <input
                              type="text"
                              value={customExerciseName}
                              onChange={(e) => setCustomExerciseName(e.target.value)}
                              placeholder="Enter exercise name..."
                              className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-sm"
                            />
                          ) : (
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
                          )}
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
                      {exercises.length > 0 ? (
                        exercises.map((exercise, index) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-2xl">
                            <div className="flex items-center space-x-4">
                              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
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
                              <div className="text-center">
                                <p className="text-sm font-semibold text-gray-900">{exercise.rest}s</p>
                                <p className="text-xs text-gray-500">Rest</p>
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
                        ))
                      ) : (
                        <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl text-center">
                          <p className="text-gray-500">No exercises added yet. Add exercises using the form above.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Modal Footer - Inside Form */}
                  <div className="pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setShowCreateWorkout(false)}
                        className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!workoutName.trim() || isCreatingWorkout}
                        className="bg-gradient-to-r from-royal-blue to-dark-blue hover:from-dark-blue hover:to-royal-blue text-white px-6 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isCreatingWorkout ? 'Creating...' : 'Create Workout'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Workout Modal */}
        {isEditingWorkout && editWorkoutData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-96 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col animate-scale-in" style={{ maxHeight: 'calc(100vh - 10rem)' }}>
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <Edit className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Edit Workout</h3>
                    <p className="text-sm text-gray-500">Update workout details</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsEditingWorkout(false)
                    setEditWorkoutData(null)
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                  {/* Left Column - Workout Info */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Workout Title
                      </label>
                      <input
                        type="text"
                        value={editWorkoutData.title}
                        onChange={(e) => setEditWorkoutData({...editWorkoutData, title: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter workout title"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={editWorkoutData.description}
                        onChange={(e) => setEditWorkoutData({...editWorkoutData, description: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={4}
                        placeholder="Enter workout description"
                      />
                    </div>

                  </div>

                  {/* Right Column - Exercises */}
                  <div className="flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900 text-lg">Exercises</h4>
                      <button
                        type="button"
                        onClick={() => {
                          const newExercise = {
                            id: Date.now(), // Temporary ID for new exercises
                            exercise_name: '',
                            sets: 3,
                            reps: 10,
                            rest_seconds: 60,
                            notes: '',
                            isNew: true
                          }
                          setEditWorkoutExercises([...editWorkoutExercises, newExercise])
                        }}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200 flex items-center space-x-2"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Exercise</span>
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4">
                      {isLoadingEditExercises ? (
                        <div className="text-center py-8">
                          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                          <p className="text-sm text-gray-600">Loading exercises...</p>
                        </div>
                      ) : editWorkoutExercises.length > 0 ? (
                        editWorkoutExercises.map((exercise, index) => (
                          <div key={exercise.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <div className="flex items-start justify-between mb-3">
                              <input
                                type="text"
                                value={exercise.exercise_name}
                                onChange={(e) => {
                                  const updated = [...editWorkoutExercises]
                                  updated[index].exercise_name = e.target.value
                                  setEditWorkoutExercises(updated)
                                }}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                                placeholder="Exercise name"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = editWorkoutExercises.filter((_, i) => i !== index)
                                  setEditWorkoutExercises(updated)
                                }}
                                className="ml-2 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-3 mb-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Sets</label>
                                <input
                                  type="number"
                                  value={exercise.sets}
                                  onChange={(e) => {
                                    const updated = [...editWorkoutExercises]
                                    updated[index].sets = parseInt(e.target.value) || 0
                                    setEditWorkoutExercises(updated)
                                  }}
                                  className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-center"
                                  min="1"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Reps</label>
                                <input
                                  type="number"
                                  value={exercise.reps}
                                  onChange={(e) => {
                                    const updated = [...editWorkoutExercises]
                                    updated[index].reps = parseInt(e.target.value) || 0
                                    setEditWorkoutExercises(updated)
                                  }}
                                  className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-center"
                                  min="1"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Rest (s)</label>
                                <input
                                  type="number"
                                  value={exercise.rest_seconds}
                                  onChange={(e) => {
                                    const updated = [...editWorkoutExercises]
                                    updated[index].rest_seconds = parseInt(e.target.value) || 0
                                    setEditWorkoutExercises(updated)
                                  }}
                                  className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-center"
                                  min="0"
                                />
                              </div>
                            </div>
                            
                            <textarea
                              value={exercise.notes || ''}
                              onChange={(e) => {
                                const updated = [...editWorkoutExercises]
                                updated[index].notes = e.target.value
                                setEditWorkoutExercises(updated)
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              rows={2}
                              placeholder="Exercise notes (optional)"
                            />
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Dumbbell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500 font-medium">No exercises added yet</p>
                          <p className="text-sm text-gray-400">Click "Add Exercise" to get started</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="pt-6 mt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingWorkout(false)
                        setEditWorkoutData(null)
                        setEditWorkoutExercises([])
                      }}
                      className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          // Validate required fields
                          if (!editWorkoutData.title.trim()) {
                            showToast('Please enter a workout title', 'warning')
                            return
                          }

                          // Prepare workout data
                          const workoutData = {
                            title: editWorkoutData.title,
                            description: editWorkoutData.description
                          }

                          // Prepare exercises data
                          const exercisesData = editWorkoutExercises.map(exercise => ({
                            exercise_name: exercise.exercise_name,
                            sets: exercise.sets,
                            reps: exercise.reps,
                            rest_seconds: exercise.rest_seconds,
                            notes: exercise.notes || null
                          }))

                          // Update workout using utils function
                          await updateWorkout(editWorkoutData.id, workoutData, exercisesData)

                          // Update local state immediately
                          const updatedWorkout = {
                            ...selectedWorkout,
                            title: workoutData.title,
                            description: workoutData.description,
                            exercises: exercisesData.map(exercise => ({
                              name: exercise.exercise_name,
                              sets: exercise.sets,
                              reps: exercise.reps,
                              rest_seconds: exercise.rest_seconds,
                              notes: exercise.notes || null
                            }))
                          }
                          
                          // Update the workouts array with the new data
                          const updatedWorkouts = workouts.map(workout => 
                            workout.id === editWorkoutData.id ? updatedWorkout : workout
                          )
                          updateWorkouts(updatedWorkouts)

                          // Also update the filtered workouts immediately
                          const updatedFilteredWorkouts = filteredWorkouts.map(workout => 
                            workout.id === editWorkoutData.id ? updatedWorkout : workout
                          )
                          setFilteredWorkouts(updatedFilteredWorkouts)

                          // Also refresh from server as backup
                          console.log('Refreshing workouts after update...')
                          refreshWorkouts()
                          console.log('Workouts refreshed successfully')
                          
                          // Close modal and show success
                          setIsEditingWorkout(false)
                          setEditWorkoutData(null)
                          setEditWorkoutExercises([])
                          showToast('Workout updated successfully!', 'success')
                        } catch (error) {
                          console.error('Error updating workout:', error)
                          showToast('Error updating workout: ' + (error as any).message, 'error')
                        }
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl transition-all duration-300 hover:from-blue-600 hover:to-blue-700 transform hover:scale-105"
                    >
                      Update Workout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Workout Details Modal - Enhanced for Desktop */}
        {showWorkoutDetails && selectedWorkout && (
        <div className="fixed inset-0 z-50 flex justify-center animate-fade-in" style={{ paddingTop: '7rem' }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl lg:max-w-5xl flex flex-col animate-scale-in" style={{ maxHeight: 'calc(100vh + 12rem)', margin: '0 1rem 0.125rem 1rem' }}>
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

              {/* Modal Content - Two Column Layout */}
              <div className="flex-1 p-6 pb-0 min-h-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                  {/* Left Column - Workout Info & Details */}
                  <div className="space-y-6">
                    {/* Workout Info */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 text-lg">Description</h4>
                      <p className="text-gray-600 leading-relaxed">{selectedWorkout.description || 'No description available'}</p>
                    </div>

                    {/* Workout Details */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-4 text-lg">Workout Details</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <span className="text-sm font-medium text-gray-700">Assigned Date</span>
                          <span className="text-sm font-bold text-gray-900 bg-white px-3 py-1.5 rounded-full">
                            {formatDate(selectedWorkout.date_assigned)}
                          </span>
                        </div>
                        {selectedWorkout.assigned_to && (
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <span className="text-sm font-medium text-gray-700">Assigned To</span>
                            <span className="text-sm font-bold text-gray-900 bg-white px-3 py-1.5 rounded-full">
                              Individual athlete
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Exercises (Scrollable) */}
                  <div className="flex flex-col min-h-0">
                    <h4 className="font-semibold text-gray-900 mb-4 text-lg">Exercises</h4>
                    <div className="flex-1 overflow-y-auto">
                      <WorkoutExercises workoutId={selectedWorkout.id} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 mt-4 border-t border-gray-200 bg-gray-50 rounded-b-3xl">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setShowWorkoutDetails(false)}
                    className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                  >
                    Close
                  </button>
                  {isCoach && (
                    <button
                      onClick={async () => {
                        setEditWorkoutData({
                          id: selectedWorkout.id,
                          title: selectedWorkout.title,
                          description: selectedWorkout.description || ''
                        })
                        
                        // Load existing exercises
                        setIsLoadingEditExercises(true)
                        try {
                          const exercises = await getWorkoutExercises(selectedWorkout.id)
                          setEditWorkoutExercises(exercises)
                        } catch (error) {
                          console.error('Error loading exercises:', error)
                          setEditWorkoutExercises([])
                        }
                        setIsLoadingEditExercises(false)
                        
                        setIsEditingWorkout(true)
                        setShowWorkoutDetails(false)
                      }}
                      className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl transition-all duration-300"
                    >
                      Edit Workout
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Custom Delete Confirmation Modal */}
        {showDeleteModal && workoutToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-scale-in">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Delete Workout</h3>
                    <p className="text-sm text-gray-500">This action cannot be undone</p>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <p className="text-gray-600 mb-2">
                  Are you sure you want to delete <span className="font-semibold">"{workoutToDelete.title}"</span>?
                </p>
                <p className="text-sm text-gray-500">
                  This will permanently remove the workout and all its exercises.
                </p>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-200 flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setWorkoutToDelete(null)
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteWorkout}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-2xl transition-all duration-300 transform hover:scale-105"
                >
                  Delete Workout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-scale-in">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Success!</h3>
                    <p className="text-sm text-gray-500">Operation completed</p>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <p className="text-gray-600">{successMessage}</p>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-200 flex items-center justify-end">
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl transition-all duration-300 transform hover:scale-105"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 