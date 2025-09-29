'use client'

import { useState, useEffect } from 'react'
import { Search, Users, UserCheck, UserPlus } from 'lucide-react'
import { getTeamMembers } from '@/lib/utils'

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
}

interface MemberSelectorProps {
  selectedMembers: string[]
  onMemberToggle: (memberId: string) => void
  onMembersChange: (memberIds: string[]) => void
  userId: string
  title?: string
  description?: string
}

export default function MemberSelector({
  selectedMembers,
  onMemberToggle,
  onMembersChange,
  userId,
  title = "Select Members",
  description = "Choose team members to add to this chat"
}: MemberSelectorProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Load team members
  useEffect(() => {
    const loadTeamMembers = async () => {
      if (!userId) return
      
      setIsLoading(true)
      setError(null)
      
      try {
        const members = await getTeamMembers(userId)
        setTeamMembers(members)
      } catch (err) {
        console.error('Error loading team members:', err)
        setError('Failed to load team members')
      } finally {
        setIsLoading(false)
      }
    }

    loadTeamMembers()
  }, [userId])

  // Filter members based on search term
  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Group members by role
  const coaches = filteredMembers.filter(member => member.role === 'coach')
  const assistantCoaches = filteredMembers.filter(member => member.role === 'assistant_coach')
  const athletes = filteredMembers.filter(member => member.role === 'athlete')

  // Handle select all for a role
  const handleSelectAll = (role: string) => {
    const membersToToggle = filteredMembers.filter(member => member.role === role)
    const allSelected = membersToToggle.every(member => selectedMembers.includes(member.id))
    
    if (allSelected) {
      // Deselect all members of this role
      const newSelection = selectedMembers.filter(id => 
        !membersToToggle.some(member => member.id === id)
      )
      onMembersChange(newSelection)
    } else {
      // Select all members of this role
      const newSelection = Array.from(new Set([...selectedMembers, ...membersToToggle.map(m => m.id)]))
      onMembersChange(newSelection)
    }
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-500 mb-2">⚠️</div>
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
          <Users className="h-4 w-4" />
          <span>{title}</span>
        </h4>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search members..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 text-sm"
        />
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="text-center py-6">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading team members...</p>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="text-center py-6">
          <UserPlus className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-600">
            {searchTerm ? 'No members found matching your search' : 'No team members found'}
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-h-60 overflow-y-auto">
          {/* Coaches Section */}
          {coaches.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Coaches ({coaches.length})
                </h5>
                <button
                  onClick={() => handleSelectAll('coach')}
                  className="text-xs text-green-600 hover:text-green-800 font-medium"
                >
                  {coaches.every(member => selectedMembers.includes(member.id)) ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="space-y-2">
                {coaches.map((member) => (
                  <label key={member.id} className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(member.id)}
                      onChange={() => onMemberToggle(member.id)}
                      className="h-4 w-4 text-green-500 rounded focus:ring-green-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {member.name}
                        </span>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                          Coach
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{member.email}</p>
                    </div>
                    {selectedMembers.includes(member.id) && (
                      <UserCheck className="h-4 w-4 text-green-500" />
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Assistant Coaches Section */}
          {assistantCoaches.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Assistant Coaches ({assistantCoaches.length})
                </h5>
                <button
                  onClick={() => handleSelectAll('assistant_coach')}
                  className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                >
                  {assistantCoaches.every(member => selectedMembers.includes(member.id)) ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="space-y-2">
                {assistantCoaches.map((member) => (
                  <label key={member.id} className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(member.id)}
                      onChange={() => onMemberToggle(member.id)}
                      className="h-4 w-4 text-purple-500 rounded focus:ring-purple-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {member.name}
                        </span>
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                          Assistant
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{member.email}</p>
                    </div>
                    {selectedMembers.includes(member.id) && (
                      <UserCheck className="h-4 w-4 text-purple-500" />
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Athletes Section */}
          {athletes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Athletes ({athletes.length})
                </h5>
                <button
                  onClick={() => handleSelectAll('athlete')}
                  className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                >
                  {athletes.every(member => selectedMembers.includes(member.id)) ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="space-y-2">
                {athletes.map((member) => (
                  <label key={member.id} className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(member.id)}
                      onChange={() => onMemberToggle(member.id)}
                      className="h-4 w-4 text-purple-500 rounded focus:ring-purple-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {member.name}
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          Athlete
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{member.email}</p>
                    </div>
                    {selectedMembers.includes(member.id) && (
                      <UserCheck className="h-4 w-4 text-purple-500" />
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Selected Count */}
      {selectedMembers.length > 0 && (
        <div className="pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
          </p>
        </div>
      )}
    </div>
  )
}
