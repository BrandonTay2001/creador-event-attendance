# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Event Management App - A React-based application for managing events, tracking attendance, and checking in guests via QR code scanning. Uses Supabase as the backend with role-based access control (admin/staff/superAdmin).

## Development Commands

- `npm install` - Install dependencies (also copies TinyMCE to public directory via postinstall script)
- `npm run dev` - Start development server (runs on port 3000, auto-opens browser)
- `npm run build` - Create production build (outputs to `build/` directory)

## Technology Stack

- **Frontend**: React 18.3.1 with TypeScript, Vite 6.3.5 build tool
- **Backend**: Supabase (PostgreSQL) with Supabase Auth
- **Authentication**: Microsoft Azure OAuth integration (via Supabase Auth)
- **UI**: Radix UI primitives with shadcn/ui components, Tailwind CSS
- **Rich Text**: TinyMCE editor
- **QR Code**: Custom QR scanner (@yudiel/react-qr-scanner)
- **Email**: Microsoft Graph API integration

## Architecture

### Database Schema (Supabase)

- `events` - Event information (name, date, location, description)
- `attendees` - Guest information with check-in status
- `groups` - Groupings for attendees
- `profiles` - User profile information
- `user_roles` - Role-based access control (admin, staff, superAdmin, disabled, deleted)

### Key Directories

- `/src/components/` - Main application components (AttendancePage, AdminDashboard, EventManagement, UserManagement, etc.)
- `/src/components/ui/` - Reusable shadcn/ui components (Radix UI based)
- `/src/contexts/` - React Context providers (AuthContext for authentication state)
- `/src/lib/` - Core business logic (api.ts for DB operations, supabase.ts client, roles.ts for RBAC, microsoftGraph.ts for email)
- `/src/types/` - TypeScript types (database.ts generated from Supabase schema)

### Authentication & Authorization

Authentication is managed through `AuthContext.tsx`:

1. Uses Supabase Auth with Microsoft Azure OAuth
2. Microsoft access token is stored in sessionStorage for email functionality
3. Role-based access control via `user_roles` table
4. New users default to "staff" role
5. Role utilities in `lib/roles.ts`: `isAdmin()`, `isSuperAdmin()`, `getUserRole()`, `upsertUserRole()`

### State Management

- React Context API for authentication state
- Local component state for UI interactions
- No global state management library (uses React's built-in state)

### Path Aliases

- `@/*` maps to `./src/*` (configured in both tsconfig.json and vite.config.ts)
- Vite config has extensive package aliasing for dependency resolution

### Important Notes

- TypeScript strict mode is enabled
- The postinstall script copies TinyMCE to the public directory
- Microsoft OAuth requires specific scopes: `openid email profile User.Read Mail.Send`
- Email sending requires Microsoft Graph API access token from OAuth flow
- QR scanner component is in `AttendancePage.tsx` for guest check-in
- TinyMCE is used for event description editing
