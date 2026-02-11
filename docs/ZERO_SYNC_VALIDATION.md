---
title: Zero Sync Validation & Testing Guide
description: Step-by-step guide to test the new PostgreSQL + Zero Sync integration
updated: 2026-02-11
---

## Zero Sync Validation & Testing Guide

This document provides a comprehensive guide to validate the PostgreSQL + Zero Sync integration after the MongoDB → Postgres migration.

## Prerequisites

- PostgreSQL database running with migrations applied
- All environment variables configured (DATABASE_URL, LUMA_API_KEY, LUMA_CALENDAR_ID, CLERK keys)
- Development server running (`pnpm dev`)
- Two browsers or browser windows for multi-user testing

## Phase 1: Data Initialization

### 1.1 Backfill Events from Luma API

This populates the Postgres `events` table with data from Luma, which is required for Zero queries to return results.

```bash
# From project root
pnpm tsx scripts/backfill-luma-events.ts
```

**Expected output:**
```
🚀 Starting Luma events backfill...

📅 Fetching events from Luma API...
✓ Retrieved 12 events from Luma

💾 Upserting events to PostgreSQL...
  ✓ Created: Hack Night #1
  ✓ Created: Hack Night #2
  ...

📊 Backfill Summary:
  Created: 10
  Updated: 2
  Errors: 0

✨ Backfill complete!
```

**Verify in database:**
```sql
-- Count events
SELECT COUNT(*) as event_count FROM events;
-- Should show 10+ events

-- Check event details
SELECT id, name, start_at, luma_event_id FROM events ORDER BY start_at DESC LIMIT 5;
```

### 1.2 Verify Database Connection

```bash
# Test the database connection endpoint
curl http://localhost:5173/api/postgres-stats

# Should return JSON with connection status and profile/event counts
```

## Phase 2: Authentication & Profile Creation

### 2.1 Single User Auth Flow

1. **Open browser**: Navigate to `http://localhost:5173`
2. **Click "Sign In"** or visit any protected route
3. **Sign in with GitHub** (or configured auth method)
4. **Expected behavior**:
   - Redirects to login flow
   - After auth, calls POST `/api/auth/complete-login`
   - Profile created in Postgres with `clerk_user_id` and `luma_email`

5. **Verify in database**:
```sql
-- Check profile was created
SELECT id, clerk_user_id, luma_email, verification_status 
FROM profiles 
WHERE luma_email = 'your-email@example.com'
LIMIT 1;

-- Should show:
-- id (UUID)
-- clerk_user_id (matches your Clerk user ID)
-- luma_email (your email)
-- verification_status = 'verified'
```

### 2.2 Check Application Logging

In the browser **Network** tab, verify the auth flow:
1. POST `/api/auth/complete-login` returns `{ success: true }`
2. Check server logs for: `Created new profile {id} for {email}` or `Verified profile {id} for Clerk user {userId}`

## Phase 3: Zero Sync Client Testing

### 3.1 Verify Zero Client Initialization

1. **Open browser DevTools** (F12)
2. **Go to Console tab**
3. **Type**: `window.__zero`
4. **Should see**: Zero client instance with properties like `userID`, `schema`, etc.

5. **Check logger output** - should see:
```
[Zero] Client initialized {
  userID: "user_xyz123",
  server: "http://localhost:5173/api/zero..."
}
```

### 3.2 Test Profile Query (Single User)

After signing in, run this in the browser console:

```javascript
// Get your own profile via Zero query
const myProfile = await window.__zero.query(z => 
  z.profiles.where('clerkUserId', window.__zero.userID).one()
);

console.log('My profile:', myProfile);
// Should return: { id, clerkUserId, lumaEmail, bio, ... }
```

### 3.3 Test Event Queries

```javascript
// Get upcoming events
const upcomingEvents = await window.__zero.query(z => 
  z.events.where(q => q.cmp('startAt', '>', new Date())).orderBy('startAt', 'asc')
);

console.log('Upcoming events:', upcomingEvents);
// Should return array of 5+ events from Luma
```

```javascript
// Get all profiles (directory)
const allProfiles = await window.__zero.query(z => 
  z.profiles.orderBy('createdAt', 'desc')
);

console.log('Directory:', allProfiles);
// Should return all verified profiles (at least your own)
```

## Phase 4: Multi-User Realtime Testing (Zero Sync)

This validates that Zero's realtime sync works correctly between two clients.

### 4.1 Setup: Two Browser Windows

1. **Window 1 (User A)**: Open in main browser with user A logged in
2. **Window 2 (User B)**: Open in incognito/private window with user B logged in

### 4.2 Test Profile Update Mutation

**In Window 1 (User A):**
```javascript
// Subscribe to your profile changes
const myProfile$ = window.__zero.query(z =>
  z.profiles.where('clerkUserId', window.__zero.userID).one()
);

const unsub = myProfile$.subscribe(profile => {
  console.log('My profile updated:', profile);
});
```

**In Window 1 (User A) - Trigger Mutation:**
Navigate to `/dashboard/profile` and update bio or skills, click save.

