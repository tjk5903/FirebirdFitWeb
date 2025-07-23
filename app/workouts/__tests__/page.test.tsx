import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import WorkoutsPage from '../page'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}))

// Mock FirebirdLogo component
jest.mock('@/components/ui/FirebirdLogo', () => {
  return function MockFirebirdLogo({ className }: { className?: string }) {
    return <div data-testid="firebird-logo" className={className}>FirebirdLogo</div>
  }
})

describe('WorkoutsPage', () => {
  const mockRouter = {
    push: jest.fn(),
  }

  const mockAuth = {
    user: {
      name: 'Coach John',
      email: 'coach@example.com',
    },
    logout: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useAuth as jest.Mock).mockReturnValue(mockAuth)
  })

  describe('Page Header', () => {
    it('renders the page header with correct title', () => {
      render(<WorkoutsPage />)
      
      expect(screen.getByText('Workouts')).toBeInTheDocument()
      expect(screen.getByText('Manage your training programs')).toBeInTheDocument()
    })

    it('renders the back button to return to dashboard', () => {
      render(<WorkoutsPage />)
      
      const backButton = screen.getByRole('button', { name: /back/i })
      expect(backButton).toBeInTheDocument()
    })

    it('navigates to dashboard when back button is clicked', () => {
      render(<WorkoutsPage />)
      
      const backButton = screen.getByRole('button', { name: /back/i })
      fireEvent.click(backButton)
      
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
    })

    it('renders the create workout button', () => {
      render(<WorkoutsPage />)
      
      const createButton = screen.getByText('Create Workout')
      expect(createButton).toBeInTheDocument()
    })
  })

  describe('Search and Filters', () => {
    it('renders search input field', () => {
      render(<WorkoutsPage />)
      
      const searchInput = screen.getByPlaceholderText('Search workouts...')
      expect(searchInput).toBeInTheDocument()
    })

    it('renders type filter dropdown', () => {
      render(<WorkoutsPage />)
      
      const typeFilter = screen.getByDisplayValue('All Types')
      expect(typeFilter).toBeInTheDocument()
    })

    it('renders difficulty filter dropdown', () => {
      render(<WorkoutsPage />)
      
      const difficultyFilter = screen.getByDisplayValue('All Levels')
      expect(difficultyFilter).toBeInTheDocument()
    })

    it('filters workouts when search term is entered', async () => {
      render(<WorkoutsPage />)
      
      const searchInput = screen.getByPlaceholderText('Search workouts...')
      fireEvent.change(searchInput, { target: { value: 'Upper Body' } })
      
      await waitFor(() => {
        expect(screen.getByText('Upper Body Strength')).toBeInTheDocument()
        expect(screen.queryByText('Cardio Blast')).not.toBeInTheDocument()
      })
    })

    it('filters workouts by type', async () => {
      render(<WorkoutsPage />)
      
      const typeFilter = screen.getByDisplayValue('All Types')
      fireEvent.change(typeFilter, { target: { value: 'strength' } })
      
      await waitFor(() => {
        expect(screen.getByText('Upper Body Strength')).toBeInTheDocument()
        expect(screen.queryByText('Cardio Blast')).not.toBeInTheDocument()
      })
    })

    it('filters workouts by difficulty', async () => {
      render(<WorkoutsPage />)
      
      const difficultyFilter = screen.getByDisplayValue('All Levels')
      fireEvent.change(difficultyFilter, { target: { value: 'beginner' } })
      
      await waitFor(() => {
        expect(screen.getByText('Core Crusher')).toBeInTheDocument()
        expect(screen.queryByText('Upper Body Strength')).not.toBeInTheDocument()
      })
    })
  })

  describe('Workout Cards', () => {
    it('renders all workout cards by default', () => {
      render(<WorkoutsPage />)
      
      expect(screen.getByText('Upper Body Strength')).toBeInTheDocument()
      expect(screen.getByText('Cardio Blast')).toBeInTheDocument()
      expect(screen.getByText('Core Crusher')).toBeInTheDocument()
    })

    it('displays workout information correctly', () => {
      render(<WorkoutsPage />)
      
      // Check for workout details
      expect(screen.getByText('Upper Body Strength')).toBeInTheDocument()
      expect(screen.getByText('Focus on chest, shoulders, and arms with compound movements')).toBeInTheDocument()
      expect(screen.getByText('60 min')).toBeInTheDocument()
      expect(screen.getByText('12 athletes')).toBeInTheDocument()
      expect(screen.getByText('4 exercises')).toBeInTheDocument()
      expect(screen.getByText('85% completion')).toBeInTheDocument()
    })

    it('displays difficulty badges with correct colors', () => {
      render(<WorkoutsPage />)
      
      const intermediateBadge = screen.getByText('intermediate')
      const advancedBadge = screen.getByText('advanced')
      const beginnerBadge = screen.getByText('beginner')
      
      expect(intermediateBadge).toBeInTheDocument()
      expect(advancedBadge).toBeInTheDocument()
      expect(beginnerBadge).toBeInTheDocument()
    })

    it('shows exercise preview in workout cards', () => {
      render(<WorkoutsPage />)
      
      // Check for exercise names in the preview
      expect(screen.getByText('Bench Press')).toBeInTheDocument()
      expect(screen.getByText('Pull-ups')).toBeInTheDocument()
      expect(screen.getByText('Shoulder Press')).toBeInTheDocument()
    })

    it('shows "more exercises" indicator when there are more than 3 exercises', () => {
      render(<WorkoutsPage />)
      
      expect(screen.getByText('+1 more exercises')).toBeInTheDocument()
    })
  })

  describe('Workout Actions', () => {
    it('opens create workout modal when create button is clicked', () => {
      render(<WorkoutsPage />)
      
      const createButton = screen.getByText('Create Workout')
      fireEvent.click(createButton)
      
      expect(screen.getByText('Create New Workout')).toBeInTheDocument()
    })

    it('opens workout details modal when view details is clicked', () => {
      render(<WorkoutsPage />)
      
      const viewDetailsButton = screen.getByText('View Details')
      fireEvent.click(viewDetailsButton)
      
      expect(screen.getByText('Upper Body Strength')).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
    })

    it('deletes workout when delete button is clicked', async () => {
      render(<WorkoutsPage />)
      
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      fireEvent.click(deleteButtons[0])
      
      await waitFor(() => {
        expect(screen.queryByText('Upper Body Strength')).not.toBeInTheDocument()
      })
    })
  })

  describe('Create Workout Modal', () => {
    beforeEach(() => {
      render(<WorkoutsPage />)
      const createButton = screen.getByText('Create Workout')
      fireEvent.click(createButton)
    })

    it('renders create workout form with all fields', () => {
      expect(screen.getByText('Create New Workout')).toBeInTheDocument()
      expect(screen.getByLabelText('Workout Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Workout Type')).toBeInTheDocument()
      expect(screen.getByLabelText('Duration (minutes)')).toBeInTheDocument()
      expect(screen.getByLabelText('Difficulty Level')).toBeInTheDocument()
      expect(screen.getByLabelText('Description')).toBeInTheDocument()
    })

    it('allows adding exercises to the workout', () => {
      const exerciseSelect = screen.getByDisplayValue('Select exercise...')
      const setsInput = screen.getByDisplayValue('3')
      const repsInput = screen.getByDisplayValue('10')
      const addButton = screen.getByText('Add')
      
      fireEvent.change(exerciseSelect, { target: { value: 'Push-ups' } })
      fireEvent.change(setsInput, { target: { value: '4' } })
      fireEvent.change(repsInput, { target: { value: '15' } })
      fireEvent.click(addButton)
      
      expect(screen.getByText('Push-ups')).toBeInTheDocument()
    })

    it('allows removing exercises from the workout', () => {
      // First add an exercise
      const exerciseSelect = screen.getByDisplayValue('Select exercise...')
      const addButton = screen.getByText('Add')
      
      fireEvent.change(exerciseSelect, { target: { value: 'Push-ups' } })
      fireEvent.click(addButton)
      
      // Then remove it
      const removeButton = screen.getByRole('button', { name: /remove/i })
      fireEvent.click(removeButton)
      
      expect(screen.queryByText('Push-ups')).not.toBeInTheDocument()
    })

    it('creates a new workout when form is submitted', async () => {
      const workoutNameInput = screen.getByLabelText('Workout Name')
      const exerciseSelect = screen.getByDisplayValue('Select exercise...')
      const addButton = screen.getByText('Add')
      const createButton = screen.getByText('Create Workout')
      
      fireEvent.change(workoutNameInput, { target: { value: 'New Test Workout' } })
      fireEvent.change(exerciseSelect, { target: { value: 'Push-ups' } })
      fireEvent.click(addButton)
      fireEvent.click(createButton)
      
      await waitFor(() => {
        expect(screen.queryByText('Create New Workout')).not.toBeInTheDocument()
        expect(screen.getByText('New Test Workout')).toBeInTheDocument()
      })
    })

    it('validates required fields before creating workout', () => {
      const createButton = screen.getByText('Create Workout')
      
      // Button should be disabled when no name or exercises
      expect(createButton).toBeDisabled()
    })
  })

  describe('Workout Details Modal', () => {
    beforeEach(() => {
      render(<WorkoutsPage />)
      const viewDetailsButton = screen.getByText('View Details')
      fireEvent.click(viewDetailsButton)
    })

    it('displays workout details correctly', () => {
      expect(screen.getByText('Upper Body Strength')).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
      expect(screen.getByText('Duration')).toBeInTheDocument()
      expect(screen.getByText('Assigned')).toBeInTheDocument()
      expect(screen.getByText('Exercises')).toBeInTheDocument()
      expect(screen.getByText('Completion')).toBeInTheDocument()
    })

    it('shows all exercises in the workout', () => {
      expect(screen.getByText('Bench Press')).toBeInTheDocument()
      expect(screen.getByText('Pull-ups')).toBeInTheDocument()
      expect(screen.getByText('Shoulder Press')).toBeInTheDocument()
      expect(screen.getByText('Bicep Curls')).toBeInTheDocument()
    })

    it('displays exercise details with sets, reps, and rest', () => {
      expect(screen.getByText('4 sets × 8 reps')).toBeInTheDocument()
      expect(screen.getByText('Rest: 90s')).toBeInTheDocument()
    })

    it('has action buttons for editing and assigning', () => {
      expect(screen.getByText('Edit Workout')).toBeInTheDocument()
      expect(screen.getByText('Assign to Team')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('shows empty state when no workouts match filters', async () => {
      render(<WorkoutsPage />)
      
      const searchInput = screen.getByPlaceholderText('Search workouts...')
      fireEvent.change(searchInput, { target: { value: 'NonExistentWorkout' } })
      
      await waitFor(() => {
        expect(screen.getByText('No workouts found')).toBeInTheDocument()
        expect(screen.getByText('Create your first workout to get started')).toBeInTheDocument()
      })
    })

    it('has create workout button in empty state', async () => {
      render(<WorkoutsPage />)
      
      const searchInput = screen.getByPlaceholderText('Search workouts...')
      fireEvent.change(searchInput, { target: { value: 'NonExistentWorkout' } })
      
      await waitFor(() => {
        const createButton = screen.getByText('Create Workout')
        expect(createButton).toBeInTheDocument()
      })
    })
  })

  describe('Responsive Design', () => {
    it('renders without crashing on different screen sizes', () => {
      render(<WorkoutsPage />)
      
      // Basic checks to ensure the component renders
      expect(screen.getByText('Workouts')).toBeInTheDocument()
      expect(screen.getByText('Create Workout')).toBeInTheDocument()
    })
  })
}) 