'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getTeamMessages, getConversationMessages, sendMessage, createGroupChat, addMembersToGroupChat, deleteConversation } from '@/lib/utils'
import { Search, Send, Plus, X, Users, MoreVertical, ArrowLeft, MessageCircle, Hash, Trash2 } from 'lucide-react'
import FirebirdLogo from '@/components/ui/FirebirdLogo'
import MainNavigation from '@/components/navigation/MainNavigation'

// Mock data for messages (keeping for fallback)
const mockMessages = [
  {
    id: 1,
    name: 'Jake Rodriguez',
    lastMessage: 'Great session today! Feeling stronger already.',
    time: '1 hour ago',
    unread: true,
    avatar: 'JR',
    type: 'athlete'
  },
  {
    id: 2,
    name: 'Marcus Johnson',
    lastMessage: 'Can we discuss the new training schedule?',
    time: '2 hours ago',
    unread: false,
    avatar: 'MJ',
    type: 'athlete'
  },
  {
    id: 3,
    name: 'Tyler Williams',
    lastMessage: 'Team meeting tomorrow at 3 PM confirmed.',
    time: '3 hours ago',
    unread: false,
    avatar: 'TW',
    type: 'athlete'
  },
  {
    id: 4,
    name: 'Brandon Davis',
    lastMessage: 'New workout plan looks challenging!',
    time: '1 day ago',
    unread: false,
    avatar: 'BD',
    type: 'athlete'
  },
  {
    id: 5,
    name: 'Team Chat',
    lastMessage: 'Coach Johnson: Great work everyone!',
    time: '2 days ago',
    unread: false,
    avatar: 'TC',
    type: 'group'
  },
  {
    id: 6,
    name: 'Senior Squad',
    lastMessage: 'Coach: Practice moved to 4 PM today',
    time: '4 hours ago',
    unread: true,
    avatar: 'SS',
    type: 'group'
  },
  {
    id: 7,
    name: 'Ryan Mitchell',
    lastMessage: 'Injured my ankle during practice',
    time: '5 hours ago',
    unread: false,
    avatar: 'RM',
    type: 'athlete'
  },
  {
    id: 8,
    name: 'Freshman Group',
    lastMessage: 'Welcome to the team!',
    time: '1 day ago',
    unread: false,
    avatar: 'FG',
    type: 'group'
  }
]

