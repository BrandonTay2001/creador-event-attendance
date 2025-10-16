# Event Attendance Management System - AI Coding Guide

## Architecture Overview

This is a **React + Vite + TypeScript** event attendance system with **Supabase** backend and **Microsoft Graph API** integration. The app uses a **group-based attendance model** where QR codes represent entire groups, not individual attendees.

### Core Data Model (3-table hierarchy)
- `events` → `groups` (primary contact) → `attendees` (linked to group)
- QR codes contain: `{"group_id": "uuid", "event_id": "uuid"}`
- When scanning a QR code, ALL attendees in that group are shown for check-in

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Radix UI components, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth with Microsoft OAuth)
- **Email**: Microsoft Graph API (OAuth access token stored in sessionStorage)
- **QR Scanning**: `@yudiel/react-qr-scanner` package

## Critical Patterns

### 1. Dual-Mode Components (Manual vs QR)
Components like `AttendancePage` support two distinct modes:
```typescript
// Manual mode: show all attendees for selected event
<AttendancePage eventId="uuid" onBack={...} />

// QR mode: show only group attendees from scanned QR code
<AttendancePage qrData='{"group_id":"uuid","event_id":"uuid"}' onBack={...} />
```
**Pattern**: Check which prop is present to determine filtering behavior. QR mode skips search UI since group is pre-filtered.

### 2. Microsoft Graph Authentication Flow
```typescript
// 1. User signs in with Microsoft OAuth via Supabase
await supabase.auth.signInWithOAuth({ provider: 'azure' })

// 2. Access token extracted in AuthContext from session.provider_token
if (session?.provider_token && session?.user.app_metadata?.provider === 'azure') {
  setMicrosoftAccessToken(session.provider_token)
  sessionStorage.setItem('microsoft_access_token', session.provider_token)
}

// 3. Graph client initialized with stored token
const graphService = createGraphEmailService(microsoftAccessToken)
await graphService.sendEmail(recipients, subject, htmlContent)
```
**Critical**: Token is stored in `sessionStorage` for persistence across page reloads. Check `AuthContext.tsx` for implementation.

### 3. Data Fetching with Joins
Use Supabase's nested select syntax to join groups with attendees:
```typescript
const { data } = await supabase
  .from('attendees')
  .select(`
    *,
    groups (name, email)
  `)
  .eq('event_id', eventId)
```
**Pattern**: Always join with `groups` table to get group contact info. See `api.ts` for examples.

### 4. Group-First Import Flow
When importing attendees via CSV (`BulkImportDialog`):
1. CSV must have columns: `name`, `email`, `groupName` (where groupName is the primary contact person's name)
2. System automatically finds existing groups by contact name or creates new ones
3. Import maps to `attendees` table with `group_id` foreign key

**Important**: Groups represent a primary contact person. Multiple attendees can be associated with the same group contact.

### 5. Role-Based Access Control
```typescript
// Check user role via Supabase user_roles table
const role = await getUserRole(userId) // returns 'admin' | 'staff' | null

// Conditional UI rendering
{isAdmin(role) && <AdminOnlyFeature />}
```
**Pattern**: Roles stored in separate `user_roles` table, not in auth metadata. See `lib/roles.ts`.

## File Organization

### API Layer (`lib/`)
- `api.ts`: Supabase queries (events, attendees, groups)
- `eventData.ts`: Legacy/compatibility layer wrapping Supabase calls
- `supabase.ts`: Client initialization (hardcoded credentials)
- `microsoftGraph.ts`: Raw Graph API calls
- `graphService.ts`: Graph client wrapper with auth provider

**Convention**: Use `api.ts` functions for new features. `eventData.ts` maintains backward compatibility.

### Component Patterns
- **Dialog components**: Prefixed with action (e.g., `AddGuestDialog`, `EditEventDialog`)
- **Page components**: Suffixed with "Page" (e.g., `AttendancePage`, `LoginPage`)
- **UI components**: Located in `components/ui/` (Radix-based, never modify directly)

### State Management
- **Auth state**: Centralized in `AuthContext` (user, session, Microsoft token)
- **Local state**: Component-level with `useState` (no global state library)
- **Data refresh**: Manual reload via `loadEvent()` or similar functions after mutations

## Development Workflows

### Build & Run
```bash
cd frontend
npm i              # Install dependencies
npm run dev        # Start dev server (Vite)
npm run build      # Production build
```

### Database Setup
1. Execute `database_schema.sql` in Supabase SQL editor
2. Configure RLS policies for `events`, `groups`, `attendees`, `user_roles`
3. Set up Microsoft OAuth provider in Supabase Auth settings
4. See `DATABASE_SETUP.md` for detailed instructions

### Microsoft Graph Setup
1. Azure AD app must request `Mail.Send` scope
2. Redirect URI: `https://lgxzqlxlkzvzyybsubxj.supabase.co/auth/v1/callback`
3. Access token expires - handle errors in `graphService.ts`

## Common Pitfalls

1. **Group IDs in QR codes**: QR data MUST contain both `group_id` and `event_id`. Scanning shows all attendees for that group.

2. **Email sending**: Requires Microsoft OAuth sign-in. Email/password auth won't provide Graph API token.

3. **Type imports**: Database types generated in `types/database.ts`. Use type helpers:
   ```typescript
   import type { Event, Attendee } from '@/lib/api'
   import type { Database } from '@/types/database'
   ```

4. **Vite aliases**: Uses extensive version-specific aliases in `vite.config.ts`. Import components without version suffixes:
   ```typescript
   import { toast } from 'sonner' // not 'sonner@2.0.3'
   ```

5. **Attendance updates**: Use optimistic UI updates in `AttendancePage.tsx` - update local state immediately, then sync to backend.

## Integration Points

- **Supabase**: Auth, database, real-time subscriptions (not currently used)
- **Microsoft Graph**: Email sending only (no calendar/contacts integration)
- **QR Scanner**: Camera-based only, no manual QR input in current version

## When Adding Features

1. **New attendee fields**: Update `database.ts` types, `database_schema.sql`, and API layer
2. **New email features**: Extend `GraphEmailService` class in `graphService.ts`
3. **New roles**: Modify `UserRole` type in `roles.ts` and update RLS policies
4. **New UI components**: Use existing Radix components from `components/ui/`

---

**Key Files to Reference**:
- Architecture: `App.tsx`, `AuthContext.tsx`  
- Data model: `database_schema.sql`, `types/database.ts`
- API patterns: `lib/api.ts`, `lib/eventData.ts`
- Dual-mode example: `components/AttendancePage.tsx`
