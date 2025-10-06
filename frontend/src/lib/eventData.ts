import { supabase } from './supabase';

export interface Person {
  id: string;
  groupId: string;
  groupName?: string;
  name: string;
  email: string;
  isPresent: boolean;
}

export interface Event {
  id: string;  
  name: string;
  description?: string;
  date?: string;
  time?: string;
  location?: string;
  people: Person[];
}

export interface Group {
  id: string;
  name: string;
  email: string;
  eventId: string;
}

// Fetch events from Supabase with their attendees
export const getEventList = async (): Promise<Event[]> => {
  try {
    // Fetch all events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: false });

    if (eventsError) throw eventsError;
    if (!events) return [];

    // Fetch attendees for all events with group names
    const eventIds = events.map(e => e.id);
    const { data: attendees, error: attendeesError } = await supabase
      .from('attendees')
      .select(`
        *,
        groups (name)
      `)
      .in('event_id', eventIds);

    if (attendeesError) throw attendeesError;

    // Map database events to our Event interface
    const eventList: Event[] = events.map(event => {
      const eventAttendees = attendees?.filter(a => a.event_id === event.id) || [];
      
      return {
        id: event.id,
        name: event.name,
        description: event.description || undefined,
        date: event.event_date,
        location: event.location || undefined,
        people: eventAttendees.map(attendee => ({
          id: attendee.id,
          groupId: attendee.group_id,
          groupName: attendee.groups?.name,
          name: attendee.name,
          email: attendee.email,
          isPresent: attendee.is_attending || false,
        }))
      };
    });

    return eventList;
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
};

// Admin functions for managing events and guests
export const createEvent = async (event: Omit<Event, 'id'>): Promise<Event | null> => {
  try {
    const { data, error } = await supabase
      .from('events')
      .insert({
        name: event.name,
        description: event.description,
        event_date: event.date || new Date().toISOString(),
        location: event.location,
      })
      .select()
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      description: data.description || undefined,
      date: data.event_date,
      location: data.location || undefined,
      people: [],
    };
  } catch (error) {
    console.error('Error creating event:', error);
    return null;
  }
};

export const updateEvent = async (eventId: string, updates: Partial<Event>): Promise<Event | null> => {
  try {
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.date !== undefined) updateData.event_date = updates.date;
    if (updates.location !== undefined) updateData.location = updates.location;

    const { data, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw error;
    if (!data) return null;

    // Fetch attendees for the updated event with group names
    const { data: attendees } = await supabase
      .from('attendees')
      .select(`
        *,
        groups (name)
      `)
      .eq('event_id', eventId);

    return {
      id: data.id,
      name: data.name,
      description: data.description || undefined,
      date: data.event_date,
      location: data.location || undefined,
      people: (attendees || []).map(attendee => ({
        id: attendee.id,
        groupId: attendee.group_id,
        groupName: attendee.groups?.name,
        name: attendee.name,
        email: attendee.email,
        isPresent: attendee.is_attending || false,
      })),
    };
  } catch (error) {
    console.error('Error updating event:', error);
    return null;
  }
};

export const deleteEvent = async (eventId: string): Promise<boolean> => {
  try {
    // Delete attendees first (cascade should handle this, but being explicit)
    await supabase
      .from('attendees')
      .delete()
      .eq('event_id', eventId);

    // Delete the event
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting event:', error);
    return false;
  }
};

export const addGuest = async (eventId: string, guestData: { name: string; email: string; groupName: string; isPresent: boolean }): Promise<Person | null> => {
  try {
    let groupId: string;
    
    // Check if this is a "Create New Group" request
    if (guestData.groupName === 'CREATE_NEW_GROUP') {
      // Create a new group with the guest's name and email
      const newGroup = await createGroup(eventId, guestData.name, guestData.email);
      if (!newGroup) {
        throw new Error('Failed to create new group');
      }
      groupId = newGroup.id;
    } else {
      // Find existing group by name
      const existingGroup = await findGroupByName(eventId, guestData.groupName);
      if (!existingGroup) {
        throw new Error(`Group "${guestData.groupName}" not found`);
      }
      groupId = existingGroup.id;
    }

    // Now create the attendee
    const { data, error } = await supabase
      .from('attendees')
      .insert({
        event_id: eventId,
        group_id: groupId,
        name: guestData.name,
        email: guestData.email,
        is_attending: guestData.isPresent,
      })
      .select(`
        *,
        groups (name)
      `)
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      groupId: data.group_id,
      groupName: data.groups?.name,
      name: data.name,
      email: data.email,
      isPresent: data.is_attending || false,
    };
  } catch (error) {
    console.error('Error adding guest:', error);
    return null;
  }
};

export const updateGuest = async (eventId: string, guestId: string, updates: Partial<Person>): Promise<Person | null> => {
  try {
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.groupId !== undefined) updateData.group_id = updates.groupId;
    if (updates.isPresent !== undefined) updateData.is_attending = updates.isPresent;

    const { data, error } = await supabase
      .from('attendees')
      .update(updateData)
      .eq('id', guestId)
      .eq('event_id', eventId)
      .select(`
        *,
        groups (name)
      `)
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      groupId: data.group_id,
      groupName: data.groups?.name,
      name: data.name,
      email: data.email,
      isPresent: data.is_attending || false,
    };
  } catch (error) {
    console.error('Error updating guest:', error);
    return null;
  }
};

export const removeGuest = async (eventId: string, guestId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('attendees')
      .delete()
      .eq('id', guestId)
      .eq('event_id', eventId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error removing guest:', error);
    return false;
  }
};

// Group management functions
export const getGroupsForEvent = async (eventId: string): Promise<Group[]> => {
  try {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('event_id', eventId)
      .order('name');

    if (error) throw error;
    if (!data) return [];

    return data.map(group => ({
      id: group.id,
      name: group.name,
      email: group.email,
      eventId: group.event_id,
    }));
  } catch (error) {
    console.error('Error fetching groups:', error);
    return [];
  }
};

export const createGroup = async (eventId: string, name: string, email: string): Promise<Group | null> => {
  try {
    const { data, error } = await supabase
      .from('groups')
      .insert({
        event_id: eventId,
        name: name,
        email: email,
      })
      .select()
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      eventId: data.event_id,
    };
  } catch (error) {
    console.error('Error creating group:', error);
    return null;
  }
};

export const findGroupByName = async (eventId: string, name: string): Promise<Group | null> => {
  try {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('event_id', eventId)
      .eq('name', name)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      eventId: data.event_id,
    };
  } catch (error) {
    console.error('Error finding group by name:', error);
    return null;
  }
};
