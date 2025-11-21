'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useTeamContext } from '@/contexts/TeamContext'
import { ChevronDown, Users } from 'lucide-react'

export default function TeamSelector() {
  const { selectedTeamId, setSelectedTeamId, userTeams, isLoading } = useTeamContext()
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Don't render if user has less than 2 teams
  if (isLoading || userTeams.length < 2) {
    return null
  }

  const selectedTeam = userTeams.find(team => team.id === selectedTeamId)

  const handleTeamSelect = (teamId: string) => {
    setSelectedTeamId(teamId)
    setIsOpen(false)
  }

  // Format role for display
  const formatRole = (role: string) => {
    if (role === 'coach') return 'Head Coach'
    if (role === 'assistant_coach') return 'Assistant Coach'
    return 'Athlete'
  }

  // Calculate dropdown position
  useEffect(() => {
    if (isOpen && buttonRef.current && dropdownRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect()
      dropdownRef.current.style.top = `${buttonRect.bottom + 8}px`
      dropdownRef.current.style.right = `${window.innerWidth - buttonRect.right}px`
    }
  }, [isOpen])

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 sm:space-x-1.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg sm:rounded-xl px-1.5 sm:px-2.5 md:px-3 py-1.5 sm:py-2 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer border border-white/50 dark:border-slate-700/50"
        title={selectedTeam ? selectedTeam.name : 'Select team'}
      >
        <Users className="h-4 w-4 sm:h-4 md:h-5 sm:w-4 md:w-5 text-royal-blue dark:text-blue-400 flex-shrink-0" />
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 hidden md:inline max-w-[120px] lg:max-w-[150px] truncate">
          {selectedTeam ? selectedTeam.name : 'Select team'}
        </span>
        <ChevronDown 
          className={`h-3 w-3 sm:h-3.5 md:h-4 sm:w-3.5 md:w-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[45]"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown - Fixed positioning to appear above everything */}
          <div 
            ref={dropdownRef}
            className="fixed z-[50] w-64 sm:w-72 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden"
          >
            <div className="px-3 py-2 border-b border-gray-200 dark:border-slate-700">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Switch Team</p>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {userTeams.map((team) => (
                <button
                  key={team.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleTeamSelect(team.id)
                  }}
                  className={`w-full flex items-center space-x-3 p-3 sm:p-4 text-left hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors duration-200 ${
                    team.id === selectedTeamId 
                      ? 'bg-royal-blue/10 dark:bg-blue-900/30 border-l-2 border-royal-blue dark:border-blue-400' 
                      : 'border-l-2 border-transparent'
                  }`}
                >
                  <div className="h-10 w-10 bg-gradient-to-br from-royal-blue to-dark-blue rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold truncate ${
                      team.id === selectedTeamId 
                        ? 'text-royal-blue dark:text-blue-400' 
                        : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      {team.name}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {formatRole(team.role)}
                    </div>
                  </div>
                  {team.id === selectedTeamId && (
                    <div className="h-2 w-2 bg-royal-blue dark:bg-blue-400 rounded-full flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

