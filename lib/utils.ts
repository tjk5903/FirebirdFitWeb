import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "./supabaseClient"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type UserRole = 'coach' | 'athlete'

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
    // First, check if user is already part of any team
    const { data: existingTeams, error: existingTeamsError } = await supabase
      .from('team_members')
      .select('id')
      .eq('user_id', userId)

    if (existingTeamsError) {
      throw existingTeamsError
    }

    if (existingTeams && existingTeams.length > 0) {
      throw new Error('You are already part of a team')
    }

    // Look up the team by join code
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id, name')
      .eq('join_code', joinCode)
      .single()

    if (teamError) {
      if (teamError.code === 'PGRST116') {
        // No team found with this join code
        throw new Error('Invalid code')
      }
      throw teamError
    }

    // Add user as team member
    const { error: insertError } = await supabase
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: userId,
        role: 'athlete',
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

// Get messages for the current user's team
export async function getTeamMessages(userId: string): Promise<Array<{
  id: string
  name: string
  lastMessage: string
  time: string
  unread: boolean
  avatar: string
  type: 'athlete' | 'group'
  conversationId: string
}>> {
  try {
    // First, get the user's team
    const { data: userTeam, error: teamError } = await supabase
      .from('team_members')
      .select(`
        team_id,
        teams (
          id,
          name
        )
      `)
      .eq('user_id', userId)
      .single()

    if (teamError) {
      throw teamError
    }

    if (!userTeam) {
      return []
    }

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
      throw membersError
    }

    // Get the latest message for each conversation
    const { data: conversations, error: conversationsError } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        created_at,
        sender_id,
        conversation_id,
        users!messages_sender_id_fkey (
          full_name
        )
      `)
      .eq('team_id', userTeam.team_id)
      .order('created_at', { ascending: false })

    if (conversationsError) {
      throw conversationsError
    }

    // Group messages by conversation and get the latest one for each
    const conversationMap = new Map()
    conversations?.forEach(message => {
      if (!conversationMap.has(message.conversation_id)) {
        conversationMap.set(message.conversation_id, message)
      }
    })

    // Create conversation list with team members and team chat
    const conversationsList = []

    // Add team chat (group conversation)
    const teamChatMessage = Array.from(conversationMap.values()).find((msg: any) => 
      msg.conversation_id === `team_${userTeam.team_id}`
    )
    
    if (teamChatMessage) {
      conversationsList.push({
        id: `team_${userTeam.team_id}`,
        name: `${(userTeam.teams as any).name} Team Chat`,
        lastMessage: teamChatMessage.content,
        time: formatTimeAgo(teamChatMessage.created_at),
        unread: false, // TODO: Implement unread logic
        avatar: (userTeam.teams as any).name.split(' ').map((n: string) => n[0]).join('').slice(0, 2),
        type: 'group' as const,
        conversationId: `team_${userTeam.team_id}`
      })
    }

    // Add individual conversations with team members
    teamMembers?.forEach((member: any) => {
      if (member.user_id !== userId) { // Don't show self
        const memberMessage = Array.from(conversationMap.values()).find((msg: any) => 
          msg.conversation_id === `direct_${userId}_${member.user_id}` ||
          msg.conversation_id === `direct_${member.user_id}_${userId}`
        )

        if (memberMessage) {
          conversationsList.push({
            id: member.user_id,
            name: member.users.full_name || member.users.email,
            lastMessage: memberMessage.content,
            time: formatTimeAgo(memberMessage.created_at),
            unread: false, // TODO: Implement unread logic
            avatar: (member.users.full_name || member.users.email).split(' ').map((n: string) => n[0]).join('').slice(0, 2),
            type: 'athlete' as const,
            conversationId: memberMessage.conversation_id
          })
        }
      }
    })

    return conversationsList
  } catch (error) {
    console.error('Error fetching team messages:', error)
    throw error
  }
}

// Get conversation messages
export async function getConversationMessages(conversationId: string): Promise<Array<{
  id: string
  sender: string
  message: string
  time: string
  isCoach: boolean
}>> {
  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        created_at,
        sender_id,
        users!messages_sender_id_fkey (
          full_name,
          role
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    return messages?.map((message: any) => ({
      id: message.id,
      sender: message.users.full_name || message.users.email,
      message: message.content,
      time: formatTimeAgo(message.created_at),
      isCoach: message.users.role === 'coach'
    })) || []
  } catch (error) {
    console.error('Error fetching conversation messages:', error)
    throw error
  }
}

// Send a new message to a conversation
export async function sendMessage(
  senderId: string,
  conversationId: string,
  content: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // First, get the user's team to ensure they're sending to their own team
    const { data: userTeam, error: teamError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', senderId)
      .single()

    if (teamError) {
      console.error('Error fetching user team:', teamError)
      return { success: false, error: 'Unable to verify team membership' }
    }

    if (!userTeam) {
      return { success: false, error: 'User is not part of any team' }
    }

    // Validate conversation ID format
    const isTeamChat = conversationId.startsWith('team_')
    const isDirectChat = conversationId.startsWith('direct_')
    
    if (!isTeamChat && !isDirectChat) {
      return { success: false, error: 'Invalid conversation ID format' }
    }

    // For team chats, verify the team ID matches user's team
    if (isTeamChat) {
      const teamId = conversationId.replace('team_', '')
      if (teamId !== userTeam.team_id) {
        return { success: false, error: 'Cannot send message to other teams' }
      }
    }

    // For direct chats, verify the user is part of the conversation
    if (isDirectChat) {
      const [userId1, userId2] = conversationId.replace('direct_', '').split('_')
      if (userId1 !== senderId && userId2 !== senderId) {
        return { success: false, error: 'Cannot send message to this conversation' }
      }
    }

    // Insert the new message
    const { data: newMessage, error: insertError } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        team_id: userTeam.team_id,
        conversation_id: conversationId,
        content: content.trim(),
        created_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Error inserting message:', insertError)
      return { success: false, error: 'Failed to send message' }
    }

    return { success: true, messageId: newMessage.id }
  } catch (error) {
    console.error('Error in sendMessage:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// Helper function to format time ago
function formatTimeAgo(dateString: string): string {
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

// Get workouts for a user (either assigned to them or to their team)
export async function getUserWorkouts(userId: string): Promise<Array<{
  id: string
  team_id: string
  title: string
  description: string | null
  assigned_to: string[] | null
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
        .contains('assigned_to', [userId])
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
      .or(`team_id.in.(${teamIds.map(id => `"${id}"`).join(',')}),assigned_to.cs.{${userId}}`)
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

// Create a new workout
export async function createWorkout(
  userId: string, 
  workoutData: { 
    title: string; 
    description?: string; 
    assigned_to?: string[]; 
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
    
    const { data, error } = await supabase
      .from('workouts')
      .insert({
        team_id: teamId,
        title: workoutData.title,
        description: workoutData.description || '',
        assigned_to: workoutData.assigned_to || [],
        date_assigned: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating workout:', error)
      return { success: false, error: error.message }
    }
    
    console.log('Workout created successfully:', data)
    return { success: true, workoutId: data.id }
  } catch (error) {
    console.error('Error in createWorkout:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// Format date to readable format
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateString)
      return 'Invalid Date'
    }
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Invalid Date'
  }
} 