// Mock conversations (keeping for fallback)
const mockConversations = {
  1: [
    { id: 1, sender: 'Jake Rodriguez', message: 'Hi Coach!', time: '2 hours ago', isCoach: false },
    { id: 2, sender: 'Coach', message: 'Hello Jake! How are you feeling today?', time: '2 hours ago', isCoach: true },
    { id: 3, sender: 'Jake Rodriguez', message: 'Great session today! Feeling stronger already.', time: '1 hour ago', isCoach: false },
    { id: 4, sender: 'Coach', message: 'That\'s fantastic! Your form has improved significantly. Keep up the great work!', time: '1 hour ago', isCoach: true },
    { id: 5, sender: 'Jake Rodriguez', message: 'Thank you! When should I expect the next workout plan?', time: '30 minutes ago', isCoach: false }
  ],
  2: [
    { id: 1, sender: 'Marcus Johnson', message: 'Coach, I have a question about the training schedule', time: '3 hours ago', isCoach: false },
    { id: 2, sender: 'Coach', message: 'Of course! What would you like to know?', time: '3 hours ago', isCoach: true },
    { id: 3, sender: 'Marcus Johnson', message: 'Can we discuss the new training schedule?', time: '2 hours ago', isCoach: false }
  ],
  3: [
    { id: 1, sender: 'Tyler Williams', message: 'Coach, I need to reschedule our meeting', time: '4 hours ago', isCoach: false },
    { id: 2, sender: 'Coach', message: 'No problem, what time works better for you?', time: '4 hours ago', isCoach: true },
    { id: 3, sender: 'Tyler Williams', message: 'Team meeting tomorrow at 3 PM confirmed.', time: '3 hours ago', isCoach: false }
  ],
  4: [
    { id: 1, sender: 'Brandon Davis', message: 'Coach, the new workout plan looks challenging!', time: '1 day ago', isCoach: false },
    { id: 2, sender: 'Coach', message: 'That\'s the goal! It\'s designed to push you to the next level.', time: '1 day ago', isCoach: true }
  ],
  5: [
    { id: 1, sender: 'Coach Johnson', message: 'Great work everyone! Keep pushing yourselves!', time: '2 days ago', isCoach: true },
    { id: 2, sender: 'Jake Rodriguez', message: 'Thanks Coach! Feeling stronger every day!', time: '2 days ago', isCoach: false },
    { id: 3, sender: 'Marcus Johnson', message: 'Agreed! The new routine is working wonders.', time: '2 days ago', isCoach: false }
  ],
  6: [
    { id: 1, sender: 'Coach', message: 'Practice moved to 4 PM today due to field maintenance.', time: '4 hours ago', isCoach: true },
    { id: 2, sender: 'Tyler Williams', message: 'Got it, thanks for the update!', time: '4 hours ago', isCoach: false }
  ],
  7: [
    { id: 1, sender: 'Ryan Mitchell', message: 'Coach, I injured my ankle during practice today.', time: '5 hours ago', isCoach: false },
    { id: 2, sender: 'Coach', message: 'I\'m sorry to hear that. Let\'s get you checked out and adjust your training plan.', time: '5 hours ago', isCoach: true }
  ],
  8: [
    { id: 1, sender: 'Coach', message: 'Welcome to the team, freshmen! We\'re excited to have you.', time: '1 day ago', isCoach: true },
    { id: 2, sender: 'Freshman 1', message: 'Thank you! We\'re excited to be here!', time: '1 day ago', isCoach: false }
  ]
}

