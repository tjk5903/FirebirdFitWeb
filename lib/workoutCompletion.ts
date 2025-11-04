'use client'

import { supabase } from './supabaseClient'

export interface WorkoutCompletion {
  id: string
  workout_id: string
  user_id: string
  completed_at: string
  completion_percentage: number
  notes: string | null
  created_at: string
}

// Mark a workout as complete
export async function markWorkoutComplete(
  workoutId: string,
  userId: string,
  completionPercentage: number = 100,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('💪 Marking workout complete:', { workoutId, userId, completionPercentage })

    const { error } = await supabase
      .from('workout_completions')
      .upsert({
        workout_id: workoutId,
        user_id: userId,
        completion_percentage: completionPercentage,
        notes: notes || null,
        completed_at: new Date().toISOString()
      }, {
        onConflict: 'workout_id,user_id'
      })

    if (error) {
      console.error('❌ Error marking workout complete:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Workout marked complete successfully')
    return { success: true }

  } catch (error) {
    console.error('❌ Error in markWorkoutComplete:', error)
    return { success: false, error: 'Failed to mark workout complete' }
  }
}

// Remove workout completion (mark as incomplete)
export async function markWorkoutIncomplete(
  workoutId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔄 Marking workout incomplete:', { workoutId, userId })

    const { error } = await supabase
      .from('workout_completions')
      .delete()
      .eq('workout_id', workoutId)
      .eq('user_id', userId)

    if (error) {
      console.error('❌ Error marking workout incomplete:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Workout marked incomplete successfully')
    return { success: true }

  } catch (error) {
    console.error('❌ Error in markWorkoutIncomplete:', error)
    return { success: false, error: 'Failed to mark workout incomplete' }
  }
}

// Check if a workout is completed by a user
export async function isWorkoutCompleted(
  workoutId: string,
  userId: string
): Promise<WorkoutCompletion | null> {
  try {
    const { data, error } = await supabase
      .from('workout_completions')
      .select('*')
      .eq('workout_id', workoutId)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No completion record found
        return null
      }
      console.error('❌ Error checking workout completion:', error)
      return null
    }

    return data as WorkoutCompletion

  } catch (error) {
    console.error('❌ Error in isWorkoutCompleted:', error)
    return null
  }
}

// Get completion statistics for a user
export async function getUserWorkoutStats(userId: string): Promise<{
  total_workouts: number
  completed_workouts: number
  completion_rate: number
  recent_completions: WorkoutCompletion[]
}> {
  try {
    // Get user's team workouts
    const { data: userTeams, error: teamsError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId)

    if (teamsError || !userTeams || userTeams.length === 0) {
      return { total_workouts: 0, completed_workouts: 0, completion_rate: 0, recent_completions: [] }
    }

    const teamIds = userTeams.map(t => t.team_id)

    // Get all workouts for user's teams
    const { data: workouts, error: workoutsError } = await supabase
      .from('workouts')
      .select('id')
      .in('team_id', teamIds)

    if (workoutsError || !workouts) {
      return { total_workouts: 0, completed_workouts: 0, completion_rate: 0, recent_completions: [] }
    }

    // Get user's completions
    const { data: completions, error: completionsError } = await supabase
      .from('workout_completions')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(10)

    if (completionsError) {
      console.error('❌ Error getting user workout stats:', completionsError)
      return { total_workouts: 0, completed_workouts: 0, completion_rate: 0, recent_completions: [] }
    }

    const total_workouts = workouts.length
    const completed_workouts = completions?.length || 0
    const completion_rate = total_workouts > 0 ? Math.round((completed_workouts / total_workouts) * 100) : 0

    return {
      total_workouts,
      completed_workouts,
      completion_rate,
      recent_completions: completions || []
    }

  } catch (error) {
    console.error('❌ Error in getUserWorkoutStats:', error)
    return { total_workouts: 0, completed_workouts: 0, completion_rate: 0, recent_completions: [] }
  }
}

