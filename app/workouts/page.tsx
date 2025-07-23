'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
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
  },
  {
    id: 2,
    name: 'Cardio Blast',
    type: 'cardio',
    duration: 45,
    difficulty: 'advanced',
    description: 'High-intensity interval training for endurance',
    exercises: [
      { name: 'Burpees', sets: 5, reps: 20, rest: 30 },
      { name: 'Mountain Climbers', sets: 4, reps: 30, rest: 45 },
      { name: 'Jumping Jacks', sets: 3, reps: 50, rest: 30 },
      { name: 'High Knees', sets: 4, reps: 40, rest: 30 }
    ],
    assignedAthletes: 8,
    completionRate: 92,
    lastUsed: '2024-01-14',
    createdAt: '2024-01-08'
  },
  {
    id: 3,
    name: 'Core Crusher',
    type: 'core',
    duration: 30,
    difficulty: 'beginner',
    description: 'Target all core muscles with progressive difficulty',
    exercises: [
      { name: 'Planks', sets: 3, reps: '60s', rest: 30 },
      { name: 'Russian Twists', sets: 3, reps: 20, rest: 45 },
      { name: 'Crunches', sets: 3, reps: 25, rest: 30 },
      { name: 'Leg Raises', sets: 3, reps: 15, rest: 45 }
    ],
    assignedAthletes: 15,
    completionRate: 78,
    lastUsed: '2024-01-12',
    createdAt: '2024-01-05'
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
  const [workouts, setWorkouts] = useState(mockWorkouts)
  const [filteredWorkouts, setFilteredWorkouts] = useState(mockWorkouts)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [showCreateWorkout, setShowCreateWorkout] = useState(false)
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null)
  const [showWorkoutDetails, setShowWorkoutDetails] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Create workout form state
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

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    filterWorkouts()
  }, [searchTerm, selectedType, selectedDifficulty, workouts])

  const filterWorkouts = () => {
    let filtered = workouts

    if (searchTerm) {
      filtered = filtered.filter(workout =>
        workout.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workout.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(workout => workout.type === selectedType)
    }

    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(workout => workout.difficulty === selectedDifficulty)
    }

    setFilteredWorkouts(filtered)
  }

  const handleCreateWorkout = (e: React.FormEvent) => {
    e.preventDefault()
    if (workoutName.trim() && exercises.length > 0) {
      const newWorkout = {
        id: Date.now(),
        name: workoutName,
        type: workoutType,
        duration: parseInt(workoutDuration),
        difficulty: workoutDifficulty,
        description: workoutDescription,
        exercises: exercises,
        assignedAthletes: 0,
        completionRate: 0,
        lastUsed: null,
        createdAt: new Date().toISOString().split('T')[0]
      }

      setWorkouts([newWorkout, ...workouts])
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'strength': return <Dumbbell className="h-4 w-4" />
      case 'cardio': return <Zap className="h-4 w-4" />
      case 'core': return <Target className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'strength': return 'bg-blue-100 text-blue-800'
      case 'cardio': return 'bg-red-100 text-red-800'
      case 'core': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="glass-effect border-b border-white/20 shadow-sm sticky top-0 z-50 backdrop-blur-md">
        <div className="container-responsive">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4 sm:space-x-6">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 text-gray-400 hover:text-gray-600 transition-all duration-200 hover:scale-110 focus-ring"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className={`transition-all duration-500 ${isLoaded ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
                <FirebirdLogo className="h-10 w-10 sm:h-12 sm:w-12" />
              </div>
              <div className={`transition-all duration-500 delay-100 ${isLoaded ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}`}>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold gradient-text font-elegant">Workouts</h1>
                <p className="text-xs sm:text-sm text-gray-600 font-medium hidden sm:block">Manage your training programs</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => setShowCreateWorkout(true)}
                className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-royal-blue to-dark-blue text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 focus-ring"
              >
                <Plus className="h-4 w-4" />
                <span className="text-xs sm:text-sm font-semibold hidden sm:block">Create Workout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container-responsive py-6 sm:py-8">
        {/* Search and Filters */}
        <div className={`mb-6 sm:mb-8 transition-all duration-500 delay-200 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search workouts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
              >
                <option value="all">All Types</option>
                <option value="strength">Strength</option>
                <option value="cardio">Cardio</option>
                <option value="core">Core</option>
              </select>

              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
        </div>

        {/* Workouts Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 transition-all duration-500 delay-300 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          {filteredWorkouts.map((workout, index) => (
            <div 
              key={workout.id} 
              className="card-elevated hover-lift cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => {
                setSelectedWorkout(workout)
                setShowWorkoutDetails(true)
              }}
            >
              {/* Workout Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`h-10 w-10 ${getTypeColor(workout.type)} rounded-xl flex items-center justify-center`}>
                    {getTypeIcon(workout.type)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mobile-text">{workout.name}</h3>
                    <p className="text-sm text-gray-500">{workout.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(workout.difficulty)}`}>
                    {workout.difficulty}
                  </span>
                </div>
              </div>

              {/* Workout Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{workout.duration} min</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{workout.assignedAthletes} athletes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{workout.exercises.length} exercises</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{workout.completionRate}% completion</span>
                </div>
              </div>

              {/* Exercise Preview */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Exercises:</h4>
                <div className="space-y-1">
                  {workout.exercises.slice(0, 3).map((exercise, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs text-gray-600">
                      <span>{exercise.name}</span>
                      <span>{exercise.sets}×{exercise.reps}</span>
                    </div>
                  ))}
                  {workout.exercises.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{workout.exercises.length - 3} more exercises
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      // Edit workout logic
                    }}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteWorkout(workout.id)
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedWorkout(workout)
                    setShowWorkoutDetails(true)
                  }}
                  className="flex items-center space-x-1 text-royal-blue hover:text-dark-blue text-sm font-semibold transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  <span>View Details</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredWorkouts.length === 0 && (
          <div className={`text-center py-12 transition-all duration-500 delay-400 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <Dumbbell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No workouts found</h3>
            <p className="text-gray-500 mb-6">Create your first workout to get started</p>
            <button
              onClick={() => setShowCreateWorkout(true)}
              className="bg-gradient-to-r from-royal-blue to-dark-blue text-white px-6 py-3 rounded-2xl hover:shadow-lg transition-all duration-300"
            >
              Create Workout
            </button>
          </div>
        )}

        {/* Create Workout Modal */}
        {showCreateWorkout && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
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
                              <Trash2 className="h-4 w-4" />
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

        {/* Workout Details Modal */}
        {showWorkoutDetails && selectedWorkout && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className={`h-10 w-10 ${getTypeColor(selectedWorkout.type)} rounded-full flex items-center justify-center`}>
                    {getTypeIcon(selectedWorkout.type)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{selectedWorkout.name}</h3>
                    <p className="text-sm text-gray-500">{selectedWorkout.type} • {selectedWorkout.difficulty}</p>
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
                    <p className="text-gray-600">{selectedWorkout.description}</p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-700">Duration</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{selectedWorkout.duration} minutes</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-700">Assigned</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{selectedWorkout.assignedAthletes} athletes</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Target className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-700">Exercises</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{selectedWorkout.exercises.length}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Star className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-700">Completion</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{selectedWorkout.completionRate}%</p>
                    </div>
                  </div>

                  {/* Exercises */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">Exercises</h4>
                    <div className="space-y-3">
                      {selectedWorkout.exercises.map((exercise, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 bg-gradient-to-br from-royal-blue to-dark-blue rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">{index + 1}</span>
                            </div>
                            <div>
                              <h5 className="font-semibold text-gray-900">{exercise.name}</h5>
                              <p className="text-sm text-gray-500">{exercise.sets} sets × {exercise.reps} reps</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Rest: {exercise.rest}s</p>
                          </div>
                        </div>
                      ))}
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
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 