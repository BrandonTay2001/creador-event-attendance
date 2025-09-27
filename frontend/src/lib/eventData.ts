export interface Person {
  id: string;
  groupId: string;
  name: string;
  email: string;
  role?: string;
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

// Mock data for different events
export let mockEventData: Record<string, Event> = {
  'event:team-meeting-2024': {
    id: 'event:team-meeting-2024',
    name: 'Team Meeting - Q4 Planning',
    description: 'Quarterly planning session for development team',
    date: '2024-12-15',
    people: [
      { id: '1', groupId: 'GRP001', name: 'Alice Johnson', email: 'alice@company.com', role: 'Manager', isPresent: false },
      { id: '2', groupId: 'GRP001', name: 'Bob Smith', email: 'bob@company.com', role: 'Developer', isPresent: false },
      { id: '3', groupId: 'GRP001', name: 'Carol Davis', email: 'carol@company.com', role: 'Designer', isPresent: false },
      { id: '4', groupId: 'GRP001', name: 'David Wilson', email: 'david@company.com', role: 'Developer', isPresent: false },
      { id: '5', groupId: 'GRP001', name: 'Eva Martinez', email: 'eva@company.com', role: 'Product Manager', isPresent: false },
    ]
  },
  'event:company-retreat-2024': {
    id: 'event:company-retreat-2024',
    name: 'Annual Company Retreat',
    description: 'Team building and strategic planning retreat',
    date: '2024-11-20',
    people: [
      { id: '6', groupId: 'GRP002', name: 'Frank Brown', email: 'frank@company.com', role: 'CEO', isPresent: false },
      { id: '7', groupId: 'GRP002', name: 'Grace Lee', email: 'grace@company.com', role: 'CTO', isPresent: false },
      { id: '8', groupId: 'GRP002', name: 'Henry Taylor', email: 'henry@company.com', role: 'HR Manager', isPresent: false },
      { id: '9', groupId: 'GRP002', name: 'Iris Chen', email: 'iris@company.com', role: 'Marketing', isPresent: false },
      { id: '10', groupId: 'GRP002', name: 'Jack Wilson', email: 'jack@company.com', role: 'Sales', isPresent: false },
      { id: '11', groupId: 'GRP002', name: 'Kate Anderson', email: 'kate@company.com', role: 'Finance', isPresent: false },
    ]
  },
  'event:training-session-2024': {
    id: 'event:training-session-2024',
    name: 'Security Training Session',
    description: 'Cybersecurity awareness and best practices training',
    date: '2024-10-30',
    people: [
      { id: '12', groupId: 'GRP003', name: 'Liam Murphy', email: 'liam@company.com', role: 'Junior Dev', isPresent: false },
      { id: '13', groupId: 'GRP003', name: 'Maya Patel', email: 'maya@company.com', role: 'QA Engineer', isPresent: false },
      { id: '14', groupId: 'GRP003', name: 'Noah Garcia', email: 'noah@company.com', role: 'DevOps', isPresent: false },
      { id: '15', groupId: 'GRP003', name: 'Olivia Moore', email: 'olivia@company.com', role: 'Intern', isPresent: false },
    ]
  }
};

export const getEventList = (): Event[] => {
  return Object.values(mockEventData);
};

// Admin functions for managing events and guests
export const createEvent = (event: Omit<Event, 'id'>): Event => {
  const id = `event:${event.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
  const newEvent = { ...event, id };
  mockEventData[id] = newEvent;
  return newEvent;
};

export const updateEvent = (eventId: string, updates: Partial<Event>): Event | null => {
  if (mockEventData[eventId]) {
    mockEventData[eventId] = { ...mockEventData[eventId], ...updates };
    return mockEventData[eventId];
  }
  return null;
};

export const deleteEvent = (eventId: string): boolean => {
  if (mockEventData[eventId]) {
    delete mockEventData[eventId];
    return true;
  }
  return false;
};

export const addGuest = (eventId: string, guest: Omit<Person, 'id'>): Person | null => {
  if (mockEventData[eventId]) {
    const id = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newGuest = { ...guest, id };
    mockEventData[eventId].people.push(newGuest);
    return newGuest;
  }
  return null;
};

export const updateGuest = (eventId: string, guestId: string, updates: Partial<Person>): Person | null => {
  if (mockEventData[eventId]) {
    const guestIndex = mockEventData[eventId].people.findIndex(p => p.id === guestId);
    if (guestIndex !== -1) {
      mockEventData[eventId].people[guestIndex] = { 
        ...mockEventData[eventId].people[guestIndex], 
        ...updates 
      };
      return mockEventData[eventId].people[guestIndex];
    }
  }
  return null;
};

export const removeGuest = (eventId: string, guestId: string): boolean => {
  if (mockEventData[eventId]) {
    const initialLength = mockEventData[eventId].people.length;
    mockEventData[eventId].people = mockEventData[eventId].people.filter(p => p.id !== guestId);
    return mockEventData[eventId].people.length < initialLength;
  }
  return false;
};