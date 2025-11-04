import { supabase } from '@/lib/supabaseClient'

export interface TeamPerformanceStats {
  overallPerformance: number
  attendanceRate: number
  completionRate: number
  totalEvents: number
  totalWorkouts: number
  attendedEvents: number
  completedWorkouts: number
  teamSize: number
}

export interface IndividualPerformanceStats {
  userId: string
  userName: string
  attendanceRate: number
  completionRate: number
  overallPerformance: number
  attendedEvents: number
  totalEvents: number
  completedWorkouts: number
  totalWorkouts: number
}

/**
 * Calculate team performance statistics for a specific team
 */
export async function getTeamPerformanceStats(teamId: string): Promise<TeamPerformanceStats> {
  try {
    // Get team size first
    const { data: teamMembers, error: teamMembersError } = await supabase
      .from('team_members')
      .select('user_id')
      .eq('team_id', teamId)

    if (teamMembersError) throw teamMembersError

    const teamSize = teamMembers?.length || 0

    // Get all events for this team
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id')
      .eq('team_id', teamId)

    if (eventsError) throw eventsError

    // Get all workouts for this team
    const { data: workouts, error: workoutsError } = await supabase
      .from('workouts')
      .select('id')
      .eq('team_id', teamId)

    if (workoutsError) throw workoutsError

    const totalEvents = events?.length || 0
    const totalWorkouts = workouts?.length || 0

    // Get attendance data (only "attending" status counts as attended)
    const { data: attendance, error: attendanceError } = await supabase
      .from('event_attendance')
      .select('event_id, status')
      .in('event_id', events?.map(e => e.id) || [])
      .eq('status', 'attending')

    if (attendanceError) throw attendanceError

    // Get workout completion data
    const { data: completions, error: completionsError } = await supabase
      .from('workout_completions')
      .select('workout_id')
      .in('workout_id', workouts?.map(w => w.id) || [])

    if (completionsError) throw completionsError

    const attendedEvents = attendance?.length || 0
    const completedWorkouts = completions?.length || 0

    // Calculate rates properly (total interactions / possible interactions)
    const possibleAttendances = totalEvents * teamSize
    const possibleCompletions = totalWorkouts * teamSize
    
    const attendanceRate = possibleAttendances > 0 ? Math.round((attendedEvents / possibleAttendances) * 100) : 0
    const completionRate = possibleCompletions > 0 ? Math.round((completedWorkouts / possibleCompletions) * 100) : 0

    // Calculate overall performance (weighted average)
    // If no events, base it only on completion rate
    // If no workouts, base it only on attendance rate
    // If both exist, average them
    let overallPerformance = 0
    if (totalEvents > 0 && totalWorkouts > 0) {
      overallPerformance = Math.round((attendanceRate + completionRate) / 2)
    } else if (totalEvents > 0) {
      overallPerformance = attendanceRate
    } else if (totalWorkouts > 0) {
      overallPerformance = completionRate
    }

    return {
      overallPerformance,
      attendanceRate,
      completionRate,
      totalEvents,
      totalWorkouts,
      attendedEvents,
      completedWorkouts,
      teamSize
    }
  } catch (error) {
    console.error('Error calculating team performance:', error)
    return {
      overallPerformance: 0,
      attendanceRate: 0,
      completionRate: 0,
      totalEvents: 0,
      totalWorkouts: 0,
      attendedEvents: 0,
      completedWorkouts: 0,
      teamSize: 0
    }
  }
}

/**
 * Get individual performance stats for all team members
 */
export async function getIndividualPerformanceStats(teamId: string): Promise<IndividualPerformanceStats[]> {
  try {
    // Get all team members
    const { data: teamMembers, error: membersError } = await supabase
      .from('team_members')
      .select(`
        user_id,
        users!inner(
          id,
          full_name
        )
      `)
      .eq('team_id', teamId)

    if (membersError) throw membersError

    // Get all events and workouts for this team
    const { data: events } = await supabase
      .from('events')
      .select('id')
      .eq('team_id', teamId)

    const { data: workouts } = await supabase
      .from('workouts')
      .select('id')
      .eq('team_id', teamId)

    const totalEvents = events?.length || 0
    const totalWorkouts = workouts?.length || 0

    const individualStats: IndividualPerformanceStats[] = []

    for (const member of teamMembers || []) {
      const userId = member.user_id
      const userName = (member.users as any)?.full_name || 'Unknown User'

      // Get user's attendance
      const { data: userAttendance } = await supabase
        .from('event_attendance')
        .select('event_id')
        .eq('user_id', userId)
        .eq('status', 'attending')
        .in('event_id', events?.map(e => e.id) || [])

      // Get user's workout completions
      const { data: userCompletions } = await supabase
        .from('workout_completions')
        .select('workout_id')
        .eq('user_id', userId)
        .in('workout_id', workouts?.map(w => w.id) || [])

      const attendedEvents = userAttendance?.length || 0
      const completedWorkouts = userCompletions?.length || 0

      const attendanceRate = totalEvents > 0 ? Math.round((attendedEvents / totalEvents) * 100) : 0
      const completionRate = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0
      const overallPerformance = Math.round((attendanceRate + completionRate) / 2)

      individualStats.push({
        userId,
        userName,
        attendanceRate,
        completionRate,
        overallPerformance,
        attendedEvents,
        totalEvents,
        completedWorkouts,
        totalWorkouts
      })
    }

    // Sort by overall performance (highest first)
    return individualStats.sort((a, b) => b.overallPerformance - a.overallPerformance)
  } catch (error) {
    console.error('Error getting individual performance stats:', error)
    return []
  }
}

/**
 * Get performance stats for a specific user across all their teams
 */
export async function getUserPerformanceStats(userId: string): Promise<{
  totalAttendanceRate: number
  totalCompletionRate: number
  overallPerformance: number
  teamsCount: number
}> {
  try {
    // Get user's teams
    const { data: userTeams } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId)

    if (!userTeams?.length) {
      return {
        totalAttendanceRate: 0,
        totalCompletionRate: 0,
        overallPerformance: 0,
        teamsCount: 0
      }
    }

    const teamIds = userTeams.map(t => t.team_id)

    // Get all events from user's teams
    const { data: events } = await supabase
      .from('events')
      .select('id')
      .in('team_id', teamIds)

    // Get all workouts from user's teams
    const { data: workouts } = await supabase
      .from('workouts')
      .select('id')
      .in('team_id', teamIds)

    const totalEvents = events?.length || 0
    const totalWorkouts = workouts?.length || 0

    // Get user's attendance
    const { data: userAttendance } = await supabase
      .from('event_attendance')
      .select('event_id')
      .eq('user_id', userId)
      .eq('status', 'attending')

    // Get user's completions
    const { data: userCompletions } = await supabase
      .from('workout_completions')
      .select('workout_id')
      .eq('user_id', userId)

    const attendedEvents = userAttendance?.length || 0
    const completedWorkouts = userCompletions?.length || 0

    const totalAttendanceRate = totalEvents > 0 ? Math.round((attendedEvents / totalEvents) * 100) : 0
    const totalCompletionRate = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0
    const overallPerformance = Math.round((totalAttendanceRate + totalCompletionRate) / 2)

    return {
      totalAttendanceRate,
      totalCompletionRate,
      overallPerformance,
      teamsCount: userTeams.length
    }
  } catch (error) {
    console.error('Error getting user performance stats:', error)
    return {
      totalAttendanceRate: 0,
      totalCompletionRate: 0,
      overallPerformance: 0,
      teamsCount: 0
    }
  }
}
