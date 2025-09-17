import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "./supabaseClient"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type UserRole = 'coach' | 'athlete' | 'assistant_coach'

// Permission helper functions
export const canCreateTeams = (userRole: UserRole): boolean => {
  return userRole === 'coach'
}

export const canCreateGroupChats = (userRole: UserRole): boolean => {
  return userRole === 'coach' || userRole === 'assistant_coach'
}

export const canAddEvents = (userRole: UserRole): boolean => {
  return userRole === 'coach' || userRole === 'assistant_coach'
}

export const canCreateWorkouts = (userRole: UserRole): boolean => {
  return userRole === 'coach' || userRole === 'assistant_coach'
}

export const canManageTeam = (userRole: UserRole): boolean => {
  return userRole === 'coach'
}

export const canJoinTeams = (userRole: UserRole): boolean => {
  return userRole === 'athlete' || userRole === 'assistant_coach'
}

export const isCoachOrAssistant = (userRole: UserRole): boolean => {
  return userRole === 'coach' || userRole === 'assistant_coach'
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
}

export interface TeamStats {
  totalAthletes: number
  activeAthletes: number
  completedWorkouts: number
  upcomingEvents: number
}

export interface AthleteStats {
  totalWorkouts: number
  completedWorkouts: number
  nextWorkout?: string
  upcomingEvents: number
  teamMessages: number
}

