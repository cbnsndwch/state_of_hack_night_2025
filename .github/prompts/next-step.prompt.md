# Next Step: Implement Luma Webhook + Email OTP Authentication

## Context

This is the **hello_miami** project — the community site and member portal for Hello Miami, a "no-ego" builder community for Miami hackers. We're implementing user authentication via Luma calendar integration + Supabase email OTP.

## Current Stack

- React 19 + React Router 7 (SSR framework mode)
- Vite + TypeScript + Tailwind CSS
- MongoDB for data (profiles, projects, badges, attendance)
- Supabase for **auth only** (NOT for data storage) + file uploads
- Luma for event management (external service)

## What We're Building

### Authentication Flow (Email OTP Only - NO GitHub/Social Login)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. CALENDAR SUBSCRIPTION (Luma webhook: calendar.person.subscribed)         │
│    → User subscribes to Hello Miami calendar on Luma                        │
│    → Webhook fires → Create record in `pending_users` collection            │
│    → User CANNOT log in yet                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. ADMIN APPROVAL (Luma webhook: guest.updated with approval_status change) │
│    → Calendar admin approves user in Luma                                   │
│    → Webhook fires → Move user from `pending_users` to `users`              │
│    → Set status: "pending_verification"                                     │
│    → User CAN now log in                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. FIRST LOGIN (Email OTP via Supabase)                                     │
│    → User enters email on login page                                        │
│    → We check email exists in `users` collection                            │
│    → Send OTP via Supabase auth.signInWithOtp({ email })                    │
│    → User enters OTP code                                                   │
│    → On success: mark user "verified", create Supabase session              │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. SUBSEQUENT LOGINS                                                        │
│    → Same email OTP flow (no special first-time handling needed)            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Webhook Storage Strategy

**Catch ALL Luma webhooks** and store them in a `luma_webhooks` collection for audit/debugging. Special handling for:

- `calendar.person.subscribed` → Create pending user
- `guest.updated` (approval_status changed) → Promote to verified user

### Available Luma Webhook Types (from their docs)

- `calendar.event.added`
- `calendar.person.subscribed`
- `event.created`
- `event.updated`
- `event.canceled`
- `guest.registered`
- `guest.updated`
- `ticket.registered`

## Existing Code Assets

### Luma Types (`.local/types/luma.ts`)

```typescript
export interface Guest {
    api_id: string;
    user_api_id: string;
    event_api_id: string;
    approval_status:
        | 'approved'
        | 'declined'
        | 'pending_approval'
        | 'invited'
        | 'waitlist'
        | 'session';
    email: string;
    name: string;
    avatar_url?: string;
    created_at: string;
    check_in_status?: 'checked_in' | 'not_checked_in';
    check_in_at?: string;
    registration_answers?: RegistrationAnswer[];
}
```

### Current MongoDB Profile Schema (`app/types/mongodb.ts`)

```typescript
export interface Profile {
    _id: ObjectId;
    supabaseUserId: string;
    githubUid: string | null; // REMOVE - no longer using GitHub
    lumaAttendeeId: string | null;
    bio: string | null;
    streakCount: number;
    createdAt: Date;
    updatedAt: Date;
}
```

### Current Auth Hook (`app/hooks/use-auth.tsx`)

- Currently uses GitHub OAuth via Supabase
- **Needs to be replaced** with email OTP flow

## Implementation Tasks

### 1. Database Schema Changes

- [ ] Create `pending_users` collection schema
- [ ] Create `luma_webhooks` collection for raw webhook storage
- [ ] Update `Profile` type: remove `githubUid`, add `verificationStatus: 'pending' | 'verified'`
- [ ] Add `lumaEmail` field to Profile (email used in Luma registration)

### 2. Webhook Endpoint

- [ ] Create `app/routes/api/webhooks/luma.tsx` with action handler
- [ ] Implement webhook signature verification (if Luma provides it)
- [ ] Store ALL webhooks in `luma_webhooks` collection
- [ ] Handle `calendar.person.subscribed` → create pending user
- [ ] Handle `guest.updated` → check for approval status change, promote user

### 3. Auth Flow Updates

- [ ] Replace `use-auth.tsx` to use email OTP instead of GitHub
- [ ] Add `signInWithEmail(email)` → sends OTP
- [ ] Add `verifyOtp(email, token)` → verifies and creates session
- [ ] Update login UI components for email input + OTP entry

### 4. Server-Side Auth Utilities

- [ ] Create `app/lib/db/pending-users.server.ts`
- [ ] Update `app/lib/db/profiles.server.ts` for new flow
- [ ] Add email lookup functions

### 5. API Routes

- [ ] Create login route that checks user exists before sending OTP
- [ ] Create route to handle OTP verification and profile creation

## Luma API Reference

- **Base URL**: `https://public-api.luma.com`
- **Auth Header**: `x-luma-api-key: <API_KEY>`
- **Get Guests**: `GET /v1/event/get-guests?event_api_id=<id>`
- **Webhooks**: Configured in Luma dashboard → Settings → Developer

## Environment Variables Needed

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
LUMA_API_KEY=...           # For server-side Luma API calls
LUMA_WEBHOOK_SECRET=...    # For webhook signature verification (if available)
```

## Key Files to Modify/Create

- `app/hooks/use-auth.tsx` - Replace GitHub with email OTP
- `app/routes/api/webhooks/luma.tsx` - NEW: Webhook handler
- `app/lib/db/pending-users.server.ts` - NEW: Pending users data layer
- `app/lib/db/luma-webhooks.server.ts` - NEW: Webhook storage
- `app/types/mongodb.ts` - Update Profile, add new types
- `app/utils/mongodb.server.ts` - Add new collection constants

## Source of Truth

- **Architecture:** `.github/instructions/copilot.instructions.md`
- **Database Schema:** `docs/DATABASE.md`
- **PRD:** `.local/projects/community-site/hello_miami_community_site_prd.md`

## Notes

- Luma does NOT support OAuth for third-party apps - their API is admin-only with API keys
- Email matching is the only way to link Luma users to our app
- Supabase email OTP handles the actual authentication; we just gate it behind Luma approval
