'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Search, Send, Plus, X, Users, MoreVertical } from 'lucide-react'
import MainNavigation from '@/components/navigation/MainNavigation'

// Mock data for messages
const mockMessages = [
  {
    id: 1,
    name: 'Sarah Johnson',
    lastMessage: 'Great session today! Feeling stronger already.',
    time: '1 hour ago',
    unread: true,
    avatar: 'SJ',
    type: 'athlete'
  },
  {
    id: 2,
    name: 'Mike Chen',
    lastMessage: 'Can we discuss the new training schedule?',
    time: '2 hours ago',
    unread: false,
    avatar: 'MC',
    type: 'athlete'
  },
  {
    id: 3,
    name: 'Emma Davis',
    lastMessage: 'Team meeting tomorrow at 3 PM confirmed.',
    time: '3 hours ago',
    unread: false,
    avatar: 'ED',
    type: 'athlete'
  },
  {
    id: 4,
    name: 'Alex Thompson',
    lastMessage: 'New workout plan looks challenging!',
    time: '1 day ago',
    unread: false,
    avatar: 'AT',
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
  }
]

// Mock conversations
const mockConversations = {
  1: [
    { id: 1, sender: 'Sarah Johnson', message: 'Hi Coach!', time: '2 hours ago', isCoach: false },
    { id: 2, sender: 'Coach', message: 'Hello Sarah! How are you feeling today?', time: '2 hours ago', isCoach: true },
    { id: 3, sender: 'Sarah Johnson', message: 'Great session today! Feeling stronger already.', time: '1 hour ago', isCoach: false },
    { id: 4, sender: 'Coach', message: 'That\'s fantastic! Your form has improved significantly. Keep up the great work!', time: '1 hour ago', isCoach: true },
    { id: 5, sender: 'Sarah Johnson', message: 'Thank you! When should I expect the next workout plan?', time: '30 minutes ago', isCoach: false }
  ],
  2: [
    { id: 1, sender: 'Mike Chen', message: 'Coach, I have a question about the training schedule', time: '3 hours ago', isCoach: false },
    { id: 2, sender: 'Coach', message: 'Of course! What would you like to know?', time: '3 hours ago', isCoach: true },
    { id: 3, sender: 'Mike Chen', message: 'Can we discuss the new training schedule?', time: '2 hours ago', isCoach: false }
  ],
  3: [
    { id: 1, sender: 'Emma Davis', message: 'Team meeting tomorrow at 3 PM confirmed.', time: '3 hours ago', isCoach: false }
  ],
  4: [
    { id: 1, sender: 'Alex Thompson', message: 'New workout plan looks challenging!', time: '1 day ago', isCoach: false },
    { id: 2, sender: 'Coach', message: 'It is! But I know you can handle it. Let me know if you need any modifications.', time: '1 day ago', isCoach: true }
  ],
  5: [
    { id: 1, sender: 'Coach Johnson', message: 'Great work everyone! Keep pushing yourselves!', time: '2 days ago', isCoach: true },
    { id: 2, sender: 'Sarah Johnson', message: 'Thanks Coach!', time: '2 days ago', isCoach: false },
    { id: 3, sender: 'Mike Chen', message: 'Appreciate it!', time: '2 days ago', isCoach: false }
  ]
}

// Mock athletes and staff for new chat
const mockAthletes = [
  { id: 1, name: 'Sarah Johnson', type: 'athlete' },
  { id: 2, name: 'Mike Chen', type: 'athlete' },
  { id: 3, name: 'Emma Davis', type: 'athlete' },
  { id: 4, name: 'Alex Thompson', type: 'athlete' },
  { id: 5, name: 'Jordan Lee', type: 'athlete' },
  { id: 6, name: 'Taylor Wilson', type: 'athlete' }
]

const mockStaff = [
  { id: 101, name: 'Dr. Smith', type: 'staff' },
  { id: 102, name: 'Coach Martinez', type: 'staff' },
  { id: 103, name: 'Nutritionist Brown', type: 'staff' }
]

export default function MessagesPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMessage, setSelectedMessage] = useState<number | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)
  const [newChatName, setNewChatName] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<number[]>([])

  const filteredMessages = mockMessages.filter(message =>
    message.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedMessage) {
      // Here you would typically send the message to your backend
      console.log('Sending message:', newMessage)
      setNewMessage('')
    }
  }

  const handleCreateGroupChat = () => {
    if (newChatName.trim() && selectedMembers.length > 0) {
      // Here you would typically create the group chat in your backend
      console.log('Creating group chat:', { name: newChatName, members: selectedMembers })
      setShowNewChat(false)
      setNewChatName('')
      setSelectedMembers([])
    }
  }

  const toggleMemberSelection = (memberId: number) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }

  const currentConversation = selectedMessage ? mockConversations[selectedMessage as keyof typeof mockConversations] : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <MainNavigation />
      
      <div className="container-responsive py-6">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="flex h-[calc(100vh-200px)]">
            {/* Messages List */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
                  {user?.role === 'coach' && (
                    <button
                      onClick={() => setShowNewChat(true)}
                      className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  )}
                </div>
                
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                  />
                </div>
              </div>

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto">
                {filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    onClick={() => setSelectedMessage(message.id)}
                    className={`p-4 border-b border-gray-100 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                      selectedMessage === message.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">{message.avatar}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900 truncate">{message.name}</h3>
                          <span className="text-xs text-gray-500">{message.time}</span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{message.lastMessage}</p>
                        {message.unread && (
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                            <span className="text-xs text-blue-600 font-medium">New</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedMessage ? (
                <>
                  {/* Chat Header */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {mockMessages.find(m => m.id === selectedMessage)?.avatar}
                          </span>
                        </div>
                        <div>
                          <h2 className="font-semibold text-gray-900">
                            {mockMessages.find(m => m.id === selectedMessage)?.name}
                          </h2>
                          <p className="text-sm text-gray-500">Active now</p>
                        </div>
                      </div>
                      <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {currentConversation.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.isCoach ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                            msg.isCoach
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{msg.message}</p>
                          <p className={`text-xs mt-1 ${
                            msg.isCoach ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {msg.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="p-6 border-t border-gray-200">
                    <div className="flex items-center space-x-3">
                      <input
                        type="text"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a conversation</h3>
                    <p className="text-gray-500">Choose a message from the list to start chatting</p>
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
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Create Group Chat</h3>
                <button
                  onClick={() => setShowNewChat(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
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
                  Select Members
                </label>
                
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Athletes</h4>
                    <div className="space-y-2">
                      {mockAthletes.map((athlete) => (
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
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Staff</h4>
                    <div className="space-y-2">
                      {mockStaff.map((staff) => (
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
                    </div>
                  </div>
                </div>
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
                  disabled={!newChatName.trim() || selectedMembers.length === 0}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 