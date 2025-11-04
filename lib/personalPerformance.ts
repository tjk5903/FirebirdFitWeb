import { supabase } from '@/lib/supabaseClient'

export interface PersonalPerformanceStats {
  overallScore: number
  attendanceRate: number
  completionRate: number
  totalEvents: number
  totalWorkouts: number
  attendedEvents: number
  completedWorkouts: number
  currentAttendanceStreak: number
  currentCompletionStreak: number
  lastCompletedWorkout: {
    title: string
    completedAt: string
  } | null
  recentActivity: Array<{
    type: 'event' | 'workout'
    title: string
    date: string
    status: string
  }>
}

/**
 * Get personal performance statistics for a specific user
 */
export async function getUserPersonalStats(userId: string): Promise<PersonalPerformanceStats> {
  try {
    // Get user's teams first
    const { data: userTeams, error: teamsError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId)

    if (teamsError) throw teamsError

    const teamIds = userTeams?.map(t => t.team_id) || []

    if (teamIds.length === 0) {
      return getEmptyStats()
    }

    // Get all events from user's teams
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, start_time')
      .in('team_id', teamIds)
      .order('start_time', { ascending: false })

    if (eventsError) throw eventsError

    // Get all workouts from user's teams
    const { data: workouts, error: workoutsError } = await supabase
      .from('workouts')
      .select('id, title, created_at')
      .in('team_id', teamIds)
      .order('created_at', { ascending: false })

    if (workoutsError) throw workoutsError

    const totalEvents = events?.length || 0
    const totalWorkouts = workouts?.length || 0

    // Get user's attendance records
    const { data: userAttendance, error: attendanceError } = await supabase
      .from('event_attendance')
      .select(`
        event_id,
        status,
        created_at,
        events!inner(title, start_time)
      `)
      .eq('user_id', userId)
      .in('event_id', events?.map(e => e.id) || [])
      .order('created_at', { ascending: false })

    if (attendanceError) throw attendanceError

    // Get user's workout completions
    const { data: userCompletions, error: completionsError } = await supabase
      .from('workout_completions')
      .select(`
        workout_id,
        completed_at,
        workouts!inner(title, created_at)
      `)
      .eq('user_id', userId)
      .in('workout_id', workouts?.map(w => w.id) || [])
      .order('completed_at', { ascending: false })

    if (completionsError) throw completionsError

    // Calculate basic rates
    const attendedEvents = userAttendance?.filter(a => a.status === 'attending').length || 0
    const completedWorkouts = userCompletions?.length || 0

    const attendanceRate = totalEvents > 0 ? Math.round((attendedEvents / totalEvents) * 100) : 0
    const completionRate = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0

    // Calculate overall score (weighted average)
    let overallScore = 0
    if (totalEvents > 0 && totalWorkouts > 0) {
      overallScore = Math.round((attendanceRate + completionRate) / 2)
    } else if (totalEvents > 0) {
      overallScore = attendanceRate
    } else if (totalWorkouts > 0) {
      overallScore = completionRate
    }

    // Calculate attendance streak
    const currentAttendanceStreak = calculateAttendanceStreak(userAttendance || [])

    // Calculate completion streak
    const currentCompletionStreak = calculateCompletionStreak(userCompletions || [])

    // Get last completed workout
    const lastCompletedWorkout = userCompletions?.[0] ? {
      title: (userCompletions[0].workouts as any)?.title || 'Unknown Workout',
      completedAt: userCompletions[0].completed_at
    } : null

    // Build recent activity
    const recentActivity = buildRecentActivity(userAttendance || [], userCompletions || [])

    return {
      overallScore,
      attendanceRate,
      completionRate,
      totalEvents,
      totalWorkouts,
      attendedEvents,
      completedWorkouts,
      currentAttendanceStreak,
      currentCompletionStreak,
      lastCompletedWorkout,
      recentActivity
    }
  } catch (error) {
    console.error('Error getting user personal stats:', error)
    return getEmptyStats()
  }
}

/**
 * Calculate current attendance streak (consecutive "attending" RSVPs)
 */
function calculateAttendanceStreak(attendanceRecords: any[]): number {
  if (!attendanceRecords.length) return 0

  let streak = 0
  for (const record of attendanceRecords) {
    if (record.status === 'attending') {
      streak++
    } else {
      break
    }
  }
  return streak
}

/**
 * Calculate current completion streak (consecutive workout completions)
 */
function calculateCompletionStreak(completionRecords: any[]): number {
  if (!completionRecords.length) return 0

  // For completion streak, we count consecutive completions
  // This is a simplified version - in reality you might want to check
  // if they completed the most recent X workouts assigned to them
  return completionRecords.length > 0 ? Math.min(completionRecords.length, 10) : 0
}

/**
 * Build recent activity feed combining events and workouts
 */
function buildRecentActivity(attendanceRecords: any[], completionRecords: any[]): Array<{
  type: 'event' | 'workout'
  title: string
  date: string
  status: string
}> {
  const activities: Array<{
    type: 'event' | 'workout'
    title: string
    date: string
    status: string
  }> = []

  // Add attendance records
  attendanceRecords.slice(0, 5).forEach(record => {
    activities.push({
      type: 'event',
      title: (record.events as any)?.title || 'Unknown Event',
      date: record.created_at,
      status: record.status === 'attending' ? 'Attended' : 
              record.status === 'maybe' ? 'Maybe' : 'Declined'
    })
  })

  // Add completion records
  completionRecords.slice(0, 5).forEach(record => {
    activities.push({
      type: 'workout',
      title: (record.workouts as any)?.title || 'Unknown Workout',
      date: record.completed_at,
      status: 'Completed'
    })
  })

  // Sort by date (most recent first) and limit to 8 items
  return activities
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8)
}

/**
 * Return empty stats structure
 */
function getEmptyStats(): PersonalPerformanceStats {
  return {
    overallScore: 0,
    attendanceRate: 0,
    completionRate: 0,
    totalEvents: 0,
    totalWorkouts: 0,
    attendedEvents: 0,
    completedWorkouts: 0,
    currentAttendanceStreak: 0,
    currentCompletionStreak: 0,
    lastCompletedWorkout: null,
    recentActivity: []
  }
}