// Helper function to upsert user in the database
export async function upsertUser(userId: string, email: string, role: UserRole) {
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (existingUser) {
    // User exists, update role if needed
    if (existingUser.role !== role) {
      const { error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', userId)
      
      if (error) throw error
    }
    return existingUser
  } else {
    // User doesn't exist, insert new user
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        full_name: '',
        role,
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

// Generate a random 6-digit numeric code
function generateJoinCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Check if a join code already exists in the teams table
async function isJoinCodeUnique(joinCode: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('teams')
    .select('join_code')
    .eq('join_code', joinCode)
    .single()

  if (error && error.code === 'PGRST116') {
    // No team found with this join code, so it's unique
    return true
  }
  
  if (error) {
    throw error
  }
  
  // Team found with this join code, so it's not unique
  return false
}

// Generate a unique 6-digit join code
export async function generateUniqueJoinCode(): Promise<string> {
  let joinCode: string
  let attempts = 0
  const maxAttempts = 10

  do {
    joinCode = generateJoinCode()
    attempts++
    
    if (attempts > maxAttempts) {
      throw new Error('Unable to generate unique join code after maximum attempts')
    }
  } while (!(await isJoinCodeUnique(joinCode)))

  return joinCode
}

// Interface for chat data structure
export interface ChatData {
  id: string
  name: string
  lastMessage: string | null
  lastMessageTime: string | null
  unread: boolean
  memberCount: number
}

// Type definitions for Supabase query results
type UserChatResult = {
  chat_id: string
  chats: {
    id: string
    name: string
    created_at: string
  }
}

type LastMessageResult = {
  chat_id: string
  message: string
  created_at: string
}

// Fetch chats for the logged-in user
export async function getUserChats(userId: string): Promise<ChatData[]> {
  try {
    // First, get all chats where the user is a member
    const { data: userChats, error: chatsError } = await supabase
      .from('chat_members')
      .select(`
        chat_id,
        chats!inner (
          id,
          name,
          created_at
        )
      `)
      .eq('user_id', userId) as { data: UserChatResult[] | null, error: any }

    if (chatsError) {
      console.error('Error fetching user chats:', chatsError)
      throw chatsError
    }

    if (!userChats || userChats.length === 0) {
      return []
    }

    // Extract chat IDs
    const chatIds = userChats.map(uc => uc.chat_id)

    // Get the last message for each chat (optional - don't fail if messages table doesn't exist)
    let lastMessages: LastMessageResult[] | null = null
    if (chatIds.length > 0) {
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('chat_id, message, created_at')
        .in('chat_id', chatIds)
        .order('created_at', { ascending: false }) as { data: LastMessageResult[] | null, error: any }

      if (messagesError) {
        console.error('Error fetching last messages:', messagesError)
        console.error('Messages error details:', JSON.stringify(messagesError, null, 2))
        console.log('Continuing without last messages...')
      } else {
        lastMessages = messagesData
      }
    }

    // Get member counts for each chat
    const { data: memberCounts, error: memberCountError } = await supabase
      .from('chat_members')
      .select('chat_id')
      .in('chat_id', chatIds)

    if (memberCountError) {
      console.error('Error fetching member counts:', memberCountError)
    }

    // Create a map of chat_id to member count
    const memberCountMap = new Map<string, number>()
    if (memberCounts) {
      memberCounts.forEach(member => {
        const count = memberCountMap.get(member.chat_id) || 0
        memberCountMap.set(member.chat_id, count + 1)
      })
    }

    // Create a map of chat_id to last message
    const lastMessageMap = new Map<string, { message: string; created_at: string }>()
    if (lastMessages) {
      lastMessages.forEach(msg => {
        if (!lastMessageMap.has(msg.chat_id)) {
          lastMessageMap.set(msg.chat_id, {
            message: msg.message,
            created_at: msg.created_at
          })
        }
      })
    }

    // Combine chat data with last messages
    const chatsWithMessages: ChatData[] = userChats.map(userChat => {
      const chat = userChat.chats
      const lastMsg = lastMessageMap.get(chat.id)
      
      return {
        id: chat.id,
        name: chat.name,
        lastMessage: lastMsg ? lastMsg.message : null,
        lastMessageTime: lastMsg ? lastMsg.created_at : chat.created_at,
        unread: false, // For now, we'll set this to false. Unread logic can be implemented later
        memberCount: memberCountMap.get(chat.id) || 0
      }
    })

    // Sort by last message time (most recent first)
    chatsWithMessages.sort((a, b) => {
      const timeA = new Date(a.lastMessageTime || 0).getTime()
      const timeB = new Date(b.lastMessageTime || 0).getTime()
      return timeB - timeA
    })

    return chatsWithMessages

  } catch (error) {
    console.error('Error in getUserChats:', error)
    throw error
  }
}

// Interface for message data structure
export interface MessageData {
  id: string
  message: string
  created_at: string
  chat_id: string
  sender: {
    id: string
    name: string
    avatar?: string
    role: 'coach' | 'athlete'
  }
  isCoach: boolean
}

// Type definition for message query results
type MessageResult = {
  id: string
  message: string
  created_at: string
  sender_id: string
  users: {
    id: string
    full_name: string
    avatar?: string
    role: 'coach' | 'athlete'
  } | null
}

// Fetch messages for a selected chat
export async function getChatMessages(chatId: string): Promise<MessageData[]> {
  try {
    // Fetch messages with sender information using a JOIN
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        id,
        message,
        created_at,
        sender_id,
        users!messages_sender_id_fkey (
          id,
          full_name,
          avatar,
          role
        )
      `)
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true }) as { data: MessageResult[] | null, error: any }

    if (messagesError) {
      console.error('Error fetching chat messages:', messagesError)
      throw messagesError
    }

    if (!messages || messages.length === 0) {
      return []
    }

    // Transform the data to match our MessageData interface
    const transformedMessages: MessageData[] = messages.map(msg => {
      const sender = msg.users
      
      return {
        id: msg.id,
        message: msg.message,
        created_at: msg.created_at,
        chat_id: chatId,
        sender: {
          id: sender?.id || msg.sender_id,
          name: sender?.full_name || 'Unknown User',
          avatar: sender?.avatar || undefined,
          role: sender?.role || 'athlete'
        },
        isCoach: sender?.role === 'coach'
      }
    })

    return transformedMessages

  } catch (error) {
    console.error('Error in getChatMessages:', error)
    throw error
  }
}

// Send a new message to a chat
export async function sendChatMessage(
  chatId: string, 
  senderId: string, 
  message: string
): Promise<MessageData> {
  try {
    // Validate input
    if (!message.trim()) {
      throw new Error('Message cannot be empty')
    }

    // Insert the message into the database
    console.log('Sending message:', { chatId, senderId, message: message.trim() })
    const { data: newMessage, error: insertError } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: senderId,
        message: message.trim(),
        created_at: new Date().toISOString()
      })
      .select(`
        id,
        message,
        created_at,
        sender_id,
        users!messages_sender_id_fkey (
          id,
          full_name,
          avatar,
          role
        )
      `)
      .single() as { data: MessageResult | null, error: any }

    if (insertError) {
      console.error('Error sending message:', insertError)
      console.error('Message insert error details:', JSON.stringify(insertError, null, 2))
      throw insertError
    }

    console.log('Message sent successfully:', newMessage)

    if (!newMessage) {
      throw new Error('Failed to create message')
    }

    // Transform the data to match our MessageData interface
    const sender = newMessage.users
    const transformedMessage: MessageData = {
      id: newMessage.id,
      message: newMessage.message,
      created_at: newMessage.created_at,
      chat_id: chatId,
      sender: {
        id: sender?.id || newMessage.sender_id,
        name: sender?.full_name || 'Unknown User',
        avatar: sender?.avatar || undefined,
        role: sender?.role || 'athlete'
      },
      isCoach: sender?.role === 'coach'
    }

    return transformedMessage

  } catch (error) {
    console.error('Error in sendChatMessage:', error)
    throw error
  }
}

// Helper function to update chat list with new last message
export function updateChatListWithNewMessage(
  chats: ChatData[], 
  chatId: string, 
  newMessage: MessageData
): ChatData[] {
  return chats.map(chat => {
    if (chat.id === chatId) {
      return {
        ...chat,
        lastMessage: newMessage.message,
        lastMessageTime: newMessage.created_at
      }
    }
    return chat
  }).sort((a, b) => {
    // Re-sort by last message time after update
    const timeA = new Date(a.lastMessageTime || 0).getTime()
    const timeB = new Date(b.lastMessageTime || 0).getTime()
    return timeB - timeA
  })
}


// Type definition for real-time message result
type RealtimeMessageResult = {
  id: string
  message: string
  created_at: string
  sender_id: string
  chat_id: string
  users: {
    id: string
    full_name: string
    avatar?: string
    role: 'coach' | 'athlete'
  } | null
}

// Real-time subscription for messages
export function subscribeToMessages(
  userChats: ChatData[],
  onMessageReceived: (message: MessageData) => void
) {
  // Get all chat IDs that the user is part of
  const chatIds = userChats.map(chat => chat.id)
  
  if (chatIds.length === 0) {
    console.log('No chats to subscribe to')
    return null
  }

  console.log('Setting up real-time subscription for chats:', chatIds)

  // Subscribe to new messages in any of the user's chats
  const subscription = supabase
    .channel('messages-channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=in.(${chatIds.join(',')})`
      },
      async (payload) => {
        console.log('Real-time message received:', payload)
        
        try {
          // Fetch the complete message with sender information
          const { data: messageWithSender, error } = await supabase
            .from('messages')
            .select(`
              id,
              message,
              created_at,
              sender_id,
              chat_id,
              users!messages_sender_id_fkey (
                id,
                full_name,
                avatar,
                role
              )
            `)
            .eq('id', payload.new.id)
            .single() as { data: RealtimeMessageResult | null, error: any }

          if (error) {
            console.error('Error fetching message details:', error)
            return
          }

          if (!messageWithSender) {
            console.error('Message not found')
            return
          }

          // Transform the data to match our MessageData interface
          const sender = messageWithSender.users
          const transformedMessage: MessageData = {
            id: messageWithSender.id,
            message: messageWithSender.message,
            created_at: messageWithSender.created_at,
            chat_id: messageWithSender.chat_id,
            sender: {
              id: sender?.id || messageWithSender.sender_id,
              name: sender?.full_name || 'Unknown User',
              avatar: sender?.avatar || undefined,
              role: sender?.role || 'athlete'
            },
            isCoach: sender?.role === 'coach'
          }

          // Call the callback with the transformed message
          onMessageReceived(transformedMessage)

        } catch (error) {
          console.error('Error processing real-time message:', error)
        }
      }
    )
    .subscribe((status, err) => {
      console.log('Subscription status:', status)
      if (err) {
        console.error('Subscription error:', err)
      }
    })

  return subscription
}

// Helper function to add a new message to the messages array while maintaining order
export function addMessageToList(
  messages: MessageData[],
  newMessage: MessageData,
  currentChatId: string
): MessageData[] {
  // Only add the message if it belongs to the currently selected chat
  if (currentChatId !== newMessage.chat_id) {
    return messages
  }

  // Check if message already exists (to prevent duplicates)
  const messageExists = messages.some(msg => msg.id === newMessage.id)
  if (messageExists) {
    return messages
  }

  // Add the new message and sort by created_at (ascending)
  const updatedMessages = [...messages, newMessage].sort((a, b) => {
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })

  return updatedMessages
}

// Cleanup subscription function
export function unsubscribeFromMessages(subscription: any) {
  if (subscription) {
    console.log('Cleaning up message subscription')
    supabase.removeChannel(subscription)
  }
}

// Interface for chat member data
export interface ChatMember {
  id: string
  chat_id: string
  user_id: string
  role: 'admin' | 'member'
  user: {
    id: string
    full_name: string
    email: string
    role: 'coach' | 'athlete'
    avatar?: string
  }
}

// Interface for simplified member display
export interface ChatMemberDisplay {
  id: string
  name: string
  email: string
  role: 'coach' | 'athlete'
  avatar?: string
  isAdmin: boolean
}

// Type definition for chat member query result
type ChatMemberResult = {
  id: string
  chat_id: string
  user_id: string
  role: 'admin' | 'member'
  users: {
    id: string
    full_name: string
    email: string
    role: 'coach' | 'athlete'
    avatar?: string
  } | null
}

// Fetch all members of a chat
export async function getChatMembers(chatId: string): Promise<ChatMemberDisplay[]> {
  try {
    const { data: members, error } = await supabase
      .from('chat_members')
      .select(`
        id,
        chat_id,
        user_id,
        role,
        users!chat_members_user_id_fkey (
          id,
          full_name,
          email,
          role,
          avatar
        )
      `)
      .eq('chat_id', chatId) as { data: ChatMemberResult[] | null, error: any }

    if (error) {
      console.error('Error fetching chat members:', error)
      throw error
    }

    if (!members) {
      return []
    }

    // Transform to display format
    const memberDisplay: ChatMemberDisplay[] = members.map(member => ({
      id: member.user_id,
      name: member.users?.full_name || 'Unknown User',
      email: member.users?.email || '',
      role: member.users?.role || 'athlete',
      avatar: member.users?.avatar || undefined,
      isAdmin: member.role === 'admin'
    }))

    return memberDisplay

  } catch (error) {
    console.error('Error in getChatMembers:', error)
    throw error
  }
}

// Type definition for permission check result
type PermissionCheckResult = {
  role: 'admin' | 'member'
  users: {
    role: 'coach' | 'athlete'
  } | null
}


// Check if user can manage chat members (coach and admin)
export async function canManageChatMembers(chatId: string, userId: string): Promise<boolean> {
  try {
    const { data: member, error } = await supabase
      .from('chat_members')
      .select(`
        role,
        users!chat_members_user_id_fkey (
          role
        )
      `)
      .eq('chat_id', chatId)
      .eq('user_id', userId)
      .single() as { data: PermissionCheckResult | null, error: any }

    if (error || !member) {
      return false
    }

    return member.users?.role === 'coach' && member.role === 'admin'

  } catch (error) {
    console.error('Error checking member management permissions:', error)
    return false
  }
}

// Type definition for available users query result
type AvailableUserResult = {
  id: string
  full_name: string
  email: string
  role: 'coach' | 'athlete'
  avatar?: string
}

// Get available users to add to chat (team members not already in chat)
export async function getAvailableUsersForChat(chatId: string, teamId?: string): Promise<ChatMemberDisplay[]> {
  try {
    // Get current chat members
    const { data: currentMembers, error: membersError } = await supabase
      .from('chat_members')
      .select('user_id')
      .eq('chat_id', chatId)

    if (membersError) {
      console.error('Error fetching current members:', membersError)
      throw membersError
    }

    const currentMemberIds = currentMembers?.map(m => m.user_id) || []

    let query = supabase
      .from('users')
      .select('id, full_name, email, role, avatar')

    // If teamId is provided, filter by team members
    if (teamId) {
      const { data: teamMembers, error: teamError } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', teamId)

      if (teamError) {
        console.error('Error fetching team members:', teamError)
        throw teamError
      }

      const teamMemberIds = teamMembers?.map(tm => tm.user_id) || []
      if (teamMemberIds.length > 0) {
        query = query.in('id', teamMemberIds)
      } else {
        // No team members found, return empty array
        return []
      }
    }

    // Exclude current chat members
    if (currentMemberIds.length > 0) {
      query = query.not('id', 'in', `(${currentMemberIds.join(',')})`)
    }

    const { data: availableUsers, error: usersError } = await query as { data: AvailableUserResult[] | null, error: any }

    if (usersError) {
      console.error('Error fetching available users:', usersError)
      throw usersError
    }

    if (!availableUsers) {
      return []
    }

    return availableUsers.map(user => ({
      id: user.id,
      name: user.full_name || 'Unknown User',
      email: user.email,
      role: user.role,
      avatar: user.avatar || undefined,
      isAdmin: false
    }))

  } catch (error) {
    console.error('Error in getAvailableUsersForChat:', error)
    throw error
  }
}

// Create a new group chat
// Create a chat - simple function that just creates a chat with selected members
export async function createChat(
  coachId: string,
  chatName: string,
  memberIds: string[] = []
): Promise<{ success: boolean; chatId?: string; error?: string }> {
  try {
    // Verify the user is a coach
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', coachId)
      .single()

    if (profileError || userProfile?.role !== 'coach') {
      return { success: false, error: 'Only coaches can create chats' }
    }

    // Get the coach's team
    const { data: userTeam, error: teamError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', coachId)
      .single()

    if (teamError) {
      return { success: false, error: 'Unable to verify team membership' }
    }

    // If members are provided, verify they're all part of the same team
    if (memberIds.length > 0) {
      const { data: memberTeams, error: memberError } = await supabase
        .from('team_members')
        .select('user_id, team_id')
        .in('user_id', memberIds)

      if (memberError) {
        return { success: false, error: 'Unable to verify member team membership' }
      }

      // Check if all members are in the same team
      const allInSameTeam = memberTeams.every((member: any) => member.team_id === userTeam.team_id)
      if (!allInSameTeam) {
        return { success: false, error: 'All members must be in the same team' }
      }
    }

    // Create the chat - no type needed, just a simple chat
    console.log('Creating chat with data:', {
      name: chatName.trim(),
      team_id: userTeam.team_id,
      owner_id: coachId
    })
    const { data: newChat, error: chatError } = await supabase
      .from('chats')
      .insert({
        name: chatName.trim(),
        team_id: userTeam.team_id,
        owner_id: coachId,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (chatError) {
      console.error('Error creating chat:', chatError)
      console.error('Chat error details:', JSON.stringify(chatError, null, 2))
      return { success: false, error: `Failed to create chat: ${chatError.message || 'Unknown error'}` }
    }

    console.log('Chat created successfully:', newChat)

    // Add the coach as an admin member
    console.log('Adding coach to chat:', { chatId: newChat.id, coachId, role: 'admin' })
    const { data: coachMemberData, error: coachMemberError } = await supabase
      .from('chat_members')
      .insert({
        chat_id: newChat.id,
        user_id: coachId,
        role: 'admin'
      })
      .select()

    if (coachMemberError) {
      console.error('Error adding coach to chat:', coachMemberError)
      console.error('Coach member error details:', JSON.stringify(coachMemberError, null, 2))
      return { success: false, error: `Failed to add coach to chat: ${coachMemberError.message || 'Unknown error'}` }
    }

    console.log('Coach added to chat successfully:', coachMemberData)

    // Add other members as regular members
    if (memberIds.length > 0) {
      const memberInserts = memberIds.map(userId => ({
        chat_id: newChat.id,
        user_id: userId,
        role: 'member'
      }))

      const { error: membersError } = await supabase
        .from('chat_members')
        .insert(memberInserts)

      if (membersError) {
        console.error('Error adding members to chat:', membersError)
        return { success: false, error: 'Failed to add members to chat' }
      }
    }

    return { success: true, chatId: newChat.id }

  } catch (error) {
    console.error('Error in createChat:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// Delete a chat (only coaches and assistant coaches can delete chats)
export async function addMembersToChat(
  chatId: string,
  memberIds: string[],
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // First, verify the user is a coach or assistant coach
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return { success: false, error: 'Failed to verify user permissions' }
    }

    if (userProfile.role !== 'coach' && userProfile.role !== 'assistant_coach') {
      return { success: false, error: 'Only coaches and assistant coaches can add members to chats' }
    }

    // Verify the user is a member of the chat
    const { data: chatMember, error: memberError } = await supabase
      .from('chat_members')
      .select('role')
      .eq('chat_id', chatId)
      .eq('user_id', userId)
      .single()

    if (memberError || !chatMember) {
      return { success: false, error: 'You are not a member of this chat' }
    }

    // Get existing members to avoid duplicates
    const { data: existingMembers, error: existingError } = await supabase
      .from('chat_members')
      .select('user_id')
      .eq('chat_id', chatId)

    if (existingError) {
      console.error('Error fetching existing members:', existingError)
      return { success: false, error: 'Failed to check existing members' }
    }

    const existingMemberIds = existingMembers?.map(m => m.user_id) || []
    const newMemberIds = memberIds.filter(id => !existingMemberIds.includes(id))

    if (newMemberIds.length === 0) {
      return { success: true, error: 'All selected members are already in the chat' }
    }

    // Add new members to the chat
    const membersToAdd = newMemberIds.map(memberId => ({
      chat_id: chatId,
      user_id: memberId,
      role: 'member',
      joined_at: new Date().toISOString()
    }))

    const { error: insertError } = await supabase
      .from('chat_members')
      .insert(membersToAdd)

    if (insertError) {
      console.error('Error adding members to chat:', insertError)
      return { success: false, error: `Failed to add members: ${insertError.message || 'Unknown error'}` }
    }

    console.log(`Successfully added ${newMemberIds.length} members to chat ${chatId}`)
    return { success: true }

  } catch (error) {
    console.error('Error in addMembersToChat:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function deleteChat(
  chatId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // First, verify the user is a coach or assistant coach
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return { success: false, error: 'Failed to verify user permissions' }
    }

    if (userProfile.role !== 'coach' && userProfile.role !== 'assistant_coach') {
      return { success: false, error: 'Only coaches and assistant coaches can delete chats' }
    }

    // Verify the user is a member of the chat (and preferably an admin)
    const { data: chatMember, error: memberError } = await supabase
      .from('chat_members')
      .select('role')
      .eq('chat_id', chatId)
      .eq('user_id', userId)
      .single()

    if (memberError || !chatMember) {
      return { success: false, error: 'You are not a member of this chat' }
    }

    // Delete all messages in the chat first
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .eq('chat_id', chatId)

    if (messagesError) {
      console.error('Error deleting chat messages:', messagesError)
      console.error('Messages error details:', JSON.stringify(messagesError, null, 2))
      return { success: false, error: `Failed to delete chat messages: ${messagesError.message || 'Unknown error'}` }
    }

    // Delete all chat members
    const { error: membersError } = await supabase
      .from('chat_members')
      .delete()
      .eq('chat_id', chatId)

    if (membersError) {
      console.error('Error deleting chat members:', membersError)
      console.error('Members error details:', JSON.stringify(membersError, null, 2))
      return { success: false, error: `Failed to delete chat members: ${membersError.message || 'Unknown error'}` }
    }

    // Finally, delete the chat itself
    const { error: chatError } = await supabase
      .from('chats')
      .delete()
      .eq('id', chatId)

    if (chatError) {
      console.error('Error deleting chat:', chatError)
      console.error('Chat error details:', JSON.stringify(chatError, null, 2))
      return { success: false, error: `Failed to delete chat: ${chatError.message || 'Unknown error'}` }
    }

    console.log('Chat deleted successfully:', chatId)
    return { success: true }

  } catch (error) {
    console.error('Error in deleteChat:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// Create a new team and add the coach as a member
export async function createTeam(coachId: string, coachName: string): Promise<{ teamId: string, joinCode: string }> {
  try {
    // First, check if coach is already part of any team
    const { data: existingTeams, error: existingTeamsError } = await supabase
      .from('team_members')
      .select('id')
      .eq('user_id', coachId)

    if (existingTeamsError) {
      throw existingTeamsError
    }

    if (existingTeams && existingTeams.length > 0) {
      throw new Error('You are already part of a team')
    }

    // Generate unique join code
    const joinCode = await generateUniqueJoinCode()
    
    // Create team name based on join code
    const teamName = `Team ${joinCode}`
    
    // Insert new team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        coach_id: coachId,
        join_code: joinCode,
        name: teamName,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (teamError) {
      throw teamError
    }

    // Add coach as team member
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: coachId,
        role: 'coach',
        joined_at: new Date().toISOString()
      })

    if (memberError) {
      // If adding member fails, we should clean up the team
      await supabase
        .from('teams')
        .delete()
        .eq('id', team.id)
      throw memberError
    }

    return {
      teamId: team.id,
      joinCode: joinCode
    }
  } catch (error) {
    console.error('Error creating team:', error)
    throw error
  }
} 

// Join a team using a join code
export async function joinTeam(userId: string, joinCode: string): Promise<{ teamId: string, teamName: string }> {
  try {
    console.log('🚀 JOIN TEAM DEBUG - Starting join team process')
    console.log('   - User ID:', userId)
    console.log('   - Join Code:', joinCode)
    console.log('   - Join Code Type:', typeof joinCode)
    console.log('   - Join Code Length:', joinCode?.length)
    
    // First, check if user is already part of any team
    const { data: existingTeams, error: existingTeamsError } = await supabase
      .from('team_members')
      .select('id')
      .eq('user_id', userId)

    if (existingTeamsError) {
      console.error('Error checking existing teams:', existingTeamsError)
      throw existingTeamsError
    }

    console.log('🔍 Existing teams check result:', { existingTeams, error: existingTeamsError })

    if (existingTeams && existingTeams.length > 0) {
      throw new Error('You are already part of a team')
    }

    // Get user's role to assign correct team member role
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (userError) {
      throw new Error('Failed to verify user profile')
    }

    // Look up the team by join code
    console.log('🔍 Looking up team with join code:', joinCode)
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id, name, join_code')
      .eq('join_code', joinCode)
      .single()

    console.log('🎯 Team lookup result:')
    console.log('   - Team data:', team)
    console.log('   - Error:', teamError)
    console.log('   - Error code:', teamError?.code)
    console.log('   - Error message:', teamError?.message)

    if (teamError) {
      if (teamError.code === 'PGRST116') {
        // No team found with this join code
        console.log('No team found with join code:', joinCode)
        throw new Error('Invalid code')
      }
      throw teamError
    }

    // Determine the appropriate team member role based on user's role
    let teamMemberRole = 'athlete' // Default role
    if (userProfile.role === 'assistant_coach') {
      teamMemberRole = 'assistant_coach'
    } else if (userProfile.role === 'coach') {
      teamMemberRole = 'coach'
    }
    
    console.log('User role and team member role:', { 
      userRole: userProfile.role, 
      teamMemberRole 
    })

    // Add user as team member
    const { error: insertError } = await supabase
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: userId,
        role: teamMemberRole,
        joined_at: new Date().toISOString()
      })

    if (insertError) {
      throw insertError
    }

    return {
      teamId: team.id,
      teamName: team.name
    }
  } catch (error) {
    console.error('Error joining team:', error)
    throw error
  }
} 

// Get teams that the current user belongs to
export async function getUserTeams(userId: string): Promise<Array<{ id: string, name: string, joinCode: string, role: string }>> {
  try {
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        team_id,
        role,
        teams (
          id,
          name,
          join_code
        )
      `)
      .eq('user_id', userId)

    if (error) {
      throw error
    }

    // Transform the data to a cleaner format
    return data.map((member: any) => ({
      id: member.teams.id,
      name: member.teams.name,
      joinCode: member.teams.join_code,
      role: member.role
    }))
  } catch (error) {
    console.error('Error fetching user teams:', error)
    throw error
  }
} 






// Helper function to format time ago
export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'Just now'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  } else {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} day${days > 1 ? 's' : ''} ago`
  }
}

// Helper function to generate avatar initials from a name
export function generateAvatar(name: string): string {
  if (!name || name.trim().length === 0) {
    return '??'
  }
  
  return name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

// Helper function to format date for display
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) {
    return 'Today'
  } else if (diffInDays === 1) {
    return 'Yesterday'
  } else if (diffInDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'long' })
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }
}

// Helper function to format time for display
export function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  })
} 

