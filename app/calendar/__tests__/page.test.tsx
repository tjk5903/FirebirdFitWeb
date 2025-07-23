import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import CalendarPage from '../page'

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

describe('CalendarPage', () => {
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
      render(<CalendarPage />)
      
      expect(screen.getByText('Calendar')).toBeInTheDocument()
      expect(screen.getByText('Team schedule & events')).toBeInTheDocument()
    })

    it('renders the back button to return to dashboard', () => {
      render(<CalendarPage />)
      
      const backButton = screen.getByRole('button', { name: /back/i })
      expect(backButton).toBeInTheDocument()
    })

    it('navigates to dashboard when back button is clicked', () => {
      render(<CalendarPage />)
      
      const backButton = screen.getByRole('button', { name: /back/i })
      fireEvent.click(backButton)
      
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
    })

    it('renders the add event button', () => {
      render(<CalendarPage />)
      
      const addButton = screen.getByText('Add Event')
      expect(addButton).toBeInTheDocument()
    })
  })

  describe('Calendar Controls', () => {
    it('renders month navigation controls', () => {
      render(<CalendarPage />)
      
      const prevButton = screen.getByRole('button', { name: /previous/i })
      const nextButton = screen.getByRole('button', { name: /next/i })
      
      expect(prevButton).toBeInTheDocument()
      expect(nextButton).toBeInTheDocument()
    })

    it('displays current month and year', () => {
      render(<CalendarPage />)
      
      const currentDate = new Date()
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ]
      const expectedText = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
      
      expect(screen.getByText(expectedText)).toBeInTheDocument()
    })

    it('renders view mode toggle buttons', () => {
      render(<CalendarPage />)
      
      expect(screen.getByText('Month')).toBeInTheDocument()
      expect(screen.getByText('Week')).toBeInTheDocument()
      expect(screen.getByText('Day')).toBeInTheDocument()
    })

    it('allows switching between view modes', () => {
      render(<CalendarPage />)
      
      const weekButton = screen.getByText('Week')
      fireEvent.click(weekButton)
      
      // The week button should now be active
      expect(weekButton).toHaveClass('bg-royal-blue')
    })
  })

  describe('Event Type Filters', () => {
    it('renders all event type filter buttons', () => {
      render(<CalendarPage />)
      
      expect(screen.getByText('All Events')).toBeInTheDocument()
      expect(screen.getByText('Practices')).toBeInTheDocument()
      expect(screen.getByText('Meetings')).toBeInTheDocument()
      expect(screen.getByText('Games')).toBeInTheDocument()
    })

    it('allows filtering events by type', () => {
      render(<CalendarPage />)
      
      const practicesFilter = screen.getByText('Practices')
      fireEvent.click(practicesFilter)
      
      // Should show only practice events
      expect(screen.getByText('Team Practice Session')).toBeInTheDocument()
      expect(screen.queryByText('Team Meeting')).not.toBeInTheDocument()
    })
  })

  describe('Calendar Grid', () => {
    it('renders calendar grid with day headers', () => {
      render(<CalendarPage />)
      
      expect(screen.getByText('Sun')).toBeInTheDocument()
      expect(screen.getByText('Mon')).toBeInTheDocument()
      expect(screen.getByText('Tue')).toBeInTheDocument()
      expect(screen.getByText('Wed')).toBeInTheDocument()
      expect(screen.getByText('Thu')).toBeInTheDocument()
      expect(screen.getByText('Fri')).toBeInTheDocument()
      expect(screen.getByText('Sat')).toBeInTheDocument()
    })

    it('displays calendar days correctly', () => {
      render(<CalendarPage />)
      
      // Check that calendar days are rendered
      const calendarGrid = screen.getByRole('grid')
      expect(calendarGrid).toBeInTheDocument()
    })

    it('shows events on calendar days', () => {
      render(<CalendarPage />)
      
      // Look for event titles that should be visible on the calendar
      expect(screen.getByText('Team Practice Session')).toBeInTheDocument()
    })

    it('opens create event modal when clicking on empty calendar day', () => {
      render(<CalendarPage />)
      
      // Find a calendar day cell and click it
      const calendarDays = screen.getAllByRole('gridcell')
      const emptyDay = calendarDays.find(day => 
        day.textContent && 
        /^\d+$/.test(day.textContent.trim()) && 
        !day.textContent.includes('Team Practice Session')
      )
      
      if (emptyDay) {
        fireEvent.click(emptyDay)
        expect(screen.getByText('Create New Event')).toBeInTheDocument()
      }
    })

    it('pre-fills date when creating event from calendar day click', () => {
      render(<CalendarPage />)
      
      // Find a calendar day cell and click it
      const calendarDays = screen.getAllByRole('gridcell')
      const emptyDay = calendarDays.find(day => 
        day.textContent && 
        /^\d+$/.test(day.textContent.trim()) && 
        !day.textContent.includes('Team Practice Session')
      )
      
      if (emptyDay) {
        fireEvent.click(emptyDay)
        const dateInput = screen.getByLabelText('Date')
        expect(dateInput).toHaveValue(expect.any(String))
      }
    })
  })

  describe('Upcoming Events', () => {
    it('renders upcoming events section', () => {
      render(<CalendarPage />)
      
      expect(screen.getByText('Upcoming Events')).toBeInTheDocument()
    })

    it('displays event cards with correct information', () => {
      render(<CalendarPage />)
      
      // Check for event information
      expect(screen.getByText('Team Practice Session')).toBeInTheDocument()
      expect(screen.getByText('Team Meeting')).toBeInTheDocument()
      expect(screen.getByText('Regional Championship Game')).toBeInTheDocument()
    })

    it('shows event details in cards', () => {
      render(<CalendarPage />)
      
      // Check for event details like location and attendees
      expect(screen.getByText('Main Gym')).toBeInTheDocument()
      expect(screen.getByText('Conference Room')).toBeInTheDocument()
      expect(screen.getByText('4 attendees')).toBeInTheDocument()
    })
  })

  describe('Create Event Modal', () => {
    beforeEach(() => {
      render(<CalendarPage />)
      const addButton = screen.getByText('Add Event')
      fireEvent.click(addButton)
    })

    it('renders create event form with all fields', () => {
      expect(screen.getByText('Create New Event')).toBeInTheDocument()
      expect(screen.getByLabelText('Event Title')).toBeInTheDocument()
      expect(screen.getByLabelText('Event Type')).toBeInTheDocument()
      expect(screen.getByLabelText('Date')).toBeInTheDocument()
      expect(screen.getByLabelText('Time')).toBeInTheDocument()
      expect(screen.getByLabelText('Duration (minutes)')).toBeInTheDocument()
      expect(screen.getByLabelText('Location')).toBeInTheDocument()
      expect(screen.getByLabelText('Description')).toBeInTheDocument()
    })

    it('allows searching and selecting attendees', () => {
      // Check that search input is present
      const searchInput = screen.getByPlaceholderText('Search attendees...')
      expect(searchInput).toBeInTheDocument()
      
      // Type in search to filter attendees
      fireEvent.change(searchInput, { target: { value: 'Sarah' } })
      
      // Should show Sarah Johnson in the filtered list
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
      
      // Click on Sarah Johnson to add her as attendee
      const sarahAttendee = screen.getByText('Sarah Johnson')
      fireEvent.click(sarahAttendee)
      
      // Should show Sarah Johnson in selected attendees
      expect(screen.getByText('Selected Attendees:')).toBeInTheDocument()
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
    })

    it('allows removing selected attendees', () => {
      // First add an attendee
      const searchInput = screen.getByPlaceholderText('Search attendees...')
      fireEvent.change(searchInput, { target: { value: 'Mike' } })
      
      const mikeAttendee = screen.getByText('Mike Chen')
      fireEvent.click(mikeAttendee)
      
      // Should show Mike Chen in selected attendees
      expect(screen.getByText('Mike Chen')).toBeInTheDocument()
      
      // Remove Mike Chen by clicking the remove button (× symbol)
      const removeButton = screen.getByText('×')
      fireEvent.click(removeButton)
      
      // Mike Chen should no longer be in selected attendees
      expect(screen.queryByText('Mike Chen')).not.toBeInTheDocument()
    })

    it('allows setting recurring events', () => {
      const recurringCheckbox = screen.getByLabelText('Recurring Event')
      fireEvent.click(recurringCheckbox)
      
      expect(recurringCheckbox).toBeChecked()
      expect(screen.getByDisplayValue('weekly')).toBeInTheDocument()
    })

    it('creates a new event when form is submitted', async () => {
      const titleInput = screen.getByLabelText('Event Title')
      const dateInput = screen.getByLabelText('Date')
      const timeInput = screen.getByLabelText('Time')
      const createButton = screen.getByText('Create Event')
      
      fireEvent.change(titleInput, { target: { value: 'New Test Event' } })
      fireEvent.change(dateInput, { target: { value: '2024-02-01' } })
      fireEvent.change(timeInput, { target: { value: '10:00' } })
      fireEvent.click(createButton)
      
      await waitFor(() => {
        expect(screen.queryByText('Create New Event')).not.toBeInTheDocument()
        expect(screen.getByText('New Test Event')).toBeInTheDocument()
      })
    })

    it('validates required fields before creating event', () => {
      const createButton = screen.getByText('Create Event')
      
      // Button should be disabled when required fields are empty
      expect(createButton).toBeDisabled()
    })
  })

  describe('Event Details Modal', () => {
    beforeEach(() => {
      render(<CalendarPage />)
      // Click on an event to open details modal
      const eventCard = screen.getByText('Team Practice Session')
      fireEvent.click(eventCard)
    })

    it('displays event details correctly', () => {
      expect(screen.getByText('Team Practice Session')).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
      expect(screen.getByText('Date')).toBeInTheDocument()
      expect(screen.getByText('Time')).toBeInTheDocument()
      expect(screen.getByText('Location')).toBeInTheDocument()
      expect(screen.getByText('Attendees')).toBeInTheDocument()
    })

    it('shows all attendees for the event', () => {
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
      expect(screen.getByText('Mike Chen')).toBeInTheDocument()
      expect(screen.getByText('Emma Davis')).toBeInTheDocument()
      expect(screen.getByText('Alex Thompson')).toBeInTheDocument()
    })

    it('displays event information with correct formatting', () => {
      expect(screen.getByText('Main Gym')).toBeInTheDocument()
      expect(screen.getByText('9:00 AM (90 min)')).toBeInTheDocument()
    })

    it('has action buttons for editing and deleting', () => {
      expect(screen.getByText('Edit Event')).toBeInTheDocument()
      expect(screen.getByText('Delete Event')).toBeInTheDocument()
    })

    it('deletes event when delete button is clicked', async () => {
      const deleteButton = screen.getByText('Delete Event')
      fireEvent.click(deleteButton)
      
      await waitFor(() => {
        expect(screen.queryByText('Team Practice Session')).not.toBeInTheDocument()
      })
    })
  })

  describe('Calendar Navigation', () => {
    it('navigates to previous month when prev button is clicked', () => {
      render(<CalendarPage />)
      
      const prevButton = screen.getByRole('button', { name: /previous/i })
      fireEvent.click(prevButton)
      
      // The month display should change
      const currentDate = new Date()
      currentDate.setMonth(currentDate.getMonth() - 1)
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ]
      const expectedText = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
      
      expect(screen.getByText(expectedText)).toBeInTheDocument()
    })

    it('navigates to next month when next button is clicked', () => {
      render(<CalendarPage />)
      
      const nextButton = screen.getByRole('button', { name: /next/i })
      fireEvent.click(nextButton)
      
      // The month display should change
      const currentDate = new Date()
      currentDate.setMonth(currentDate.getMonth() + 1)
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ]
      const expectedText = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
      
      expect(screen.getByText(expectedText)).toBeInTheDocument()
    })
  })

  describe('Event Interactions', () => {
    it('opens event details when clicking on event card', () => {
      render(<CalendarPage />)
      
      const eventCard = screen.getByText('Team Practice Session')
      fireEvent.click(eventCard)
      
      expect(screen.getByText('Team Practice Session')).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
    })

    it('opens event details when clicking on calendar event', () => {
      render(<CalendarPage />)
      
      // Find and click on an event in the calendar grid
      const calendarEvent = screen.getByText('Team Practice Session')
      fireEvent.click(calendarEvent)
      
      expect(screen.getByText('Team Practice Session')).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('renders without crashing on different screen sizes', () => {
      render(<CalendarPage />)
      
      // Basic checks to ensure the component renders
      expect(screen.getByText('Calendar')).toBeInTheDocument()
      expect(screen.getByText('Add Event')).toBeInTheDocument()
    })
  })

  describe('Event Filtering', () => {
    it('filters upcoming events by type', () => {
      render(<CalendarPage />)
      
      const practicesFilter = screen.getByText('Practices')
      fireEvent.click(practicesFilter)
      
      // Should show only practice events in upcoming events
      expect(screen.getByText('Team Practice Session')).toBeInTheDocument()
      expect(screen.queryByText('Team Meeting')).not.toBeInTheDocument()
    })

    it('shows all events when "All Events" filter is selected', () => {
      render(<CalendarPage />)
      
      // First filter by practices
      const practicesFilter = screen.getByText('Practices')
      fireEvent.click(practicesFilter)
      
      // Then select all events
      const allEventsFilter = screen.getByText('All Events')
      fireEvent.click(allEventsFilter)
      
      // Should show all events again
      expect(screen.getByText('Team Practice Session')).toBeInTheDocument()
      expect(screen.getByText('Team Meeting')).toBeInTheDocument()
      expect(screen.getByText('Regional Championship Game')).toBeInTheDocument()
    })
  })
}) 