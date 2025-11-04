'use client'

import { supabase } from './supabaseClient'

export type AttendanceStatus = 'attending' | 'not_attending' | 'maybe'

export interface EventAttendance {
  id: string
  event_id: string
  user_id: string
  status: AttendanceStatus
  created_at: string
  updated_at: string
}

// Set attendance status for an event
export async function setEventAttendance(
  eventId: string,
  userId: string,
  status: AttendanceStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('📅 Setting attendance:', { eventId, userId, status })

    const { error } = await supabase
      .from('event_attendance')
      .upsert({
        event_id: eventId,
        user_id: userId,
        status: status,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'event_id,user_id'
      })

    if (error) {
      console.error('❌ Error setting attendance:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Attendance set successfully')
    return { success: true }

  } catch (error) {
    console.error('❌ Error in setEventAttendance:', error)
    return { success: false, error: 'Failed to set attendance' }
  }
}

// Get attendance status for a specific event and user
export async function getUserEventAttendance(
  eventId: string,
  userId: string
): Promise<AttendanceStatus | null> {
  try {
    const { data, error } = await supabase
      .from('event_attendance')
      .select('status')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No attendance record found
        return null
      }
      console.error('❌ Error getting user attendance:', error)
      return null
    }

    return data.status as AttendanceStatus

  } catch (error) {
    console.error('❌ Error in getUserEventAttendance:', error)
    return null
  }
}

// Get all attendance for an event (for coaches)
export async function getEventAttendance(eventId: string): Promise<{
  attending: number
  not_attending: number
  maybe: number
  total_responses: number
  attendees: Array<{
    user_id: string
    status: AttendanceStatus
    user_name?: string
    user_email?: string
  }>
}> {
  try {
    console.log('📊 Getting event attendance for:', eventId)

    const { data, error } = await supabase
      .from('event_attendance')
      .select(`
        user_id,
        status,
        users (
          name,
          email
        )
      `)
      .eq('event_id', eventId)

    if (error) {
      console.error('❌ Error getting event attendance:', error)
      return {
        attending: 0,
        not_attending: 0,
        maybe: 0,
        total_responses: 0,
        attendees: []
      }
    }

    // Count responses by status
    const attending = data.filter(a => a.status === 'attending').length
    const not_attending = data.filter(a => a.status === 'not_attending').length
    const maybe = data.filter(a => a.status === 'maybe').length

    // Format attendees data
    const attendees = data.map(a => ({
      user_id: a.user_id,
      status: a.status as AttendanceStatus,
      user_name: (a.users as any)?.name,
      user_email: (a.users as any)?.email
    }))

    console.log('📊 Attendance summary:', { attending, not_attending, maybe, total: data.length })

    return {
      attending,
      not_attending,
      maybe,
      total_responses: data.length,
      attendees
    }

  } catch (error) {
    console.error('❌ Error in getEventAttendance:', error)
    return {
      attending: 0,
      not_attending: 0,
      maybe: 0,
      total_responses: 0,
      attendees: []
    }
  }
}

// Get attendance statistics for a user (for their personal dashboard)
export async function getUserAttendanceStats(userId: string): Promise<{
  total_events: number
  attended: number
  attendance_rate: number
}> {
  try {
    const { data, error } = await supabase
      .from('event_attendance')
      .select('status')
      .eq('user_id', userId)

    if (error) {
      console.error('❌ Error getting user attendance stats:', error)
      return { total_events: 0, attended: 0, attendance_rate: 0 }
    }

    const total_events = data.length
    const attended = data.filter(a => a.status === 'attending').length
    const attendance_rate = total_events > 0 ? Math.round((attended / total_events) * 100) : 0

    return {
      total_events,
      attended,
      attendance_rate
    }

  } catch (error) {
    console.error('❌ Error in getUserAttendanceStats:', error)
    return { total_events: 0, attended: 0, attendance_rate: 0 }
  }
}

// Get team attendance overview (for coaches)
export async function getTeamAttendanceOverview(teamId: string): Promise<{
  total_events: number
  average_attendance_rate: number
  top_attendees: Array<{
    user_id: string
    user_name: string
    attendance_rate: number
  }>
}> {
  try {
    console.log('📊 Getting team attendance overview for team:', teamId)

    // Get all events for this team
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id')
      .eq('team_id', teamId)

    if (eventsError) {
      console.error('❌ Error getting team events:', eventsError)
      return { total_events: 0, average_attendance_rate: 0, top_attendees: [] }
    }

    if (!events || events.length === 0) {
      return { total_events: 0, average_attendance_rate: 0, top_attendees: [] }
    }

    const eventIds = events.map(e => e.id)

    // Get all attendance for these events
    const { data: attendance, error: attendanceError } = await supabase
      .from('event_attendance')
      .select(`
        user_id,
        status,
        users (
          name
        )
      `)
      .in('event_id', eventIds)

    if (attendanceError) {
      console.error('❌ Error getting team attendance:', attendanceError)
      return { total_events: 0, average_attendance_rate: 0, top_attendees: [] }
    }

    // Calculate overall attendance rate
    const totalResponses = attendance.length
    const totalAttending = attendance.filter(a => a.status === 'attending').length
    const average_attendance_rate = totalResponses > 0 ? Math.round((totalAttending / totalResponses) * 100) : 0

    // Calculate individual attendance rates
    const userStats = new Map()
    attendance.forEach(a => {
      const userId = a.user_id
      if (!userStats.has(userId)) {
        userStats.set(userId, {
          user_id: userId,
          user_name: (a.users as any)?.name || 'Unknown',
          total: 0,
          attended: 0
        })
      }
      const stats = userStats.get(userId)
      stats.total++
      if (a.status === 'attending') {
        stats.attended++
      }
    })

    // Convert to array and calculate rates
    const top_attendees = Array.from(userStats.values())
      .map(stats => ({
        user_id: stats.user_id,
        user_name: stats.user_name,
        attendance_rate: Math.round((stats.attended / stats.total) * 100)
      }))
      .sort((a, b) => b.attendance_rate - a.attendance_rate)
      .slice(0, 5) // Top 5 attendees

    return {
      total_events: events.length,
      average_attendance_rate,
      top_attendees
    }

  } catch (error) {
    console.error('❌ Error in getTeamAttendanceOverview:', error)
    return { total_events: 0, average_attendance_rate: 0, top_attendees: [] }
  }
}