// Get team events for a user
export async function getTeamEvents(userId: string): Promise<Array<{
  id: string
  title: string
  description: string | null
  event_type: string
  start_time: string
  end_time: string
  location: string | null
  created_at: string
}>> {
  try {
    // First, get the user's team
    const { data: userTeam, error: teamError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId)
      .single()

    if (teamError) {
      console.error('Error fetching user team:', teamError)
      throw new Error('Unable to verify team membership')
    }

    if (!userTeam) {
      return []
    }

    // Get events for the user's team, ordered by start_time
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select(`
        id,
        title,
        description,
        event_type,
        start_time,
        end_time,
        location,
        created_at
      `)
      .eq('team_id', userTeam.team_id)
      .order('start_time', { ascending: true })

    if (eventsError) {
      console.error('Error fetching team events:', eventsError)
      throw eventsError
    }

    return events || []
  } catch (error) {
    console.error('Error in getTeamEvents:', error)
    throw error
  }
}

// Create a new event
export async function createEvent(
  userId: string,
  eventData: {
    title: string
    description?: string
    event_type: string
    start_time: string
    end_time: string
    location?: string
  }
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  try {
    // First, get the user's team
    const { data: userTeam, error: teamError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId)
      .single()

    if (teamError) {
      console.error('Error fetching user team:', teamError)
      return { success: false, error: 'Unable to verify team membership' }
    }

    if (!userTeam) {
      return { success: false, error: 'User is not part of any team' }
    }

    // Insert the new event
    const { data: newEvent, error: insertError } = await supabase
      .from('events')
      .insert({
        team_id: userTeam.team_id,
        title: eventData.title,
        description: eventData.description || null,
        event_type: eventData.event_type,
        start_time: eventData.start_time,
        end_time: eventData.end_time,
        location: eventData.location || null,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Error inserting event:', insertError)
      return { success: false, error: 'Failed to create event' }
    }

    return { success: true, eventId: newEvent.id }
  } catch (error) {
    console.error('Error in createEvent:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// Update an existing event
export async function updateEvent(
  eventId: string,
  eventData: {
    title: string
    description?: string
    event_type: string
    start_time: string
    end_time: string
    location?: string
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error: updateError } = await supabase
      .from('events')
      .update({
        title: eventData.title,
        description: eventData.description || null,
        event_type: eventData.event_type,
        start_time: eventData.start_time,
        end_time: eventData.end_time,
        location: eventData.location || null
      })
      .eq('id', eventId)

    if (updateError) {
      console.error('Error updating event:', updateError)
      return { success: false, error: 'Failed to update event' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in updateEvent:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// Delete an event
export async function deleteEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)

    if (deleteError) {
      console.error('Error deleting event:', deleteError)
      return { success: false, error: 'Failed to delete event' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in deleteEvent:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function deleteWorkout(workoutId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Attempting to delete workout:', workoutId)
    
    // Delete the workout (exercises are stored in the same row, so they'll be deleted automatically)
    const { error: workoutDeleteError } = await supabase
      .from('workouts')
      .delete()
      .eq('id', workoutId)

    if (workoutDeleteError) {
      console.error('Error deleting workout:', workoutDeleteError)
      return { success: false, error: `Failed to delete workout: ${workoutDeleteError.message}` }
    }

    console.log('Successfully deleted workout')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteWorkout:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// Update user profile information
export async function updateUserProfile(
  userId: string, 
  profileData: {
    full_name?: string;
    email?: string;
    role?: UserRole;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Updating user profile:', userId, profileData)
    
    const { error: updateError } = await supabase
      .from('users')
      .update(profileData)
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating user profile:', updateError)
      return { success: false, error: `Failed to update profile: ${updateError.message}` }
    }

    console.log('Successfully updated user profile')
    return { success: true }
  } catch (error) {
    console.error('Error in updateUserProfile:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}


// Get workouts for a user (either assigned to them or to their team)
export async function getUserWorkouts(userId: string): Promise<Array<{
  id: string
  team_id: string
  title: string
  description: string | null
  assigned_to: string | null // Single UUID for now
  date_assigned: string
  created_at: string
}>> {
  try {
    console.log('Fetching workouts for user:', userId)
    
    // First, get the user's teams
    const userTeams = await getUserTeams(userId)
    const teamIds = userTeams.map(team => team.id)
    
    console.log('User teams:', userTeams)
    console.log('Team IDs:', teamIds)

    // If user has no teams, only fetch workouts directly assigned to them
    if (teamIds.length === 0) {
      console.log('No teams found, fetching workouts assigned to user only')
      const { data: workouts, error } = await supabase
        .from('workouts')
        .select(`
          id,
          team_id,
          title,
          description,
          assigned_to,
          date_assigned,
          created_at
        `)
        .eq('assigned_to', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching workouts:', error)
        throw error
      }

      console.log('Workouts fetched (no teams):', workouts)
      return workouts || []
    }

    // Fetch workouts that either:
    // 1. Belong to a team the user is on (team_id)
    // 2. Are directly assigned to the user (assigned_to)
    console.log('Fetching workouts for teams and user assignments')
    const { data: workouts, error } = await supabase
      .from('workouts')
      .select(`
        id,
        team_id,
        title,
        description,
        assigned_to,
        date_assigned,
        created_at
      `)
      .or(`team_id.in.(${teamIds.map(id => `"${id}"`).join(',')}),assigned_to.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching workouts:', error)
      throw error
    }

    console.log('Workouts fetched:', workouts)
    return workouts || []
  } catch (error) {
    console.error('Error in getUserWorkouts:', error)
    throw error
  }
}

// Create a new workout with exercises
export async function createWorkout(
  userId: string, 
  workoutData: { 
    title: string; 
    description?: string; 
    assigned_to?: string[];
    exercises?: Array<{
      name: string
      sets: number
      reps: number
      rest_seconds: number
      notes?: string
    }>
  }
): Promise<{ success: boolean; workoutId?: string; error?: string }> {
  try {
    console.log('Creating workout for user:', userId)
    console.log('Workout data:', workoutData)
    
    // Get user's teams to get a team_id
    const userTeams = await getUserTeams(userId)
    if (userTeams.length === 0) {
      console.error('User has no teams')
      return { success: false, error: 'User must be part of a team to create workouts' }
    }
    
    const teamId = userTeams[0].id // Use the first team
    console.log('Using team ID:', teamId)
    
    // Create the workout with exercises
    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .insert({
        team_id: teamId,
        title: workoutData.title,
        description: workoutData.description || '',
        assigned_to: workoutData.assigned_to && workoutData.assigned_to.length > 0 ? workoutData.assigned_to[0] : null, // For now, only assign to first selected member
        date_assigned: new Date().toISOString(),
        exercises: workoutData.exercises || null
      })
      .select()
      .single()
    
    if (workoutError) {
      console.error('Error creating workout:', workoutError)
      return { success: false, error: workoutError.message }
    }
    
    console.log('Workout created successfully with exercises:', workout)
    
    return { success: true, workoutId: workout.id }
  } catch (error) {
    console.error('Error in createWorkout:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}


// Update team name (only for coaches)
export async function updateTeamName(
  coachId: string,
  teamId: string,
  newName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify the user is a coach and owns this team
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', coachId)
      .single()

    if (profileError || userProfile.role !== 'coach') {
      return { success: false, error: 'Only coaches can update team names' }
    }

    // Verify the coach owns this team
    const { data: teamOwnership, error: ownershipError } = await supabase
      .from('teams')
      .select('coach_id')
      .eq('id', teamId)
      .eq('coach_id', coachId)
      .single()

    if (ownershipError || !teamOwnership) {
      return { success: false, error: 'You can only update teams you own' }
    }

    // Update the team name
    const { error: updateError } = await supabase
      .from('teams')
      .update({ name: newName.trim() })
      .eq('id', teamId)

    if (updateError) {
      console.error('Error updating team name:', updateError)
      return { success: false, error: 'Failed to update team name' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in updateTeamName:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}



// Get exercises for a specific workout
export async function getWorkoutExercises(workoutId: string): Promise<Array<{
  id: string
  exercise_name: string
  sets: number
  reps: number
  rest_seconds: number
  notes: string | null
}>> {
  try {
    const { data: workout, error } = await supabase
      .from('workouts')
      .select('exercises')
      .eq('id', workoutId)
      .single()

    if (error) {
      console.error('Error fetching workout:', error)
      throw error
    }

    if (!workout || !workout.exercises) {
      console.log('No exercises found for workout:', workoutId)
      return []
    }

    // Convert the exercises from the jsonb format to the expected format
    const exercises = workout.exercises.map((exercise: any, index: number) => ({
      id: `${workoutId}-${index}`, // Generate a unique ID for each exercise
      exercise_name: exercise.name,
      sets: exercise.sets,
      reps: exercise.reps,
      rest_seconds: exercise.rest_seconds,
      notes: exercise.notes || null
    }))

    console.log('Workout exercises fetched:', exercises)
    return exercises
  } catch (error) {
    console.error('Error in getWorkoutExercises:', error)
    throw error
  }
}

// Get team members for workout assignment
export async function getTeamMembers(userId: string): Promise<Array<{
  id: string
  name: string
  email: string
  role: string
}>> {
  try {
    // First, get the user's team
    const { data: userTeams, error: teamError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId)

    if (teamError) {
      console.error('Error fetching user team:', teamError)
      throw teamError
    }

    if (!userTeams || userTeams.length === 0) {
      return []
    }

    // Use the first team (users should only be in one team)
    const userTeam = userTeams[0]

    // Get all team members for this team
    const { data: teamMembers, error: membersError } = await supabase
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

    if (membersError) {
      console.error('Error fetching team members:', membersError)
      throw membersError
    }

    // Format team members
    const formattedMembers = teamMembers?.map((member: any) => ({
      id: member.user_id,
      name: member.users.full_name || member.users.email,
      email: member.users.email,
      role: member.role
    })).filter((member: any) => member.id !== userId) || [] // Exclude the current user

    return formattedMembers
  } catch (error) {
    console.error('Error in getTeamMembers:', error)
    throw error
  }
} 