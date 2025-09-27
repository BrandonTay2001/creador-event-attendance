# Database Setup - Event Attendance Management

## ✅ Setup Complete!

Your Supabase database has been successfully set up with the following:

### Tables Created:
1. **events** - Stores event information
2. **groups** - Stores primary contact info for each group
3. **attendees** - Stores individual attendees linked to groups

### Sample Data Added:
- 1 sample event: "Tech Conference 2024"
- 2 sample groups with primary contacts
- 3 sample attendees

## Database Schema

```sql
-- Events table
events (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)

-- Groups table (primary contact for each group)
groups (
    id UUID PRIMARY KEY,
    event_id UUID REFERENCES events(id),
    name VARCHAR(255) NOT NULL,    -- Primary contact name
    email VARCHAR(255) NOT NULL,   -- Primary contact email (group identifier)
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)

-- Attendees table
attendees (
    id UUID PRIMARY KEY,
    event_id UUID REFERENCES events(id),
    group_id UUID REFERENCES groups(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    is_attending BOOLEAN DEFAULT false,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    checked_in_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
```

## Your Supabase Connection Details

- **Project URL:** https://lgxzqlxlkzvzyybsubxj.supabase.co
- **Anon Key:** (stored in `frontend/src/lib/supabase.ts`)
- **TypeScript Types:** Available in `frontend/src/types/database.ts`

## Workflow Examples

### 1. CSV Import Process
When importing a CSV with columns `(group, name, email)`:

```typescript
// 1. Create or find group
const { data: group } = await supabase
  .from('groups')
  .upsert({ 
    event_id: 'event-uuid',
    name: 'Primary Contact Name',
    email: 'primary@email.com' 
  })
  .select()
  .single()

// 2. Create attendees
const { data: attendees } = await supabase
  .from('attendees')
  .insert([
    { event_id: 'event-uuid', group_id: group.id, name: 'Person 1', email: 'person1@email.com' },
    { event_id: 'event-uuid', group_id: group.id, name: 'Person 2', email: 'person2@email.com' }
  ])
```

### 2. QR Code Generation
QR codes should contain JSON: `{"group_id": "uuid", "event_id": "uuid"}`

### 3. Check-in Process (QR Scan)
```typescript
// When QR code is scanned, get all attendees for the group
const qrData = JSON.parse(scannedQrCode) // {group_id: "uuid", event_id: "uuid"}

const { data: attendees } = await supabase
  .from('attendees')
  .select('*, groups(name, email)')
  .eq('event_id', qrData.event_id)
  .eq('group_id', qrData.group_id)

// Mark selected attendees as present
const { data } = await supabase
  .from('attendees')
  .update({ 
    is_attending: true, 
    checked_in_at: new Date().toISOString(),
    checked_in_by: 'Staff Name'
  })
  .in('id', selectedAttendeeIds)
```

### 4. Export Data for CSV
```typescript
const { data } = await supabase
  .from('attendees')
  .select(`
    *,
    groups(name, email),
    events(name)
  `)
  .eq('event_id', 'event-uuid')
  .order('groups(name)', { ascending: true })
```

## Common Queries

```sql
-- Get all groups for an event with attendee counts
SELECT 
  g.*, 
  COUNT(a.id) as attendee_count, 
  COUNT(CASE WHEN a.is_attending THEN 1 END) as checked_in_count
FROM groups g
LEFT JOIN attendees a ON g.id = a.group_id
WHERE g.event_id = 'event-uuid'
GROUP BY g.id, g.name, g.email
ORDER BY g.name;

-- Get attendance summary for an event
SELECT 
  e.name as event_name,
  COUNT(DISTINCT g.id) as total_groups,
  COUNT(a.id) as total_attendees,
  COUNT(CASE WHEN a.is_attending THEN 1 END) as total_checked_in
FROM events e
LEFT JOIN groups g ON e.id = g.event_id
LEFT JOIN attendees a ON g.id = a.group_id
WHERE e.id = 'event-uuid'
GROUP BY e.id, e.name;
```

## Next Steps

1. **Install Supabase Client**: Add `@supabase/supabase-js` to your frontend dependencies
2. **Build Admin Dashboard**: Create event management and attendee import functionality
3. **Build Check-in Interface**: QR code scanner and manual check-in forms
4. **Add Row Level Security (RLS)**: Set up proper access controls (optional for now)

Your database is ready to use! 🚀