**Expected in Console:**
```
My profile updated: { 
  id: "...", 
  bio: "Updated bio text...",
  skills: ['Node.js', 'React'],
  updatedAt: 2026-02-11T...
}
```

**In Window 2 (User B):**
```javascript
// Query User A's profile from User B's session
const userAProfile = await window.__zero.query(z =>
  z.profiles.where('id', 'user-a-profile-id').one()
);

console.log('User A profile (from User B):', userAProfile);
// About 3-5 seconds later, should see updated skills/bio
// This proves realtime sync is working!
```

## Phase 5: Zero Mutator Testing

### 5.1 Test Profile Update Mutation

**In Dashboard Profile Page** (`/dashboard/profile`):

1. Update your bio or skills
2. Click save

**Verify in Console:**
```javascript
const updated = await window.__zero.query(z =>
  z.profiles.where('clerkUserId', window.__zero.userID).one()
);

console.log('Updated bio:', updated.bio);
// Should match what you entered (minus 2-3 second sync delay)
```

**Check Network Tab:**
- POST request to `/api/zero/mutate`
- Response should include `result: { data: undefined }` (success)

### 5.2 Check for Mutations Errors

If a mutation fails, check:

```javascript
// Look in Network tab for POST /api/zero/mutate
// Response error format:
{
  "result": {
    "error": "app",
    "message": "Unauthorized: You can only update your own profile"
  }
}
```

## Phase 6: Authorization Testing

### 6.1 Test Profile Ownership

**In Window B (User B) - Try to modify User A's profile:**

```javascript
// Try to mutate User A's profile (should fail)
await window.__zero.mutate.profiles.update({
  id: 'user-a-profile-id',
  bio: 'Hacked!'
});
```

**Expected error in console:**
```
error: "app"
message: "Unauthorized: You can only update your own profile"
```

### 6.2 Test Admin Role

If you're in the `APP_ADMINS` list (env var), test:

```javascript
// Admins can perform additional operations
// (depends on admin-level mutators defined)
```

## Phase 7: Database Integrity Checks

After all tests, verify data consistency:

```sql
-- Check profile counts
SELECT COUNT(*) as total_profiles FROM profiles;

-- Check event counts
SELECT COUNT(*) as total_events FROM events;

-- Verify no orphaned records
SELECT COUNT(*) FROM projects WHERE member_id NOT IN (SELECT id FROM profiles);

-- Check index usage (query performance)
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY tablename;

-- Verify sequences for UUID generation
SELECT COUNT(DISTINCT id) FROM profiles;
-- Should equal total_profiles (all UUIDs unique)
```

## Phase 8: Performance Validation

### 8.1 Monitor Zero Inspector

Install **Zero Inspector** for browser (if available):

```javascript
// In console, check inspector
window.__zero.debug?.inspector?.open?.();
```

Monitor:
- Query latency (should be <100ms for cached data)
- Mutation roundtrip time (should be <500ms)
- Subscription updates (should arrive <2s after mutation)

### 8.2 Database Query Performance

Enable PostgreSQL query logging by setting in `.env`:
```bash
# In your postgres session:
SET log_min_duration_statement = 0;  -- Log all queries
```

Monitor slow queries when running tests (should see <50ms for indexed queries).

## Troubleshooting

### Problem: Zero client not initializing

**Solution:**
1. Check `VITE_ZERO_CACHE_URL` is set in `.env.local`
2. Verify `/api/zero/query` and `/api/zero/mutate` endpoints are accessible
3. Check browser console for initialization errors

### Problem: Queries return empty results

**Solution:**
1. Run backfill script: `pnpm tsx scripts/backfill-luma-events.ts`
2. Verify Postgres connection: Check `DATABASE_URL`
3. Check database has data: `SELECT COUNT(*) FROM events;`

### Problem: Profile not syncing to Postgres on login

**Solution:**
1. Check `/api/auth/complete-login` returns `{ success: true }`
2. Verify Clerk is configured correctly
3. Check server logs for profile creation errors
4. Verify `clerkUserId` field is being set correctly

### Problem: Mutations failing with "Unauthorized"

**Solution:**
1. Check user is authenticated (has valid `clerkUserId`)
2. Verify profile exists in database
3. Check mutual user ID matches between Clerk and Zero context
4. Review role resolution in `/api/zero/mutate.tsx`

## Next Steps

After validation:

1. **Set up Luma webhooks** to automate event sync (currently manual via backfill script)
2. **Implement full-text search** for profiles using Postgres native features
3. **Add more Zero mutators** for projects, badges, etc.
4. **Set up monitoring** for Zero cache performance in production
5. **Deprecate MongoDB** once fully validated

## Reference Commands

```bash
# Backfill events from Luma
pnpm tsx scripts/backfill-luma-events.ts

# Check database
DATABASE_URL="postgresql://..." psql

# Watch logs
pnpm dev  # Check terminal output

# Run Zero Inspector (if extension available)
window.__zero.debug.inspector.open()
```
