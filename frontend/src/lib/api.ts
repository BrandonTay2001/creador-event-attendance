import { supabase } from './supabase'
import { Database } from '../types/database'

// Type definitions
export type Event = Database['public']['Tables']['events']['Row']
export type EventInsert = Database['public']['Tables']['events']['Insert']
export type Group = Database['public']['Tables']['groups']['Row']
export type Attendee = Database['public']['Tables']['attendees']['Row']
export type AttendeeInsert = Database['public']['Tables']['attendees']['Insert']

export interface AttendeeWithGroup extends Attendee {
  groups: Pick<Group, 'name' | 'email'>
}

export interface EventWithStats extends Event {
  attendee_count: number
  checked_in_count: number
}

// Event API functions
export async function getEvents(): Promise<Event[]> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true })

    if (error) {
      console.error('Error fetching events:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getEvents:', error)
    return []
  }
}

export async function getEvent(eventId: string): Promise<Event | null> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (error) {
      console.error('Error fetching event:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getEvent:', error)
    return null
  }
}

export async function createEvent(event: EventInsert): Promise<Event | null> {
  try {
    const { data, error } = await supabase
      .from('events')
      .insert(event)
      .select()
      .single()

    if (error) {
      console.error('Error creating event:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in createEvent:', error)
    return null
  }
}

// Attendee API functions
export async function getEventAttendees(eventId: string): Promise<AttendeeWithGroup[]> {
  try {
    const { data, error } = await supabase
      .from('attendees')
      .select(`
        *,
        groups (
          name,
          email
        )
      `)
      .eq('event_id', eventId)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching event attendees:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getEventAttendees:', error)
    return []
  }
}

export async function getGroupAttendees(eventId: string, groupId: string): Promise<AttendeeWithGroup[]> {
  try {
    const { data, error } = await supabase
      .from('attendees')
      .select(`
        *,
        groups (
          name,
          email
        )
      `)
      .eq('event_id', eventId)
      .eq('group_id', groupId)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching group attendees:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getGroupAttendees:', error)
    return []
  }
}

export async function markAttendance(
  attendeeIds: string[], 
  isAttending: boolean, 
  checkedInBy: string
): Promise<boolean> {
  try {
    const updateData = {
      is_attending: isAttending,
      checked_in_at: isAttending ? new Date().toISOString() : null,
      checked_in_by: isAttending ? checkedInBy : null,
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('attendees')
      .update(updateData)
      .in('id', attendeeIds)

    if (error) {
      console.error('Error updating attendance:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in markAttendance:', error)
    return false
  }
}

export async function toggleAttendeeAttendance(
  attendeeId: string, 
  checkedInBy: string
): Promise<boolean> {
  try {
    // First get current status
    const { data: currentData, error: fetchError } = await supabase
      .from('attendees')
      .select('is_attending')
      .eq('id', attendeeId)
      .single()

    if (fetchError) {
      console.error('Error fetching current attendance status:', fetchError)
      return false
    }

    const newStatus = !currentData.is_attending
    const updateData = {
      is_attending: newStatus,
      checked_in_at: newStatus ? new Date().toISOString() : null,
      checked_in_by: newStatus ? checkedInBy : null,
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('attendees')
      .update(updateData)
      .eq('id', attendeeId)

    if (error) {
      console.error('Error toggling attendance:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in toggleAttendeeAttendance:', error)
    return false
  }
}

// Group API functions
export async function getEventGroups(eventId: string): Promise<Group[]> {
  try {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('event_id', eventId)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching event groups:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getEventGroups:', error)
    return []
  }
}

// Statistics functions
export async function getEventStats(eventId: string): Promise<{
  total_attendees: number
  checked_in: number
  attendance_rate: number
}> {
  try {
    const { data, error } = await supabase
      .from('attendees')
      .select('is_attending')
      .eq('event_id', eventId)

    if (error) {
      console.error('Error fetching event stats:', error)
      return { total_attendees: 0, checked_in: 0, attendance_rate: 0 }
    }

    const total_attendees = data.length
    const checked_in = data.filter(a => a.is_attending).length
    const attendance_rate = total_attendees > 0 ? (checked_in / total_attendees) * 100 : 0

    return {
      total_attendees,
      checked_in,
      attendance_rate: Math.round(attendance_rate)
    }
  } catch (error) {
    console.error('Error in getEventStats:', error)
    return { total_attendees: 0, checked_in: 0, attendance_rate: 0 }
  }
}