// Get workout completion overview for coaches
export async function getWorkoutCompletionOverview(workoutId: string): Promise<{
  total_team_members: number
  completed_count: number
  completion_rate: number
  completions: Array<{
    user_id: string
    user_name: string
    completed_at: string
    completion_percentage: number
  }>
}> {
  try {
    console.log('📊 Getting workout completion overview for:', workoutId)

    // Get the workout and team info
    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .select('team_id')
      .eq('id', workoutId)
      .single()

    if (workoutError || !workout) {
      return { total_team_members: 0, completed_count: 0, completion_rate: 0, completions: [] }
    }

    // Get team members count
    const { data: teamMembers, error: membersError } = await supabase
      .from('team_members')
      .select('user_id')
      .eq('team_id', workout.team_id)

    if (membersError) {
      console.error('❌ Error getting team members:', membersError)
      return { total_team_members: 0, completed_count: 0, completion_rate: 0, completions: [] }
    }

    // Get completions for this workout
    const { data: completions, error: completionsError } = await supabase
      .from('workout_completions')
      .select(`
        user_id,
        completed_at,
        completion_percentage,
        users (
          name
        )
      `)
      .eq('workout_id', workoutId)

    if (completionsError) {
      console.error('❌ Error getting workout completions:', completionsError)
      return { total_team_members: 0, completed_count: 0, completion_rate: 0, completions: [] }
    }

    const total_team_members = teamMembers?.length || 0
    const completed_count = completions?.length || 0
    const completion_rate = total_team_members > 0 ? Math.round((completed_count / total_team_members) * 100) : 0

    const formattedCompletions = completions?.map(c => ({
      user_id: c.user_id,
      user_name: (c.users as any)?.name || 'Unknown',
      completed_at: c.completed_at,
      completion_percentage: c.completion_percentage
    })) || []

    return {
      total_team_members,
      completed_count,
      completion_rate,
      completions: formattedCompletions
    }

  } catch (error) {
    console.error('❌ Error in getWorkoutCompletionOverview:', error)
    return { total_team_members: 0, completed_count: 0, completion_rate: 0, completions: [] }
  }
}

// Get team workout completion overview (for coaches dashboard)
export async function getTeamWorkoutOverview(teamId: string): Promise<{
  total_workouts: number
  average_completion_rate: number
  top_performers: Array<{
    user_id: string
    user_name: string
    completion_rate: number
    completed_count: number
  }>
}> {
  try {
    console.log('📊 Getting team workout overview for team:', teamId)

    // Get all workouts for this team
    const { data: workouts, error: workoutsError } = await supabase
      .from('workouts')
      .select('id')
      .eq('team_id', teamId)

    if (workoutsError || !workouts) {
      return { total_workouts: 0, average_completion_rate: 0, top_performers: [] }
    }

    if (workouts.length === 0) {
      return { total_workouts: 0, average_completion_rate: 0, top_performers: [] }
    }

    const workoutIds = workouts.map(w => w.id)

    // Get all completions for these workouts
    const { data: completions, error: completionsError } = await supabase
      .from('workout_completions')
      .select(`
        user_id,
        workout_id,
        users (
          name
        )
      `)
      .in('workout_id', workoutIds)

    if (completionsError) {
      console.error('❌ Error getting team workout completions:', completionsError)
      return { total_workouts: 0, average_completion_rate: 0, top_performers: [] }
    }

    // Get team members
    const { data: teamMembers, error: membersError } = await supabase
      .from('team_members')
      .select('user_id')
      .eq('team_id', teamId)

    if (membersError) {
      return { total_workouts: 0, average_completion_rate: 0, top_performers: [] }
    }

    const totalPossibleCompletions = workouts.length * (teamMembers?.length || 0)
    const actualCompletions = completions?.length || 0
    const average_completion_rate = totalPossibleCompletions > 0 ? Math.round((actualCompletions / totalPossibleCompletions) * 100) : 0

    // Calculate individual completion rates
    const userStats = new Map()
    completions?.forEach(c => {
      const userId = c.user_id
      if (!userStats.has(userId)) {
        userStats.set(userId, {
          user_id: userId,
          user_name: (c.users as any)?.name || 'Unknown',
          completed_count: 0
        })
      }
      userStats.get(userId).completed_count++
    })

    // Convert to array and calculate rates
    const top_performers = Array.from(userStats.values())
      .map(stats => ({
        user_id: stats.user_id,
        user_name: stats.user_name,
        completed_count: stats.completed_count,
        completion_rate: Math.round((stats.completed_count / workouts.length) * 100)
      }))
      .sort((a, b) => b.completion_rate - a.completion_rate)
      .slice(0, 5) // Top 5 performers

    return {
      total_workouts: workouts.length,
      average_completion_rate,
      top_performers
    }

  } catch (error) {
    console.error('❌ Error in getTeamWorkoutOverview:', error)
    return { total_workouts: 0, average_completion_rate: 0, top_performers: [] }
  }
}
