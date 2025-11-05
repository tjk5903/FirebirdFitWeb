'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, Loader2, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextType {
  toasts: Toast[]
  showToast: (title: string, type?: ToastType, options?: Partial<Toast>) => string
  hideToast: (id: string) => void
  clearAllToasts: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((
    title: string, 
    type: ToastType = 'info', 
    options: Partial<Toast> = {}
  ): string => {
    const id = Math.random().toString(36).substr(2, 9)
    const duration = options.duration ?? (type === 'loading' ? 0 : 5000) // Loading toasts don't auto-dismiss
    
    const toast: Toast = {
      id,
      type,
      title,
      duration,
      ...options
    }

    setToasts(prev => [...prev, toast])

    // Auto-dismiss after duration (except loading toasts)
    if (duration > 0) {
      setTimeout(() => {
        hideToast(id)
      }, duration)
    }

    return id
  }, [])

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const clearAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast, clearAllToasts }}>
      {children}
      <ToastContainer toasts={toasts} onHideToast={hideToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, onHideToast }: { toasts: Toast[], onHideToast: (id: string) => void }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-3 max-w-sm w-full pointer-events-none">
      <style jsx>{`
        @keyframes toast-bounce-in {
          0% { 
            transform: translateX(100%) scale(0.8);
            opacity: 0;
          }
          60% { 
            transform: translateX(-10px) scale(1.05);
            opacity: 1;
          }
          100% { 
            transform: translateX(0) scale(1);
            opacity: 1;
          }
        }
        .toast-enter {
          animation: toast-bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
      `}</style>
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onHide={onHideToast} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onHide }: { toast: Toast, onHide: (id: string) => void }) {
  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warning':
        return 'bg-orange-50 border-orange-200 text-orange-800'
      case 'loading':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />
      case 'loading':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      default:
        return <Info className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <div className={`
      ${getToastStyles()}
      border rounded-xl shadow-lg p-4 
      toast-enter
      backdrop-blur-sm
      transform transition-all
      hover:scale-105 hover:shadow-xl
      pointer-events-auto
    `}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{toast.title}</p>
          {toast.message && (
            <p className="text-sm opacity-90 mt-1">{toast.message}</p>
          )}
          
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="text-sm font-medium underline mt-2 hover:no-underline"
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {toast.type !== 'loading' && (
          <button
            onClick={() => onHide(toast.id)}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-black/10 transition-all duration-200 hover:scale-110 active:scale-95"
          >
            <X className="h-4 w-4 opacity-60 hover:opacity-100 transition-opacity" />
          </button>
        )}
      </div>
    </div>
  )
}
