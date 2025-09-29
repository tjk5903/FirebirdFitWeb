'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Dumbbell, Calendar, MessageSquare } from 'lucide-react'
import { useEffect } from 'react'

export default function MainNavigation() {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  
  // Clean up extra attributes added by browser extensions
  useEffect(() => {
    const cleanupExtraAttributes = () => {
      const buttons = document.querySelectorAll('button[fdprocessedid]')
      buttons.forEach(button => {
        button.removeAttribute('fdprocessedid')
      })
    }
    
    // Clean up after hydration
    const timeoutId = setTimeout(cleanupExtraAttributes, 100)
    
    return () => clearTimeout(timeoutId)
  }, [])
  
  // Determine active tab based on current pathname
  const getActiveTab = () => {
    // Only highlight tabs for specific pages
    if (pathname === '/workouts' || pathname.startsWith('/workouts/')) return 'workouts'
    if (pathname === '/calendar' || pathname.startsWith('/calendar/')) return 'calendar'
    if (pathname === '/messages' || pathname.startsWith('/messages/')) return 'messages'
    // Return null for dashboard and all other pages
    return null
  }

  const handleTabClick = (tab: string) => {
    router.push(`/${tab}`)
  }

  const tabs = [
    {
      id: 'workouts',
      label: 'Workouts',
      icon: Dumbbell,
      href: '/workouts'
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: Calendar,
      href: '/calendar'
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: MessageSquare,
      href: '/messages'
    }
  ]

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container-responsive">
        <div className="flex justify-center">
          <div className="flex space-x-1 p-2 bg-gray-100 rounded-2xl">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = getActiveTab() === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="hidden sm:block">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
} 