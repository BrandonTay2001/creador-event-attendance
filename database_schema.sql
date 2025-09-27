-- Event Attendance Management - Database Schema with Groups
-- Admin adds attendees manually or via CSV import (group, name, email)
-- QR codes contain {group_id, event_id} for check-ins

-- ========================================
-- CORE TABLES
-- ========================================

-- Events table: stores all events created by admins
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Groups table: stores primary contact for each group
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Attendees table: stores all attendees for events
CREATE TABLE attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    is_attending BOOLEAN DEFAULT false,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    checked_in_by VARCHAR(255), -- Staff member name
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

CREATE INDEX idx_groups_event_id ON groups(event_id);
CREATE INDEX idx_groups_email ON groups(email);
CREATE INDEX idx_attendees_event_id ON attendees(event_id);
CREATE INDEX idx_attendees_group_id ON attendees(group_id);
CREATE INDEX idx_attendees_email ON attendees(email);
CREATE INDEX idx_attendees_event_group ON attendees(event_id, group_id);

-- ========================================
-- EXAMPLE USAGE QUERIES
-- ========================================

-- Create an event
-- INSERT INTO events (name, description, event_date, location) 
-- VALUES ('Tech Conference 2024', 'Annual technology conference', '2024-06-15 09:00:00-07', 'Convention Center');

-- Create groups and attendees (CSV import process)
-- Step 1: Insert group (primary contact)
-- INSERT INTO groups (event_id, name, email) 
-- VALUES ('event-uuid', 'John Doe', 'john.doe@email.com');

-- Step 2: Insert attendees for the group
-- INSERT INTO attendees (event_id, group_id, name, email) 
-- VALUES 
--   ('event-uuid', 'group-uuid', 'John Doe', 'john.doe@email.com'),
--   ('event-uuid', 'group-uuid', 'Jane Doe', 'jane.doe@email.com');

-- Get all attendees for a group (when QR code is scanned)
-- QR code contains: {"group_id": "group-uuid", "event_id": "event-uuid"}
-- SELECT a.*, g.name as group_contact_name, g.email as group_contact_email
-- FROM attendees a
-- JOIN groups g ON a.group_id = g.id
-- WHERE a.event_id = 'event-uuid' AND a.group_id = 'group-uuid';

-- Mark attendees as present
-- UPDATE attendees 
-- SET is_attending = true, checked_in_at = CURRENT_TIMESTAMP, checked_in_by = 'Staff Name'
-- WHERE id IN ('attendee-uuid-1', 'attendee-uuid-2');

-- Get all groups for an event (for admin dashboard)
-- SELECT g.*, COUNT(a.id) as attendee_count, COUNT(CASE WHEN a.is_attending THEN 1 END) as checked_in_count
-- FROM groups g
-- LEFT JOIN attendees a ON g.id = a.group_id
-- WHERE g.event_id = 'event-uuid'
-- GROUP BY g.id, g.name, g.email
-- ORDER BY g.name;

-- Get all attendees for an event (for admin dashboard)
-- SELECT a.*, g.name as group_contact_name, g.email as group_contact_email
-- FROM attendees a
-- JOIN groups g ON a.group_id = g.id
-- WHERE a.event_id = 'event-uuid'
-- ORDER BY g.name, a.name;

-- Export attendance data for CSV
-- SELECT 
--   e.name as event_name,
--   g.name as group_contact_name,
--   g.email as group_contact_email,
--   a.name as attendee_name,
--   a.email as attendee_email,
--   CASE WHEN a.is_attending THEN 'Yes' ELSE 'No' END as attended,
--   a.checked_in_at,
--   a.checked_in_by
-- FROM events e
-- JOIN groups g ON e.id = g.event_id
-- JOIN attendees a ON g.id = a.group_id
-- WHERE e.id = 'event-uuid'
-- ORDER BY g.name, a.name;