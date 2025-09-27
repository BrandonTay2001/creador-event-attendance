import { supabase } from './supabase'

export type UserRole = 'admin' | 'staff'

export interface UserRoleData {
  id: string
  user_id: string
  role: UserRole
  created_at: string | null
  updated_at: string | null
}

/**
 * Get user role by user ID
 */
export async function getUserRole(userId: string): Promise<UserRole | null> {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single()
    
    if (error) {
      console.error('Error fetching user role:', error)
      return null
    }
    
    return data?.role as UserRole || null
  } catch (error) {
    console.error('Error in getUserRole:', error)
    return null
  }
}

/**
 * Create or update user role (requires admin privileges)
 */
export async function upsertUserRole(userId: string, role: UserRole): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role,
        updated_at: new Date().toISOString()
      })
    
    if (error) {
      console.error('Error upserting user role:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error in upsertUserRole:', error)
    return false
  }
}

/**
 * Check if user has admin privileges
 */
export function isAdmin(role: UserRole | null): boolean {
  return role === 'admin'
}

/**
 * Get all users with their roles (admin only)
 */
export async function getAllUsersWithRoles() {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching users with roles:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Error in getAllUsersWithRoles:', error)
    return []
  }
}