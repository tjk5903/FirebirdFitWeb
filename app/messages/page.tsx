'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getTeamMessages, getConversationMessages, sendMessage, createGroupChat, addMembersToGroupChat } from '@/lib/utils'
import { Search, Send, Plus, X, Users, MoreVertical, ArrowLeft } from 'lucide-react'
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
  const [selectedMessage, setSelectedMessage] = useState<number | null>(null)
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

  const filteredMessages = messages.filter(message =>
    message.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedMessage || !user) {
      return
    }

    // Get the conversation ID for the selected message
    const selectedMsg = messages.find((msg: any) => msg.id === selectedMessage.toString())
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
        console.error('Failed to send message:', result.error)
        alert(`Failed to send message: ${result.error}`)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('An error occurred while sending the message')
    } finally {
      setIsSendingMessage(false)
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
        
        // Show success message
        const memberText = selectedMembers.length > 0 
          ? ` with ${selectedMembers.length} member(s)` 
          : ' (no members added yet)'
        alert(`Group chat "${newChatName}" created successfully!${memberText}`)
      } else {
        alert(`Failed to create group chat: ${result.error}`)
      }
    } catch (error) {
      console.error('Error creating group chat:', error)
      alert('An error occurred while creating the group chat')
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

  // Load conversation messages when a message is selected
  useEffect(() => {
    const loadConversation = async () => {
      if (!selectedMessage) return
      
      const selectedMsg = messages.find((msg: any) => msg.id === selectedMessage.toString())
      if (!selectedMsg) return
      
      try {
        const conversationMessages = await getConversationMessages(selectedMsg.conversationId)
        setConversations((prev: any) => ({
          ...prev,
          [selectedMessage]: conversationMessages
        }))
      } catch (error) {
        console.error('Error loading conversation:', error)
        // Fallback to mock conversations if available
        if (mockConversations[selectedMessage as keyof typeof mockConversations]) {
          setConversations((prev: any) => ({
            ...prev,
            [selectedMessage]: mockConversations[selectedMessage as keyof typeof mockConversations]
          }))
        }
      }
    }

    loadConversation()
  }, [selectedMessage, messages])

  const currentConversation = selectedMessage ? conversations[selectedMessage] || [] : []

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
                    onClick={() => setSelectedMessage(parseInt(message.id))}
                    className={`group p-3 sm:p-4 border-b border-gray-100 cursor-pointer transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-blue-100/80 ${
                                              selectedMessage === parseInt(message.id) ? 'bg-gradient-to-r from-blue-100 to-blue-200 border-blue-300 shadow-sm' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className={`h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 ${
                        message.unread ? 'ring-2 ring-blue-300' : ''
                      }`}>
                        <span className="text-white font-bold text-sm sm:text-base">{message.avatar}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold text-gray-900 truncate text-sm sm:text-base">{message.name}</h3>
                          <span className="text-xs text-gray-500 font-medium">{message.time}</span>
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
                            <Users className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">Group chat</span>
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
                                                 <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                           <span className="text-white font-bold text-sm sm:text-base">
                             {messages.find(m => m.id === selectedMessage.toString())?.avatar}
                           </span>
                         </div>
                         <div>
                           <h2 className="font-bold text-gray-900 text-base sm:text-lg">
                             {messages.find(m => m.id === selectedMessage.toString())?.name}
                           </h2>
                          <div className="flex items-center space-x-2">
                            <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
                            <p className="text-xs sm:text-sm text-gray-600 font-medium">Active now</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <button className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200">
                          <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                        <button className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200">
                          <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-gray-50/50 to-white">
                    {currentConversation.length > 0 ? (
                      currentConversation.map((msg: any) => (
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
                    ))
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                          <p className="text-gray-600">Loading conversation...</p>
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
                      <Search className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
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
    </div>
  )
}