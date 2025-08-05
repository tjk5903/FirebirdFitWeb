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