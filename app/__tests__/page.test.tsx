import React from 'react'
import { render, screen } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import HomePage from '../page'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}))

describe('HomePage', () => {
  const mockRouter = {
    push: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  it('redirects to login page when no user is authenticated', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: null,
      isLoading: false,
    })

    render(<HomePage />)
    
    expect(mockRouter.push).toHaveBeenCalledWith('/login')
  })

  it('redirects to dashboard when user is authenticated', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'coach' },
      isLoading: false,
    })

    render(<HomePage />)
    
    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
  })

  it('shows loading spinner while authentication is loading', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: null,
      isLoading: true,
    })

    render(<HomePage />)
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    expect(mockRouter.push).not.toHaveBeenCalled()
  })

  it('does not redirect while loading', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: null,
      isLoading: true,
    })

    render(<HomePage />)
    
    expect(mockRouter.push).not.toHaveBeenCalled()
  })
}) 