export default function MessagesPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)
  const [newChatName, setNewChatName] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [messages, setMessages] = useState<Array<{
    id: string
    name: string
    lastMessage: string
    time: string
    unread: boolean
    avatar: string
    type: 'athlete' | 'group'
    conversationId: string
  }>>([])
  const [conversations, setConversations] = useState<any>({})
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [teamMembers, setTeamMembers] = useState<Array<{
    id: string
    name: string
    role: string
    type: 'athlete' | 'staff'
  }>>([])
  const [isLoadingTeamMembers, setIsLoadingTeamMembers] = useState(false)
  const [isCreatingGroupChat, setIsCreatingGroupChat] = useState(false)
  const [isLoadingConversation, setIsLoadingConversation] = useState(false)
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false)
  
  // Delete conversation states
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [conversationToDelete, setConversationToDelete] = useState<any>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showAddMembersModal, setShowAddMembersModal] = useState(false)
  const [isAddingMembers, setIsAddingMembers] = useState(false)
  const [isDeletingChat, setIsDeletingChat] = useState(false)

  // Load messages when user loads
  useEffect(() => {
    const loadMessages = async () => {
      if (!user) return
      
      setIsLoadingMessages(true)
      try {
        const teamMessages = await getTeamMessages(user.id)
        setMessages(teamMessages)
      } catch (error) {
        console.error('Error loading messages:', error)
        // Fallback to mock data if there's an error
        setMessages(mockMessages.map(msg => ({
          ...msg,
          id: msg.id.toString(),
          type: msg.type as 'athlete' | 'group',
          conversationId: msg.type === 'group' ? `team_${msg.id}` : `direct_${msg.id}_${user.id}`
        })))
      } finally {
        setIsLoadingMessages(false)
      }
    }

    loadMessages()
  }, [user])

  // Load team members for group chat creation
  useEffect(() => {
    const loadTeamMembers = async () => {
      if (!user) return
      
      setIsLoadingTeamMembers(true)
      try {
        // Import supabase client
        const { supabase } = await import('@/lib/supabaseClient')
        
        // Get user's team
        const { data: userTeam, error: teamError } = await supabase
          .from('team_members')
          .select('team_id')
          .eq('user_id', user.id)
          .single()

        if (teamError) throw teamError

        // Get all team members
        const { data: members, error: membersError } = await supabase
          .from('team_members')
          .select(`
            user_id,
            role,
            users (
              id,
              full_name,
              email
            )
          `)
          .eq('team_id', userTeam.team_id)

        if (membersError) throw membersError

        // Format team members
        const formattedMembers = members?.map((member: any) => ({
          id: member.user_id,
          name: member.users.full_name || member.users.email,
          role: member.role,
          type: (member.role === 'coach' ? 'staff' : 'athlete') as 'athlete' | 'staff'
        })).filter((member: any) => member.id !== user.id) || []

        setTeamMembers(formattedMembers)
      } catch (error) {
        console.error('Error loading team members:', error)
        // Fallback to mock data
        setTeamMembers([
          { id: '1', name: 'Jake Rodriguez', role: 'athlete', type: 'athlete' as const },
          { id: '2', name: 'Marcus Johnson', role: 'athlete', type: 'athlete' as const },
          { id: '3', name: 'Tyler Williams', role: 'athlete', type: 'athlete' as const },
          { id: '4', name: 'Brandon Davis', role: 'athlete', type: 'athlete' as const },
          { id: '5', name: 'Ryan Mitchell', role: 'athlete', type: 'athlete' as const },
          { id: '6', name: 'Chris Thompson', role: 'athlete', type: 'athlete' as const },
          { id: '7', name: 'Kevin Martinez', role: 'athlete', type: 'athlete' as const },
          { id: '8', name: 'David Wilson', role: 'athlete', type: 'athlete' as const },
          { id: '9', name: 'Anthony Garcia', role: 'athlete', type: 'athlete' as const },
          { id: '10', name: 'Michael Brown', role: 'athlete', type: 'athlete' as const },
          { id: '101', name: 'Dr. Smith', role: 'staff', type: 'staff' as const },
          { id: '102', name: 'Coach Martinez', role: 'coach', type: 'staff' as const },
          { id: '103', name: 'Nutritionist Brown', role: 'staff', type: 'staff' as const }
        ])
      } finally {
        setIsLoadingTeamMembers(false)
      }
    }

    if (user?.role === 'coach') {
      loadTeamMembers()
    }
  }, [user])

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showOptionsDropdown) {
        setShowOptionsDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showOptionsDropdown])

  const filteredMessages = messages.filter(message =>
    message.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedMessage || !user) {
      return
    }

    // Get the conversation ID for the selected message
    const selectedMsg = messages.find((msg: any) => msg.id === selectedMessage)
    if (!selectedMsg) {
      console.error('Selected message not found')
      return
    }

    setIsSendingMessage(true)

    try {
      // Send the message to Supabase
      const result = await sendMessage(user.id, selectedMsg.conversationId, newMessage.trim())
      
      if (result.success) {
        // Clear the input field
        setNewMessage('')
        
        // Refresh the conversation to show the new message
        const conversationMessages = await getConversationMessages(selectedMsg.conversationId)
        setConversations((prev: any) => ({
          ...prev,
          [selectedMessage]: conversationMessages
        }))
        
        // Refresh the messages list to update the last message
        const teamMessages = await getTeamMessages(user.id)
        setMessages(teamMessages)
      } else {
        // Handle error - you could show a toast notification here
        console.error(`Failed to send message: ${result.error}`)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      console.error('An error occurred while sending the message')
    } finally {
      setIsSendingMessage(false)
    }
  }

  const handleDeleteClick = (conversation: any) => {
    setConversationToDelete(conversation)
    setShowDeleteModal(true)
  }

  const confirmDeleteConversation = async () => {
    if (!conversationToDelete || !user) return

    try {
      console.log('Deleting conversation:', conversationToDelete.conversationId)
      const result = await deleteConversation(conversationToDelete.conversationId, user.id)
      
      if (result.success) {
        // Remove from local state
        setMessages(messages.filter((msg: any) => msg.id !== conversationToDelete.id))
        
        // Clear selected message if it was the deleted conversation
        if (selectedMessage === conversationToDelete.id) {
          setSelectedMessage(null)
        }
        
        console.log('Conversation deleted successfully')
        setSuccessMessage('Conversation deleted successfully!')
        setShowSuccessModal(true)
      } else {
        console.error('Failed to delete conversation:', result.error)
        setSuccessMessage(`Failed to delete conversation: ${result.error}`)
        setShowSuccessModal(true)
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
      setSuccessMessage('An error occurred while deleting the conversation')
      setShowSuccessModal(true)
    } finally {
      setShowDeleteModal(false)
      setConversationToDelete(null)
    }
  }

  const handleCreateGroupChat = async () => {
    if (!newChatName.trim() || !user) {
      return
    }

    setIsCreatingGroupChat(true)

    try {
      // Create group chat with or without members
      const result = await createGroupChat(user.id, newChatName.trim(), selectedMembers)
      
      if (result.success) {
        // Refresh messages to show the new group chat
        const teamMessages = await getTeamMessages(user.id)
        setMessages(teamMessages)
        
        // Close modal and reset form
        setShowNewChat(false)
        setNewChatName('')
        setSelectedMembers([])
        
        // Log success message (replace with toast notification later)
        const memberText = selectedMembers.length > 0 
          ? ` with ${selectedMembers.length} member(s)` 
          : ' (no members added yet)'
        console.log(`Group chat "${newChatName}" created successfully!${memberText}`)
      } else {
        console.error(`Failed to create group chat: ${result.error}`)
      }
    } catch (error) {
      console.error('Error creating group chat:', error)
      console.error('An error occurred while creating the group chat')
    } finally {
      setIsCreatingGroupChat(false)
    }
  }

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }

  const handleAddMembers = async () => {
    console.log('handleAddMembers called')
    console.log('selectedMessage:', selectedMessage)
    console.log('user:', user)
    console.log('selectedMembers:', selectedMembers)
    
    if (!selectedMessage || !user || selectedMembers.length === 0) {
      console.log('Early return: missing data or no members selected')
      return
    }

    // Ensure only coaches can add members
    if (user.role !== 'coach') {
      console.error('Only coaches can add members to group chats')
      return
    }

    const selectedMsg = messages.find((msg: any) => msg.id === selectedMessage)
    if (!selectedMsg) {
      console.error('Selected chat not found')
      return
    }
    
    if (selectedMsg.type !== 'group') {
      console.error('Can only add members to group chats')
      return
    }

    setIsAddingMembers(true)

    try {
      // Extract group chat ID from conversation ID
      const groupChatId = selectedMsg.conversationId.replace('group_', '')
      const result = await addMembersToGroupChat(user.id, groupChatId, selectedMembers)
      
      if (result.success) {
        // Refresh messages to show the updated group chat
        const teamMessages = await getTeamMessages(user.id)
        setMessages(teamMessages)
        
        // Refresh the conversation to show the new member addition message
        const conversationMessages = await getConversationMessages(selectedMsg.conversationId)
        setConversations((prev: any) => ({
          ...prev,
          [selectedMessage]: conversationMessages
        }))
        
        // Close modal and reset form
        setShowAddMembersModal(false)
        setSelectedMembers([])
        setShowOptionsDropdown(false)
        
        console.log(`Successfully added ${selectedMembers.length} member(s) to the group chat`)
      } else {
        console.error(`Failed to add members: ${result.error}`)
      }
    } catch (error) {
      console.error('Error adding members:', error)
      console.error('An error occurred while adding members')
    } finally {
      setIsAddingMembers(false)
    }
  }

  const handleDeleteChat = async () => {
    console.log('handleDeleteChat called')
    console.log('selectedMessage:', selectedMessage)
    console.log('user:', user)
    
    if (!selectedMessage || !user) {
      console.log('Early return: missing selectedMessage or user')
      return
    }

    // Ensure only coaches can delete chats
    if (user.role !== 'coach') {
      console.error('Only coaches can delete group chats')
      return
    }

    const selectedMsg = messages.find((msg: any) => msg.id === selectedMessage)
    console.log('selectedMsg found:', selectedMsg)
    
    if (!selectedMsg) {
      console.error('Selected chat not found')
      return
    }

    const confirmDelete = window.confirm(`Are you sure you want to delete "${selectedMsg.name}"? This action cannot be undone.`)
    if (!confirmDelete) {
      return
    }

    setIsDeletingChat(true)

    try {
      if (selectedMsg.type === 'group') {
        // For group chats, add a deletion message
        const result = await sendMessage(user.id, selectedMsg.conversationId, 'This group chat has been deleted by the coach.')
        
        if (result.success) {
          console.log(`Group chat "${selectedMsg.name}" has been deleted`)
        } else {
          console.error(`Failed to delete group chat: ${result.error}`)
        }
      } else {
        // For individual chats, we'll just clear the conversation locally
        // In a real implementation, you might want to add a "deleted" flag to the database
        console.log(`Individual chat with "${selectedMsg.name}" has been cleared`)
      }
      
      // Refresh messages to reflect changes
      const teamMessages = await getTeamMessages(user.id)
      setMessages(teamMessages)
      
      // Clear the selected message since the chat is deleted/cleared
      setSelectedMessage(null)
      setShowOptionsDropdown(false)
      
    } catch (error) {
      console.error('Error deleting chat:', error)
      console.error('An error occurred while deleting the chat')
    } finally {
      setIsDeletingChat(false)
    }
  }

  // Load conversation messages when a message is selected
  useEffect(() => {
    const loadConversation = async () => {
      if (!selectedMessage) return
      
      const selectedMsg = messages.find((msg: any) => msg.id === selectedMessage)
      if (!selectedMsg) return
      
      setIsLoadingConversation(true)
      try {
        const conversationMessages = await getConversationMessages(selectedMsg.conversationId)
        setConversations((prev: any) => ({
          ...prev,
          [selectedMessage]: conversationMessages
        }))
      } catch (error) {
        console.error('Error loading conversation:', error)
        // Fallback to mock conversations if available
        const mockKey = parseInt(selectedMessage) as keyof typeof mockConversations
        if (mockConversations[mockKey]) {
          setConversations((prev: any) => ({
            ...prev,
            [selectedMessage]: mockConversations[mockKey]
          }))
        }
      } finally {
        setIsLoadingConversation(false)
      }
    }

    loadConversation()
  }, [selectedMessage])

  const currentConversation = selectedMessage ? conversations[selectedMessage] || [] : []
  const selectedMessageData = selectedMessage ? messages.find(m => m.id === selectedMessage) : null

  // Show loading state while auth is loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if no user
  if (!user) {
    router.push('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <MainNavigation />
      
      <div className={`container-responsive py-6 transition-all duration-500 delay-200 ${
        isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4 sm:gap-0">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </button>
            <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Messages</h1>
              <p className="text-sm sm:text-base text-gray-600">Team communication hub</p>
            </div>
          </div>

          {user?.role === 'coach' && (
            <button
              onClick={() => setShowNewChat(true)}
              className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-2xl transition-colors text-sm sm:text-base"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>New Chat</span>
            </button>
          )}
        </div>

        {/* Messages Container */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          <div className="flex flex-col lg:flex-row h-[calc(100vh-300px)]">
            {/* Messages List */}
            <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col">
              {/* Messages List Header */}
              <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Conversations</h2>
                    <p className="text-xs sm:text-sm text-gray-600">Connect with your team</p>
                  </div>
                </div>
                
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-gray-50 focus:bg-white text-sm sm:text-base"
                  />
                </div>
              </div>

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50/50 to-white">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
                    <span className="text-gray-600">Loading messages...</span>
                  </div>
                ) : filteredMessages.length > 0 ? (
                  filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    onClick={() => setSelectedMessage(message.id)}
                    className={`group p-3 sm:p-4 border-b border-gray-100 cursor-pointer transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-blue-100/80 ${
                      selectedMessage === message.id 
                        ? 'bg-gradient-to-r from-blue-100 to-blue-200 border-blue-300 shadow-sm ring-2 ring-blue-300' 
                        : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 ${
                        message.type === 'group' 
                          ? 'bg-gradient-to-br from-purple-500 to-purple-600' 
                          : 'bg-gradient-to-br from-blue-500 to-blue-600'
                      } ${message.unread ? 'ring-2 ring-blue-300' : ''}`}>
                        {message.type === 'group' ? (
                          <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        ) : (
                          <span className="text-white font-bold text-sm sm:text-base">{message.avatar}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-bold text-gray-900 truncate text-sm sm:text-base">{message.name}</h3>
                            {message.type === 'group' && (
                              <Hash className="h-3 w-3 text-purple-500" />
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {message.unread && (
                              <div className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
                                New
                              </div>
                            )}
                            <span className="text-xs text-gray-500 font-medium">{message.time}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteClick(message)
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 truncate mb-1 sm:mb-2">{message.lastMessage}</p>
                        {message.unread && (
                          <div className="flex items-center space-x-2">
                            <span className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></span>
                            <span className="text-xs text-blue-600 font-bold">New message</span>
                          </div>
                        )}
                        {message.type === 'group' && (
                          <div className="flex items-center space-x-1 mt-1">
                            <Users className="h-3 w-3 text-purple-400" />
                            <span className="text-xs text-purple-500 font-medium">Group chat</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
                ) : (
                  <div className="text-center py-8">
                    <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="h-8 w-8 text-gray-400" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">No messages found</h4>
                    <p className="text-gray-600">
                      {searchTerm ? 'No conversations match your search.' : 'Start a conversation with your team members.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-gradient-to-b from-gray-50/30 to-white min-h-0">
              {selectedMessage ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-2xl flex items-center justify-center shadow-lg ${
                          selectedMessageData?.type === 'group' 
                            ? 'bg-gradient-to-br from-purple-500 to-purple-600' 
                            : 'bg-gradient-to-br from-blue-500 to-blue-600'
                        }`}>
                          {selectedMessageData?.type === 'group' ? (
                            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                          ) : (
                            <span className="text-white font-bold text-sm sm:text-base">
                              {selectedMessageData?.avatar}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h2 className="font-bold text-gray-900 text-base sm:text-lg">
                              {selectedMessageData?.name}
                            </h2>
                            {selectedMessageData?.type === 'group' && (
                              <Hash className="h-4 w-4 text-purple-500" />
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
                            <p className="text-xs sm:text-sm text-gray-600 font-medium">
                              {selectedMessageData?.type === 'group' ? 'Group active' : 'Active now'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <button className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200">
                          <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                        <div className="relative">
                          <button 
                            onClick={() => {
                              console.log('Three dots button clicked')
                              console.log('Current showOptionsDropdown:', showOptionsDropdown)
                              console.log('Selected message data:', selectedMessageData)
                              console.log('User role:', user?.role)
                              setShowOptionsDropdown(!showOptionsDropdown)
                            }}
                            className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
                          >
                            <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>
                          
                          {/* Dropdown Menu - Only visible for coaches on any chat */}
                          {(() => {
                            const shouldShow = showOptionsDropdown && selectedMessageData && user?.role === 'coach';
                            console.log('Dropdown should show:', shouldShow);
                            console.log('- showOptionsDropdown:', showOptionsDropdown);
                            console.log('- selectedMessageData exists:', !!selectedMessageData);
                            console.log('- selectedMessageData?.type:', selectedMessageData?.type);
                            console.log('- user?.role:', user?.role);
                            return shouldShow;
                          })() && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                              {/* Add Members - Only for group chats */}
                              {selectedMessageData?.type === 'group' && (
                                <button
                                  onClick={() => {
                                    console.log('Add Members button clicked')
                                    console.log('Current user:', user)
                                    console.log('Selected message:', selectedMessage)
                                    console.log('Selected message data:', selectedMessageData)
                                    setShowAddMembersModal(true)
                                    setShowOptionsDropdown(false)
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
                                >
                                  <Users className="h-4 w-4" />
                                  <span>Add Members</span>
                                </button>
                              )}
                              
                              {/* Delete Chat - Available for all chats */}
                              <button
                                onClick={() => {
                                  console.log('Delete Chat button clicked')
                                  console.log('Current user:', user)
                                  console.log('Selected message:', selectedMessage)
                                  console.log('Selected message data:', selectedMessageData)
                                  handleDeleteChat()
                                }}
                                disabled={isDeletingChat}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <X className="h-4 w-4" />
                                <span>{isDeletingChat ? 'Deleting...' : 'Delete Chat'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-gray-50/50 to-white">
                    {isLoadingConversation ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                          <p className="text-gray-600">Loading conversation...</p>
                        </div>
                      </div>
                    ) : currentConversation.length > 0 ? (
                      <>
                        {/* Conversation Status */}
                        <div className="text-center mb-6">
                          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
                            <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
                            <span className="text-sm text-blue-700 font-medium">
                              {selectedMessageData?.type === 'group' 
                                ? `Group chat with ${currentConversation.length} messages` 
                                : `Direct conversation with ${currentConversation.length} messages`
                              }
                            </span>
                          </div>
                        </div>
                        
                        {/* Messages */}
                        {currentConversation.map((msg: any) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.isCoach ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-6 py-4 rounded-3xl shadow-lg transition-all duration-300 hover:shadow-xl ${
                              msg.isCoach
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                                : 'bg-white text-gray-900 border-2 border-gray-100 shadow-md'
                            }`}
                          >
                            <p className="text-sm leading-relaxed">{msg.message}</p>
                            <div className={`flex items-center justify-between mt-2 ${
                              msg.isCoach ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              <span className="text-xs font-medium">{msg.time}</span>
                              {msg.isCoach && (
                                <span className="text-xs">✓✓</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No messages yet</h3>
                          <p className="text-gray-600">Start the conversation by sending the first message!</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 sm:p-6 border-t border-gray-200 bg-white">
                    {user?.role === 'coach' ? (
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            placeholder="Type your message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            className="w-full px-4 sm:px-6 py-3 sm:py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-gray-50 focus:bg-white text-sm sm:text-base"
                          />
                          <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-1 sm:space-x-2">
                            <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                              <span className="text-base sm:text-lg">😊</span>
                            </button>
                            <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                              <span className="text-base sm:text-lg">📎</span>
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() || isSendingMessage}
                          className="p-3 sm:p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                          {isSendingMessage ? (
                            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          ) : (
                            <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-3 sm:py-4">
                        <p className="text-xs sm:text-sm text-gray-500">Only coaches can send messages in group chats</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50/50 to-white">
                  <div className="text-center max-w-md px-4">
                    <div className="h-16 w-16 sm:h-20 sm:w-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                      <MessageCircle className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Select a conversation</h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Choose a message from the list to start chatting with your team</p>
                    {user?.role === 'coach' && (
                      <button
                        onClick={() => setShowNewChat(true)}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-2xl hover:shadow-lg transition-all duration-300 hover:scale-105 text-sm sm:text-base"
                      >
                        Start New Chat
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Create Group Chat</h3>
                <button
                  onClick={() => setShowNewChat(false)}
                  className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                  placeholder="Enter group name..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Members (Optional)
                </label>
                <p className="text-xs text-gray-500 mb-3">You can add members now or later. Group chats can be created without initial members.</p>
                
                {isLoadingTeamMembers ? (
                  <div className="text-center py-4">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Loading team members...</p>
                  </div>
                ) : teamMembers.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-600">No team members found.</p>
                    <p className="text-xs text-gray-500 mt-1">Make sure you're part of a team.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 mb-2">Athletes</h4>
                      <div className="space-y-2">
                        {teamMembers.filter(member => member.type === 'athlete').map((athlete) => (
                          <label key={athlete.id} className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedMembers.includes(athlete.id)}
                              onChange={() => toggleMemberSelection(athlete.id)}
                              className="h-4 w-4 text-blue-500 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-900">{athlete.name}</span>
                          </label>
                        ))}
                        {teamMembers.filter(member => member.type === 'athlete').length === 0 && (
                          <p className="text-xs text-gray-500 italic">No athletes found</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-600 mb-2">Staff</h4>
                      <div className="space-y-2">
                        {teamMembers.filter(member => member.type === 'staff').map((staff) => (
                          <label key={staff.id} className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedMembers.includes(staff.id)}
                              onChange={() => toggleMemberSelection(staff.id)}
                              className="h-4 w-4 text-blue-500 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-900">{staff.name}</span>
                          </label>
                        ))}
                        {teamMembers.filter(member => member.type === 'staff').length === 0 && (
                          <p className="text-xs text-gray-500 italic">No staff members found</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowNewChat(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGroupChat}
                  disabled={!newChatName.trim() || isCreatingGroupChat}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingGroupChat ? (
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    'Create Chat'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Members Modal */}
      {showAddMembersModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Add Members</h3>
                <button
                  onClick={() => setShowAddMembersModal(false)}
                  className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">
                  Add members to "{selectedMessageData?.name}" group chat
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Members to Add
                </label>
                
                {isLoadingTeamMembers ? (
                  <div className="text-center py-4">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Loading team members...</p>
                  </div>
                ) : teamMembers.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-600">No team members found.</p>
                    <p className="text-xs text-gray-500 mt-1">Make sure you're part of a team.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 mb-2">Athletes</h4>
                      <div className="space-y-2">
                        {teamMembers.filter(member => member.type === 'athlete').map((athlete) => (
                          <label key={athlete.id} className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedMembers.includes(athlete.id)}
                              onChange={() => toggleMemberSelection(athlete.id)}
                              className="h-4 w-4 text-blue-500 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-900">{athlete.name}</span>
                          </label>
                        ))}
                        {teamMembers.filter(member => member.type === 'athlete').length === 0 && (
                          <p className="text-xs text-gray-500 italic">No athletes found</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-600 mb-2">Staff</h4>
                      <div className="space-y-2">
                        {teamMembers.filter(member => member.type === 'staff').map((staff) => (
                          <label key={staff.id} className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedMembers.includes(staff.id)}
                              onChange={() => toggleMemberSelection(staff.id)}
                              className="h-4 w-4 text-blue-500 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-900">{staff.name}</span>
                          </label>
                        ))}
                        {teamMembers.filter(member => member.type === 'staff').length === 0 && (
                          <p className="text-xs text-gray-500 italic">No staff members found</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowAddMembersModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMembers}
                  disabled={selectedMembers.length === 0 || isAddingMembers}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAddingMembers ? (
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    `Add ${selectedMembers.length > 0 ? selectedMembers.length : ''} Member${selectedMembers.length !== 1 ? 's' : ''}`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {showDeleteModal && conversationToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-scale-in">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Delete Conversation</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <p className="text-gray-600 mb-2">
                Are you sure you want to delete <span className="font-semibold">"{conversationToDelete.name}"</span>?
              </p>
              <p className="text-sm text-gray-500">
                This will permanently remove all messages in this conversation.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setConversationToDelete(null)
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteConversation}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-2xl transition-all duration-300 transform hover:scale-105"
              >
                Delete Conversation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-scale-in">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Success!</h3>
                  <p className="text-sm text-gray-500">Operation completed</p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <p className="text-gray-600">{successMessage}</p>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex items-center justify-end">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl transition-all duration-300 transform hover:scale-105"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}