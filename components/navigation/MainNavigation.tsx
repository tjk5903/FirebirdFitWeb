'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Dumbbell, Calendar, MessageSquare } from 'lucide-react'

export default function MainNavigation() {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  
  const [activeTab, setActiveTab] = useState(() => {
    if (pathname.startsWith('/workouts')) return 'workouts'
    if (pathname.startsWith('/calendar')) return 'calendar'
    if (pathname.startsWith('/messages')) return 'messages'
    return 'workouts'
  })

  const handleTabClick = (tab: string) => {
    setActiveTab(tab)
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
              const isActive = activeTab === tab.id
              
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