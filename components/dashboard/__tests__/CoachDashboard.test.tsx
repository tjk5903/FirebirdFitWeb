import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

// Mock the AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      name: 'Coach Johnson',
      email: 'coach@example.com',
      role: 'coach'
    },
    logout: jest.fn(),
  }),
}))

// Mock the MainNavigation component
jest.mock('@/components/navigation/MainNavigation', () => {
  return function MockMainNavigation() {
    return <div data-testid="main-navigation">Main Navigation</div>
  }
})

// Mock the FirebirdLogo component
jest.mock('@/components/ui/FirebirdLogo', () => {
  return function MockFirebirdLogo() {
    return <div data-testid="firebird-logo">Firebird Logo</div>
  }
})

// Import after mocks
const CoachDashboard = require('../CoachDashboard').default

describe('CoachDashboard Calendar Integration', () => {
  it('should render the Add Event button in quick actions', async () => {
    render(<CoachDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Add Event')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should open event creation modal when Add Event button is clicked', async () => {
    render(<CoachDashboard />)
    
    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('Add Event')).toBeInTheDocument()
    }, { timeout: 3000 })
    
    const addEventButton = screen.getByText('Add Event')
    fireEvent.click(addEventButton)

    // Check if modal opens
    await waitFor(() => {
      expect(screen.getByText('Create New Event')).toBeInTheDocument()
    })
    
    // Check for form fields
    expect(screen.getByDisplayValue('')).toBeInTheDocument() // Event title input
  })

  it('should show event type options in the modal', async () => {
    render(<CoachDashboard />)
    
    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('Add Event')).toBeInTheDocument()
    }, { timeout: 3000 })
    
    const addEventButton = screen.getByText('Add Event')
    fireEvent.click(addEventButton)

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText('Create New Event')).toBeInTheDocument()
    })

    // Check if event type options are present
    expect(screen.getByText('Practice')).toBeInTheDocument()
    expect(screen.getByText('Game')).toBeInTheDocument()
    expect(screen.getByText('Meeting')).toBeInTheDocument()
    expect(screen.getByText('Training')).toBeInTheDocument()
  })
}) 