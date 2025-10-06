'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  componentName?: string
  onRetry?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class DashboardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`DashboardErrorBoundary caught error in ${this.props.componentName}:`, error, errorInfo)
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null
    })
    
    // Call custom retry function if provided
    if (this.props.onRetry) {
      this.props.onRetry()
    }
  }

  render() {
    if (this.state.hasError) {
      const componentName = this.props.componentName || 'Component'
      
      return (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 m-4">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <h3 className="text-lg font-semibold text-red-900">
              {componentName} Error
            </h3>
          </div>
          
          <p className="text-red-700 mb-4">
            Something went wrong with the {componentName.toLowerCase()}. This won't affect other parts of the app.
          </p>
          
          <div className="flex space-x-3">
            <button
              onClick={this.handleRetry}
              className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-200"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Try Again</span>
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-xl transition-all duration-200"
            >
              <Home className="h-4 w-4" />
              <span>Refresh Page</span>
            </button>
          </div>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-4 text-sm">
              <summary className="cursor-pointer text-red-600 font-medium">
                Error Details (Development)
              </summary>
              <pre className="mt-2 p-3 bg-red-100 rounded text-red-800 overflow-auto text-xs">
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
