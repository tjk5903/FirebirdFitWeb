'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { useAppState } from '@/contexts/AppStateContext'
import { useTeamContext } from '@/contexts/TeamContext'
import { LoadingCard, ErrorMessage } from '@/components/ui/LoadingSpinner'
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
  isCoachOrAssistant,
  toggleMessageReaction,
  ReactionType
} from '@/lib/utils'
import { Search, Send, Plus, X, Users, ArrowLeft, MessageCircle, Hash, Trash2, UserPlus, ThumbsUp, ThumbsDown } from 'lucide-react'
import FirebirdLogo from '@/components/ui/FirebirdLogo'
import MainNavigation from '@/components/navigation/MainNavigation'
import { ChatItemSkeleton } from '@/components/ui/SkeletonLoader'
import MemberSelector from '@/components/ui/MemberSelector'

export default function MessagesPage() {
  const { user } = useAuth()
  const { selectedTeamId } = useTeamContext()
  const { showToast } = useToast()
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
  const [newChatAnnouncementMode, setNewChatAnnouncementMode] = useState(false)
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

  const searchParams = useSearchParams()
  const chatFromQuery = searchParams?.get('chat') || null

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
        const chatMessages = await getChatMessages(selectedChatId, user?.id)
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

  const filteredChats = chats.filter(chat => {
    // Filter by selected team if teamId is available
    if (selectedTeamId && chat.teamId && chat.teamId !== selectedTeamId) {
      return false
    }
    // Filter by search term
    return chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const selectedChat = selectedChatId ? chats.find(c => c.id === selectedChatId) : null
  const isAnnouncementLocked = !!(selectedChat?.announcementMode && selectedChat.ownerId && selectedChat.ownerId !== user?.id)

  // Auto-select chat from query param when available
  useEffect(() => {
    if (!chatFromQuery || chats.length === 0) return
    const exists = chats.find(chat => chat.id === chatFromQuery)
    if (exists) {
      setSelectedChatId(chatFromQuery)
    }
  }, [chatFromQuery, chats])

  // Send message handler
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChatId || !user?.id || isSendingMessage) {
      return
    }

    if (isAnnouncementLocked) {
      showToast('Only the coach who created this chat can send announcements.', 'warning')
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
      showToast('Failed to send message. Please try again.', 'error')
    } finally {
      setIsSendingMessage(false)
    }
  }

  // Create new chat
  const handleCreateChat = async () => {
    console.log('💬 handleCreateChat: Function called!')
    console.log('💬 handleCreateChat: Chat name:', newChatName)
    console.log('💬 handleCreateChat: User:', user)
    console.log('💬 handleCreateChat: Selected members:', selectedMembersToAdd)
    
    if (!newChatName.trim() || !user?.id) {
      console.log('🚨 handleCreateChat: Validation failed:', {
        chatName: newChatName.trim(),
        userId: user?.id
      })
      showToast('Please enter a chat name', 'warning')
      return
    }

    console.log('🚀 handleCreateChat: Starting chat creation...')
    setIsCreatingChat(true)

    try {
      if (!selectedTeamId) {
        showToast('Please select a team first', 'warning')
        setIsCreatingChat(false)
        return
      }

      console.log('📞 handleCreateChat: Calling createChat function...')
      const result = await createChat(user.id, selectedTeamId, newChatName.trim(), selectedMembersToAdd, newChatAnnouncementMode)
      console.log('📊 handleCreateChat: Create result:', result)
      
      if (result.success) {
        console.log('✅ handleCreateChat: Chat created successfully!')
        
        // Refresh chats after creation using AppState
        console.log('🔄 handleCreateChat: Refreshing chats...')
        await refreshChats()
        
        // Close modal and reset form
        setShowNewChat(false)
        setNewChatName('')
        setSelectedMembersToAdd([])
        setNewChatAnnouncementMode(false)
        
        showToast(`Chat "${newChatName}" created successfully!`, 'success')
      } else {
        console.error('❌ handleCreateChat: Chat creation failed:', result.error)
        showToast(result.error || 'Failed to create chat. Please try again.', 'error')
      }
    } catch (error) {
      console.error('💥 handleCreateChat: Error creating chat:', error)
      showToast('Failed to create chat. Please try again.', 'error')
    } finally {
      console.log('🏁 handleCreateChat: Setting isCreatingChat to false')
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
        
        showToast(`Successfully added ${selectedMembersToAdd.length} member${selectedMembersToAdd.length !== 1 ? 's' : ''} to the chat!`, 'success')
      } else {
        showToast(result.error || 'Failed to add members to chat.', 'error')
      }
    } catch (error) {
      console.error('Error adding members to chat:', error)
      showToast('Failed to add members to chat. Please try again.', 'error')
    } finally {
      setIsAddingMembers(false)
    }
  }

  const handleReaction = async (messageId: string, reaction: ReactionType) => {
    if (!user?.id) return
    try {
      const updatedReactions = await toggleMessageReaction(messageId, user.id, reaction)
      setMessages(prev =>
        prev.map(msg => (msg.id === messageId ? { ...msg, reactions: updatedReactions } : msg))
      )
    } catch (error) {
      console.error('Failed to toggle reaction:', error)
      showToast('Unable to update reaction. Please try again.', 'error')
    }
  }

  // Delete chat
  const handleDeleteChat = async () => {
    if (!chatToDelete || !user?.id) {
      return
    }

    setIsDeletingChat(true)

    try {
      console.log('🗑️ Messages: Starting chat deletion for:', chatToDelete.name)
      const result = await deleteChat(chatToDelete.id, user.id)
      
      if (result.success) {
        console.log('✅ Messages: Chat deletion successful, updating UI')
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
        
        // Immediately update local UI by removing the deleted chat
        console.log('🔄 Messages: Chats before deletion:', chats.length)
        const updatedChats = chats.filter(chat => chat.id !== chatToDelete.id)
        console.log('🔄 Messages: Chats after filtering:', updatedChats.length)
        updateChats(updatedChats)
        
        // Also refresh chats from AppState to ensure consistency
        console.log('🔄 Messages: Calling refreshChats...')
        await refreshChats()
        console.log('✅ Messages: RefreshChats completed')
        
        // Close modal and reset
        setShowDeleteModal(false)
        setChatToDelete(null)
        
        showToast('Chat deleted successfully!', 'success')
      } else {
        console.error('❌ Messages: Chat deletion failed:', result.error)
        showToast(result.error || 'Failed to delete chat', 'error')
      }
    } catch (error) {
      console.error('🚨 Messages: Exception during chat deletion:', error)
      console.error('Failed to delete chat:', error)
      showToast('Failed to delete chat. Please try again.', 'error')
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <MainNavigation />
      
      <div className={`container-responsive py-6 transition-all duration-500 delay-200 ${
        isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4 sm:gap-0">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </button>
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 hidden sm:block"></div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Messages</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Team communication hub</p>
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
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-700">
          <div className="flex flex-col lg:flex-row h-[calc(100vh-300px)]">
            {/* Chat List */}
            <div className={`w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-slate-700 flex flex-col ${selectedChatId ? 'hidden lg:flex' : 'flex'}`}>
              {/* Chat List Header */}
              <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-gray-50 to-white dark:from-slate-800 dark:to-slate-800">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Conversations</h2>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Connect with your team</p>
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
                    className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 border-2 border-gray-200 dark:border-slate-600 rounded-2xl focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 bg-gray-50 dark:bg-slate-700 focus:bg-white dark:focus:bg-slate-700 text-sm sm:text-base text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              {/* Chat List */}
              <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50/50 to-white dark:from-slate-800 dark:to-slate-800">
                {isLoadingChats && chats.length === 0 ? (
                  <LoadingCard count={5} />
                ) : chatsError ? (
                  <div className="p-4">
                    <ErrorMessage 
                      error={chatsError} 
                      onRetry={refreshChats}
                    />
                  </div>
                ) : filteredChats.length > 0 ? (
                  filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChatId(chat.id)}
                    className={`group p-3 sm:p-4 border-b border-gray-100 dark:border-slate-700 cursor-pointer transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-blue-100/80 dark:hover:from-slate-700 dark:hover:to-slate-700 ${
                      selectedChatId === chat.id 
                        ? 'bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 border-blue-300 dark:border-blue-600 shadow-sm ring-2 ring-blue-300 dark:ring-blue-600' 
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
                            <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate text-sm sm:text-base">{chat.name}</h3>
                            {chat.memberCount > 2 && (
                              <Hash className="h-3 w-3 text-purple-500 dark:text-purple-400" />
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
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                              {chat.lastMessageTime ? formatTimeAgo(chat.lastMessageTime) : 'No messages'}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate mb-1 sm:mb-2">
                          {chat.lastMessage || 'No messages yet'}
                        </p>
                        {chat.unread && (
                          <div className="flex items-center space-x-2">
                            <span className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></span>
                            <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">New message</span>
                          </div>
                        )}
                        {chat.memberCount > 2 && (
                          <div className="flex items-center space-x-1 mt-1">
                            <Users className="h-3 w-3 text-purple-400 dark:text-purple-500" />
                            <span className="text-xs text-purple-500 dark:text-purple-400 font-medium">Group chat</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
                ) : (
                  <div className="text-center py-8">
                    <div className="h-16 w-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No chats found</h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      {searchTerm ? 'No conversations match your search.' : 'Start a conversation with your team members.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col bg-gradient-to-b from-gray-50/30 to-white dark:from-slate-800 dark:to-slate-800 min-h-0 ${selectedChatId ? 'flex' : 'hidden lg:flex'}`}>
              {selectedChatId ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-gray-50 to-white dark:from-slate-800 dark:to-slate-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        {/* Mobile Back Button */}
                        <button
                          onClick={() => setSelectedChatId(null)}
                          className="lg:hidden p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-all duration-200"
                        >
                          <ArrowLeft className="h-5 w-5 text-gray-400 dark:text-gray-500" />
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
                            <h2 className="font-bold text-gray-900 dark:text-gray-100 text-base sm:text-lg">
                              {selectedChat?.name}
                            </h2>
                            {(selectedChat?.memberCount || 0) > 2 && (
                              <Hash className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                            )}
                            {selectedChat?.announcementMode && (
                              <span className="text-xs font-semibold text-amber-600 bg-amber-100 dark:bg-amber-500/20 dark:text-amber-200 px-2 py-0.5 rounded-full">
                                Announcement
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium">
                              {(selectedChat?.memberCount || 0) > 2 ? `${chatMembers.length} members` : 'Direct chat'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Chat Actions */}
                      <div className="flex items-center space-x-1 sm:space-x-2" />
                    </div>
                    
                    {/* Chat Members (for group chats) */}
                    {(selectedChat?.memberCount || 0) > 2 && chatMembers.length > 0 && (
                      <div className="mt-4 flex items-center space-x-2">
                        <div className="flex -space-x-2">
                          {chatMembers.slice(0, 5).map(member => (
                            <div key={member.id} className="h-6 w-6 rounded-full bg-gray-300 dark:bg-slate-600 border-2 border-white dark:border-slate-800 flex items-center justify-center text-xs font-bold">
                              {member.avatar ? (
                                <img src={member.avatar} alt={member.name} className="h-full w-full rounded-full" />
                              ) : (
                                generateAvatar(member.name)
                              )}
                            </div>
                          ))}
                          {chatMembers.length > 5 && (
                            <div className="h-6 w-6 rounded-full bg-gray-400 dark:bg-slate-600 border-2 border-white dark:border-slate-800 flex items-center justify-center text-xs font-bold text-white dark:text-gray-300">
                              +{chatMembers.length - 5}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {chatMembers.map(m => m.name).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>

                  {selectedChat?.announcementMode && (
                    <div className="mx-6 mt-4 rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-100">
                      Announcement mode is on. Only the coach who created this chat can post updates. Team members can react with 👍 or 👎 to acknowledge announcements.
                    </div>
                  )}

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-gray-50/50 to-white dark:from-slate-800 dark:to-slate-800">
                    {isLoadingMessages ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                          <p className="text-gray-600 dark:text-gray-300">Loading messages...</p>
                        </div>
                      </div>
                    ) : messages.length > 0 ? (
                      messages.map((msg) => (
                        <div key={msg.id} className="space-y-2">
                          <div
                            className={`flex items-end gap-2 ${msg.sender.id === user.id ? 'justify-end' : 'justify-start'}`}
                          >
                            {msg.sender.id !== user.id && (
                              <div className="h-8 w-8 rounded-full overflow-hidden bg-gradient-to-br from-royal-blue to-blue-600 text-white font-semibold text-xs flex items-center justify-center flex-shrink-0">
                                {msg.sender.avatar ? (
                                  <img 
                                    src={msg.sender.avatar} 
                                    alt={msg.sender.name} 
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span>{generateAvatar(msg.sender.name)}</span>
                                )}
                              </div>
                            )}
                            <div
                              className={`max-w-xs lg:max-w-md px-6 py-4 rounded-3xl shadow-lg transition-all duration-300 hover:shadow-xl ${
                                msg.sender.id === user.id
                                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                                  : 'bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border-2 border-gray-100 dark:border-slate-600 shadow-md'
                              }`}
                            >
                              {msg.sender.id !== user.id && (
                                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                  {msg.sender.name}
                                  {msg.isCoach && <span className="ml-1 text-purple-500 dark:text-purple-400">(Coach)</span>}
                                </div>
                              )}
                              <p className="text-sm leading-relaxed">{msg.message}</p>
                              <div className={`flex items-center justify-between mt-2 ${
                                msg.sender.id === user.id ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                              }`}>
                                <span className="text-xs font-medium">
                                  {formatTimeAgo(msg.created_at)}
                                </span>
                                {msg.sender.id === user.id && (
                                  <span className="text-xs">✓✓</span>
                                )}
                              </div>
                            </div>
                            {msg.sender.id === user.id && (
                              <div className="h-8 w-8 rounded-full overflow-hidden bg-gradient-to-br from-royal-blue to-blue-600 text-white font-semibold text-xs flex items-center justify-center flex-shrink-0">
                                {user?.avatar ? (
                                  <img 
                                    src={user.avatar} 
                                    alt={user.name || 'You'} 
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span>{generateAvatar(user?.name || user?.email || 'You')}</span>
                                )}
                              </div>
                            )}
                          </div>
                          {selectedChat?.announcementMode && (
                            <div className={`flex ${msg.sender.id === user.id ? 'justify-end' : 'justify-start'}`}>
                              <div className="flex items-center gap-2 rounded-full bg-gray-100 dark:bg-slate-700/60 px-3 py-1">
                                {(['thumbs_up', 'thumbs_down'] as ReactionType[]).map((reaction) => {
                                  const counts = msg.reactions?.counts || { thumbs_up: 0, thumbs_down: 0 }
                                  const isActive = msg.reactions?.userReaction === reaction
                                  const Icon = reaction === 'thumbs_up' ? ThumbsUp : ThumbsDown
                                  return (
                                    <button
                                      key={reaction}
                                      type="button"
                                      onClick={() => handleReaction(msg.id, reaction)}
                                      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-colors ${
                                        isActive
                                          ? 'bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200'
                                          : 'border-gray-200 text-gray-600 dark:border-slate-600 dark:text-gray-300 hover:border-blue-400 hover:text-blue-600'
                                      }`}
                                    >
                                      <Icon className="h-3 w-3" />
                                      <span>{counts[reaction]}</span>
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <MessageCircle className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No messages yet</h3>
                          <p className="text-gray-600 dark:text-gray-300">Start the conversation by sending the first message!</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                            placeholder={isAnnouncementLocked ? 'Announcement mode: only the creator can post.' : 'Type your message...'}
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            disabled={isAnnouncementLocked}
                            className={`w-full px-4 sm:px-6 py-3 sm:py-4 border-2 border-gray-200 dark:border-slate-600 rounded-2xl focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 bg-gray-50 dark:bg-slate-700 focus:bg-white dark:focus:bg-slate-700 text-sm sm:text-base text-gray-900 dark:text-gray-100 ${
                              isAnnouncementLocked ? 'cursor-not-allowed opacity-60' : ''
                            }`}
                        />
                      </div>
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || isSendingMessage || isAnnouncementLocked}
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
                <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50/50 to-white dark:from-slate-800 dark:to-slate-800">
                  <div className="text-center max-w-md px-4">
                    <div className="h-16 w-16 sm:h-20 sm:w-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                      <MessageCircle className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3">Select a conversation</h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4 sm:mb-6">Choose a chat from the list to start messaging with your team</p>
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
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Create Chat</h3>
                <button
                  onClick={() => {
                    setShowNewChat(false)
                    setNewChatAnnouncementMode(false)
                  }}
                  className="p-1.5 sm:p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                  placeholder="Enter group name..."
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-2xl focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="mb-6 rounded-2xl border border-gray-200 dark:border-slate-700 p-4 flex items-start justify-between gap-4 bg-gray-50 dark:bg-slate-700/40">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Announcement mode</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Only you can post updates. Everyone else can react with 👍 or 👎.
                  </p>
                </div>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={newChatAnnouncementMode}
                    onChange={(e) => setNewChatAnnouncementMode(e.target.checked)}
                  />
                  <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:bg-blue-500 relative transition-colors">
                    <div className={`absolute top-1 left-1 h-4 w-4 bg-white rounded-full transition-transform ${newChatAnnouncementMode ? 'translate-x-6' : ''}`}></div>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowNewChat(false)
                    setNewChatAnnouncementMode(false)
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
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
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md animate-scale-in">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">Success!</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Operation completed</p>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <p className="text-gray-600 dark:text-gray-300">{successMessage}</p>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-200 dark:border-slate-700 flex items-center justify-end">
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
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md animate-scale-in">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                    <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">Delete Chat</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone</p>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Are you sure you want to delete the chat <span className="font-semibold">"{chatToDelete.name}"</span>?
                </p>
                <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">
                  <strong>Warning:</strong> This will permanently delete the chat and all messages. All members will lose access to this conversation.
                </p>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-200 dark:border-slate-700 flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setChatToDelete(null)
                  }}
                  disabled={isDeletingChat}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors disabled:opacity-50"
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
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col animate-scale-in">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100">Add Members</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Add members to "{chatToAddMembers.name}"</p>
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
                teamId={selectedTeamId || ''}
                title="Select Members to Add"
                description="Choose team members to add to this chat"
              />
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-slate-700 flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddMembersModal(false)
                  setChatToAddMembers(null)
                  setSelectedMembersToAdd([])
                }}
                disabled={isAddingMembers}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors disabled:opacity-50"
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