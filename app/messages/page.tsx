'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useAppState } from '@/contexts/AppStateContext'
import { 
  getChatMessages, 
  sendChatMessage, 
  subscribeToMessages, 
  addMessageToList, 
  unsubscribeFromMessages,
  updateChatListWithNewMessage,
  getChatMembers,
  addMembersToChat,
  canManageChatMembers,
  getAvailableUsersForChat,
  createChat,
  deleteChat,
  generateAvatar,
  formatTimeAgo,
  ChatData,
  MessageData,
  ChatMemberDisplay,
  isCoachOrAssistant
} from '@/lib/utils'
import { Search, Send, Plus, X, Users, MoreVertical, ArrowLeft, MessageCircle, Hash, Trash2, UserPlus } from 'lucide-react'
import FirebirdLogo from '@/components/ui/FirebirdLogo'
import MainNavigation from '@/components/navigation/MainNavigation'
import { ChatItemSkeleton } from '@/components/ui/SkeletonLoader'
import MemberSelector from '@/components/ui/MemberSelector'

export default function MessagesPage() {
  const { user } = useAuth()
  const { 
    chats, 
    isLoadingChats, 
    chatsError,
    refreshChats,
    updateChats
  } = useAppState()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)
  const [newChatName, setNewChatName] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)
  
  // Local chat data
  const [messages, setMessages] = useState<MessageData[]>([])
  const [chatMembers, setChatMembers] = useState<ChatMemberDisplay[]>([])
  
  // Loading states
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [isCreatingChat, setIsCreatingChat] = useState(false)
  const [isAddingMembers, setIsAddingMembers] = useState(false)
  
  // UI states
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false)
  const [showAddMembersModal, setShowAddMembersModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [chatToDelete, setChatToDelete] = useState<ChatData | null>(null)
  const [isDeletingChat, setIsDeletingChat] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  
  const [selectedMembersToAdd, setSelectedMembersToAdd] = useState<string[]>([])
  const [chatToAddMembers, setChatToAddMembers] = useState<ChatData | null>(null)
  
  // Permission states
  const [canManageMembers, setCanManageMembers] = useState(false)
  
  // Real-time subscription
  const subscriptionRef = useRef<any>(null)

  // Chats are now loaded by AppState context

  // Set up real-time subscription when chats are loaded
  useEffect(() => {
    if (chats.length === 0 || !user?.id) return

    // Clean up previous subscription
    if (subscriptionRef.current) {
      unsubscribeFromMessages(subscriptionRef.current)
    }

    // Set up new subscription
    subscriptionRef.current = subscribeToMessages(
      chats,
      (newMessage: MessageData) => {
        console.log('Real-time message received:', newMessage)
        
        // Update messages list if the message is for the current chat
        setMessages(prev => addMessageToList(prev, newMessage, selectedChatId || ''))

        // Update chat list with new last message
        updateChats(updateChatListWithNewMessage(chats, newMessage.chat_id, newMessage))
      }
    )

    // Cleanup on dependency change
    return () => {
      if (subscriptionRef.current) {
        unsubscribeFromMessages(subscriptionRef.current)
      }
    }
  }, [chats, selectedChatId, user?.id])

  // Load messages when a chat is selected
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedChatId) return
      
      setIsLoadingMessages(true)
      try {
        const chatMessages = await getChatMessages(selectedChatId)
        setMessages(chatMessages)
      } catch (error) {
        console.error('Failed to load messages:', error)
        setMessages([])
      } finally {
        setIsLoadingMessages(false)
      }
    }

    loadMessages()
  }, [selectedChatId])

  // Load chat members when a chat is selected
  useEffect(() => {
    const loadChatMembers = async () => {
      if (!selectedChatId) return
      
      try {
        const members = await getChatMembers(selectedChatId)
        setChatMembers(members)
      } catch (error) {
        console.error('Failed to load chat members:', error)
        setChatMembers([])
      }
    }

    loadChatMembers()
  }, [selectedChatId])

  // Check permissions for member management
  useEffect(() => {
    const checkPermissions = async () => {
      if (!selectedChatId || !user?.id) {
        setCanManageMembers(false)
        return
      }
      
      try {
        const canManage = await canManageChatMembers(selectedChatId, user.id)
        setCanManageMembers(canManage)
      } catch (error) {
        console.error('Failed to check permissions:', error)
        setCanManageMembers(false)
      }
    }

    checkPermissions()
  }, [selectedChatId, user?.id])

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

  // Cleanup subscription when component unmounts
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        unsubscribeFromMessages(subscriptionRef.current)
      }
    }
  }, [])

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedChat = selectedChatId ? chats.find(c => c.id === selectedChatId) : null

  // Send message handler
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChatId || !user?.id || isSendingMessage) {
      return
    }

    setIsSendingMessage(true)

    try {
      // Send message to database
      const sentMessage = await sendChatMessage(selectedChatId, user.id, newMessage)

      // Update messages list immediately (optimistic update)
      setMessages(prev => addMessageToList(prev, sentMessage, selectedChatId))

      // Update chat list with new last message
      updateChats(updateChatListWithNewMessage(chats, selectedChatId, sentMessage))

      // Clear input field
      setNewMessage('')

    } catch (error) {
      console.error('Failed to send message:', error)
      setSuccessMessage('Failed to send message. Please try again.')
      setShowSuccessModal(true)
    } finally {
      setIsSendingMessage(false)
    }
  }

  // Create new chat
  const handleCreateChat = async () => {
    if (!newChatName.trim() || !user?.id) {
      return
    }

    setIsCreatingChat(true)

    try {
      const result = await createChat(user.id, newChatName.trim(), selectedMembersToAdd)
      
      if (result.success) {
        // Refresh chats after creation using AppState
        await refreshChats()
        
        // Close modal and reset form
        setShowNewChat(false)
        setNewChatName('')
        setSelectedMembersToAdd([])
        
        setSuccessMessage(`Chat "${newChatName}" created successfully!`)
        setShowSuccessModal(true)
      } else {
        setSuccessMessage(result.error || 'Failed to create chat. Please try again.')
        setShowSuccessModal(true)
      }
    } catch (error) {
      console.error('Error creating chat:', error)
      setSuccessMessage('Failed to create chat. Please try again.')
      setShowSuccessModal(true)
    } finally {
      setIsCreatingChat(false)
    }
  }


  // Open add members modal
  const handleOpenAddMembersModal = (chat: ChatData) => {
    if (!user?.id) return

    setChatToAddMembers(chat)
    setSelectedMembersToAdd([])
    setShowAddMembersModal(true)
  }

  // Add members to chat
  const handleAddMembers = async () => {
    if (!chatToAddMembers || !user?.id || selectedMembersToAdd.length === 0) {
      return
    }

    setIsAddingMembers(true)

    try {
      const result = await addMembersToChat(chatToAddMembers.id, selectedMembersToAdd, user.id)
      
      if (result.success) {
        // Refresh chats to show updated member count
        await refreshChats()
        
        // Close modal and reset
        setShowAddMembersModal(false)
        setChatToAddMembers(null)
        setSelectedMembersToAdd([])
        
        setSuccessMessage(`Successfully added ${selectedMembersToAdd.length} member${selectedMembersToAdd.length !== 1 ? 's' : ''} to the chat!`)
        setShowSuccessModal(true)
      } else {
        setSuccessMessage(result.error || 'Failed to add members to chat.')
        setShowSuccessModal(true)
      }
    } catch (error) {
      console.error('Error adding members to chat:', error)
      setSuccessMessage('Failed to add members to chat. Please try again.')
      setShowSuccessModal(true)
    } finally {
      setIsAddingMembers(false)
    }
  }

  // Delete chat
  const handleDeleteChat = async () => {
    if (!chatToDelete || !user?.id) {
      return
    }

    setIsDeletingChat(true)

    try {
      const result = await deleteChat(chatToDelete.id, user.id)
      
      if (result.success) {
        // Clear selected chat if it was the deleted one
        if (selectedChatId === chatToDelete.id) {
          setSelectedChatId(null)
          setMessages([])
          setChatMembers([])
        }
        
        // Clean up real-time subscription for the deleted chat
        if (subscriptionRef.current) {
          unsubscribeFromMessages(subscriptionRef.current)
          subscriptionRef.current = null
        }
        
        // Refresh chats from AppState to ensure consistency
        await refreshChats()
        
        // Close modal and reset
        setShowDeleteModal(false)
        setChatToDelete(null)
        
        setSuccessMessage('Chat deleted successfully!')
        setShowSuccessModal(true)
      } else {
        setSuccessMessage(result.error || 'Failed to delete chat')
        setShowSuccessModal(true)
      }
    } catch (error) {
      console.error('Failed to delete chat:', error)
      setSuccessMessage('Failed to delete chat. Please try again.')
      setShowSuccessModal(true)
    } finally {
      setIsDeletingChat(false)
    }
  }

  // Open delete confirmation modal
  const handleOpenDeleteModal = (chat: ChatData) => {
    setChatToDelete(chat)
    setShowDeleteModal(true)
    setShowOptionsDropdown(false)
  }


  // Redirect to login if no user (with small delay to allow auth restoration)
  useEffect(() => {
    if (!user) {
      const redirectTimeout = setTimeout(() => {
        router.push('/login')
      }, 150)
      return () => clearTimeout(redirectTimeout)
    }
  }, [user, router])

  // Show nothing briefly if no user to prevent flash
  if (!user) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50" />
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

          {isCoachOrAssistant(user?.role) && (
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
            {/* Chat List */}
            <div className={`w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col ${selectedChatId ? 'hidden lg:flex' : 'flex'}`}>
              {/* Chat List Header */}
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

              {/* Chat List */}
              <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50/50 to-white">
                {isLoadingChats && chats.length === 0 ? (
                  <div className="space-y-0">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <ChatItemSkeleton key={i} />
                    ))}
                  </div>
                ) : chatsError ? (
                  <div className="text-center py-8">
                    <div className="text-red-500 mb-4">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold">Error Loading Chats</h3>
                      <p className="text-sm text-gray-600">{chatsError}</p>
                      <button 
                        onClick={refreshChats}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                ) : filteredChats.length > 0 ? (
                  filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChatId(chat.id)}
                    className={`group p-3 sm:p-4 border-b border-gray-100 cursor-pointer transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-blue-100/80 ${
                      selectedChatId === chat.id 
                        ? 'bg-gradient-to-r from-blue-100 to-blue-200 border-blue-300 shadow-sm ring-2 ring-blue-300' 
                        : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 ${
                        chat.memberCount > 2 
                          ? 'bg-gradient-to-br from-purple-500 to-purple-600' 
                          : 'bg-gradient-to-br from-blue-500 to-blue-600'
                      } ${chat.unread ? 'ring-2 ring-blue-300' : ''}`}>
                        {chat.memberCount > 2 ? (
                          <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        ) : (
                          <span className="text-white font-bold text-sm sm:text-base">
                            {generateAvatar(chat.name)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-bold text-gray-900 truncate text-sm sm:text-base">{chat.name}</h3>
                            {chat.memberCount > 2 && (
                              <Hash className="h-3 w-3 text-purple-500" />
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {chat.unread && (
                              <div className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
                                New
                              </div>
                            )}
                            {isCoachOrAssistant(user?.role) && (
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleOpenAddMembersModal(chat)
                                  }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-blue-100 rounded-full"
                                  title="Add members"
                                >
                                  <UserPlus className="h-4 w-4 text-blue-500 hover:text-blue-700" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleOpenDeleteModal(chat)
                                  }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-red-100 rounded-full"
                                  title="Delete chat"
                                >
                                  <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
                                </button>
                              </div>
                            )}
                            <span className="text-xs text-gray-500 font-medium">
                              {chat.lastMessageTime ? formatTimeAgo(chat.lastMessageTime) : 'No messages'}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 truncate mb-1 sm:mb-2">
                          {chat.lastMessage || 'No messages yet'}
                        </p>
                        {chat.unread && (
                          <div className="flex items-center space-x-2">
                            <span className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></span>
                            <span className="text-xs text-blue-600 font-bold">New message</span>
                          </div>
                        )}
                        {chat.memberCount > 2 && (
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
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">No chats found</h4>
                    <p className="text-gray-600">
                      {searchTerm ? 'No conversations match your search.' : 'Start a conversation with your team members.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col bg-gradient-to-b from-gray-50/30 to-white min-h-0 ${selectedChatId ? 'flex' : 'hidden lg:flex'}`}>
              {selectedChatId ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        {/* Mobile Back Button */}
                        <button
                          onClick={() => setSelectedChatId(null)}
                          className="lg:hidden p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
                        >
                          <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-2xl flex items-center justify-center shadow-lg ${
                          (selectedChat?.memberCount || 0) > 2 
                            ? 'bg-gradient-to-br from-purple-500 to-purple-600' 
                            : 'bg-gradient-to-br from-blue-500 to-blue-600'
                        }`}>
                          {(selectedChat?.memberCount || 0) > 2 ? (
                            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                          ) : (
                            <span className="text-white font-bold text-sm sm:text-base">
                              {generateAvatar(selectedChat?.name || '')}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h2 className="font-bold text-gray-900 text-base sm:text-lg">
                              {selectedChat?.name}
                            </h2>
                            {(selectedChat?.memberCount || 0) > 2 && (
                              <Hash className="h-4 w-4 text-purple-500" />
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
                            <p className="text-xs sm:text-sm text-gray-600 font-medium">
                              {(selectedChat?.memberCount || 0) > 2 ? `${chatMembers.length} members` : 'Direct chat'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Chat Actions */}
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <div className="relative">
                          <button 
                            onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}
                            className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
                          >
                            <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>
                          
                          {/* Dropdown Menu */}
                          {showOptionsDropdown && canManageMembers && (selectedChat?.memberCount || 0) > 2 && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                              <button
                                onClick={() => handleOpenAddMembersModal(selectedChat!)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
                              >
                                <Users className="h-4 w-4" />
                                <span>Add Members</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Chat Members (for group chats) */}
                    {(selectedChat?.memberCount || 0) > 2 && chatMembers.length > 0 && (
                      <div className="mt-4 flex items-center space-x-2">
                        <div className="flex -space-x-2">
                          {chatMembers.slice(0, 5).map(member => (
                            <div key={member.id} className="h-6 w-6 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-xs font-bold">
                              {member.avatar ? (
                                <img src={member.avatar} alt={member.name} className="h-full w-full rounded-full" />
                              ) : (
                                generateAvatar(member.name)
                              )}
                            </div>
                          ))}
                          {chatMembers.length > 5 && (
                            <div className="h-6 w-6 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center text-xs font-bold text-white">
                              +{chatMembers.length - 5}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {chatMembers.map(m => m.name).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-gray-50/50 to-white">
                    {isLoadingMessages ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                          <p className="text-gray-600">Loading messages...</p>
                        </div>
                      </div>
                    ) : messages.length > 0 ? (
                      messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender.id === user.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-6 py-4 rounded-3xl shadow-lg transition-all duration-300 hover:shadow-xl ${
                            msg.sender.id === user.id
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                              : 'bg-white text-gray-900 border-2 border-gray-100 shadow-md'
                          }`}
                        >
                          {msg.sender.id !== user.id && (
                            <div className="text-xs font-medium text-gray-500 mb-1">
                              {msg.sender.name}
                              {msg.isCoach && <span className="ml-1 text-purple-500">(Coach)</span>}
                            </div>
                          )}
                          <p className="text-sm leading-relaxed">{msg.message}</p>
                          <div className={`flex items-center justify-between mt-2 ${
                            msg.sender.id === user.id ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            <span className="text-xs font-medium">
                              {formatTimeAgo(msg.created_at)}
                            </span>
                            {msg.sender.id === user.id && (
                              <span className="text-xs">✓✓</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
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
                        className="p-3 sm:p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 touch-manipulation"
                      >
                        {isSendingMessage ? (
                          <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50/50 to-white">
                  <div className="text-center max-w-md px-4">
                    <div className="h-16 w-16 sm:h-20 sm:w-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                      <MessageCircle className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Select a conversation</h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Choose a chat from the list to start messaging with your team</p>
                    {isCoachOrAssistant(user?.role) && (
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
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Create Chat</h3>
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

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowNewChat(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateChat}
                  disabled={!newChatName.trim() || isCreatingChat}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingChat ? (
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


      {/* Success Modal */}
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

      {/* Delete Chat Confirmation Modal */}
      {showDeleteModal && chatToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-scale-in">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Delete Chat</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete the chat <span className="font-semibold">"{chatToDelete.name}"</span>?
              </p>
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">
                <strong>Warning:</strong> This will permanently delete the chat and all messages. All members will lose access to this conversation.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setChatToDelete(null)
                }}
                disabled={isDeletingChat}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteChat}
                disabled={isDeletingChat}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isDeletingChat ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Chat</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Members Modal */}
      {showAddMembersModal && chatToAddMembers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col animate-scale-in">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserPlus className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Add Members</h3>
                  <p className="text-sm text-gray-500">Add members to "{chatToAddMembers.name}"</p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <MemberSelector
                selectedMembers={selectedMembersToAdd}
                onMemberToggle={(memberId) => {
                  setSelectedMembersToAdd(prev => 
                    prev.includes(memberId) 
                      ? prev.filter(id => id !== memberId)
                      : [...prev, memberId]
                  )
                }}
                onMembersChange={setSelectedMembersToAdd}
                userId={user?.id || ''}
                title="Select Members to Add"
                description="Choose team members to add to this chat"
              />
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddMembersModal(false)
                  setChatToAddMembers(null)
                  setSelectedMembersToAdd([])
                }}
                disabled={isAddingMembers}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMembers}
                disabled={isAddingMembers || selectedMembersToAdd.length === 0}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isAddingMembers ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>
                      {selectedMembersToAdd.length > 0 
                        ? `Add ${selectedMembersToAdd.length} Member${selectedMembersToAdd.length !== 1 ? 's' : ''}`
                        : 'Add Members'
                      }
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}