---
title: MongoDB to PostgreSQL Migration Status
description: Detailed status of data layer migration and remaining work
updated: 2026-02-11
---

## MongoDB to PostgreSQL Migration Status

## Completed ✅

### Core Profile Functions
- [x] Created `app/lib/db/profiles.postgres.server.ts` with full CRUD operations
- [x] Updated `app/lib/db/profiles.server.ts` as backward-compatible adapter
- [x] Updated `app/routes/api/auth/complete-login.ts` to write profiles to Postgres
- [x] Updated `app/routes/api/webhooks/luma.ts` to use Postgres profile functions

### Core Event Functions  
- [x] Created `app/lib/db/events.postgres.server.ts` with full CRUD operations
- [x] Updated `app/lib/db/events.server.ts` as backward-compatible adapter
- [x] Updated `app/lib/services/event-sync.server.ts` to sync Luma events to Postgres
- [x] Fixed `app/routes/api/zero.mutate.tsx` to resolve user role from Postgres profiles

### Zero Sync Integration
- [x] Zero provider pre-configured (`app/components/providers/zero-provider.tsx`)
- [x] Query endpoint implemented (`app/routes/api/zero.query.tsx`)
- [x] Mutate endpoint fixed with proper role resolution (`app/routes/api/zero.mutate.tsx`)
- [x] Database indexes created and optimized (`drizzle/migrations/0001_add_performance_indexes.sql`)

### Scripts & Documentation
- [x] Created `scripts/backfill-luma-events.ts` for Luma → Postgres sync
- [x] Created `docs/ZERO_SYNC_VALIDATION.md` with full testing guide

### Drizzle Schema
- [x] Postgres schema defined in `drizzle/schema.ts` with:
  - Profiles table with proper indexes
  - Events table with proper indexes
  - Projects table with member FK relationship
  - Badges + MemberBadges junction table
  - Attendance table for event tracking
  - DemoSlots, Surveys, SurveyResponses tables

---

## In Progress / Remaining Work

### Secondary Data Types (Still Using MongoDB)

These tables exist in Postgres schema but data flows still use MongoDB. Since profiles and events are now on Postgres, these require migration for full Postgres-only operation.

#### Projects
- **Status**: Defined in Postgres schema, but queries use MongoDB (`app/lib/db/projects.server.ts`)
- **Routes affected**: 
  - `app/routes/api/projects.ts`
  - `app/routes/api/projects-list.ts`
  - `app/routes/api/profile.ts` (fetches projects by member)
- **What needs to be done**:
  1. Create `app/lib/db/projects.postgres.server.ts`
  2. Update `app/lib/db/projects.server.ts` to wrap Postgres functions (adapter pattern)
  3. Zero mutators for project CRUD are already defined in `app/zero/mutators.ts`

#### Badges & MemberBadges
- **Status**: Defined in Postgres schema, but queries use MongoDB (`app/lib/db/badges.server.ts`)
- **Routes affected**:
  - `app/routes/api/badges.ts` (admin badge management)
  - Dashboard badge display (via Zero queries)
- **What needs to be done**:
  1. Create `app/lib/db/badges.postgres.server.ts`
  2. Update `app/lib/db/badge-assignment.server.ts` to use Postgres

#### Attendance
- **Status**: Defined in Postgres schema, but data creation uses MongoDB
- **Routes affected**:
  - `app/routes/api/check-in.ts` (records attendance)
  - `app/routes/api/check-in-history.ts` (shows history)
- **Integration**: Luma webhooks (guest.updated) trigger attendance records
- **What needs to be done**:
  1. Create `app/lib/db/attendance.postgres.server.ts`
  2. Update check-in routes to write to Postgres

#### Surveys & Survey Responses
- **Status**: Defined in Postgres schema, but queries use MongoDB
- **Routes affected**:
  - `app/routes/admin.surveys.tsx`
  - `app/routes/dashboard.survey.$surveySlug.tsx`
  - `app/routes/api/survey-response.ts`
- **What needs to be done**:
  1. Create `app/lib/db/surveys.postgres.server.ts`
  2. Create `app/lib/db/survey-responses.postgres.server.ts`
  3. Update survey routes to use Postgres

#### Demo Slots
- **Status**: Defined in Postgres schema, but queries use MongoDB (`app/lib/db/demo-slots.server.ts`)
- **Routes affected**:
  - `app/routes/admin.demo-slots.tsx`
  - `app/routes/api/demo-slots.ts`
  - Notifications system depends on demo slots
- **What needs to be done**:
  1. Create `app/lib/db/demo-slots.postgres.server.ts`
  2. Update `app/lib/db/demo-slots.server.ts` as adapter

---

## Migration Priority

Based on Zero Sync feature requirements and user impact:

### High Priority (For Zero Sync Core)
1. **Projects** - Next after events (used in Zero queries)
2. **Badges** - User profile completeness
3. **Attendance** - Event participation tracking

### Medium Priority (For Features)
4. **Surveys** - Admin features, non-critical for MVP
5. **Demo Slots** - Specific feature, can delay

### Low Priority (Scaffolding)
- Notification helper tables (can stay in MongoDB longer)
- Webhook audit logs (currently persisted, not critical)

---

## How to Migrate a Table

Each migration follows the same pattern. **Example: Projects**

### 1. Create Postgres Functions File
```typescript
// app/lib/db/projects.postgres.server.ts
import { db } from './provider.server';
import { projects, profiles } from '../../../drizzle/schema';
import { eq, desc } from 'drizzle-orm';

export async function getProjectsByMemberId(memberId: string) {
    return db
        .select()
        .from(projects)
        .where(eq(projects.memberId, memberId))
        .orderBy(desc(projects.createdAt));
}

export async function createProject(data: ProjectInsert) {
    const [created] = await db
        .insert(projects)
        .values(data)
        .returning();
    return created;
}

// ... more functions
```

### 2. Update Adapter File
```typescript
// app/lib/db/projects.server.ts (existing file)
// Import Postgres functions and wrap them
import * as postgresDb from './projects.postgres.server';

export async function getProjectsByMemberId(memberId: string) {
    return await postgresDb.getProjectsByMemberId(memberId);
}

// ... etc
```

### 3. Update Routes (if needed)
No route changes needed since the adapter maintains backward compatibility.

### 4. Update Zero Queries (if already defined)
The Zero queries in `app/zero/queries.ts` already reference Drizzle/Postgres.

---

## Environment Setup Checklist

For the current migrated features (Profiles + Events):

- [ ] PostgreSQL database running
- [ ] `DATABASE_URL` set in `.env.local`
- [ ] Drizzle migrations applied (`drizzle-kit push:pg`)
- [ ] `LUMA_API_KEY` and `LUMA_CALENDAR_ID` configured
- [ ] `CLERK_*` environment variables set
- [ ] `VITE_ZERO_CACHE_URL` set in `.env.local` for Zero Sync client
- [ ] Backfill script run: `pnpm tsx scripts/backfill-luma-events.ts`

---

## Testing the Current State

See [ZERO_SYNC_VALIDATION.md](./ZERO_SYNC_VALIDATION.md) for comprehensive testing guide.

**Quick validation:**
```bash
# 1. Check Postgres connection
curl http://localhost:5173/api/postgres-stats

# 2. Backfill events
pnpm tsx scripts/backfill-luma-events.ts

# 3. Login and verify profile created
# Navigate to app, sign in with GitHub
# Check database: SELECT * FROM profiles WHERE luma_email = 'your@email.com'

# 4. Test Zero queries
# Open browser console and run queries from validation guide
```

---

## Known Limitations / TODO

### Core Postgres Integration
- [ ] Full-text search for profiles (requires raw SQL with ILIKE)
- [ ] Luma event webhook automation (currently manual backfill script)
- [ ] Real-time event updates from Luma (sync interval needed)

### MongoDB Cleanup
- [ ] Deprecate `app/utils/mongodb.server.ts` after all tables migrated
- [ ] Remove `app/types/mongodb.ts` types for Postgres tables
- [ ] Archive MongoDB collection structure docs

### Production Hardening
- [ ] Add database connection pooling monitoring
- [ ] Set up automated backups for Postgres
- [ ] Configure read replicas if needed for performance
- [ ] Implement cache warming for frequently accessed profiles

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    External Systems                      │
├─────────────────────────────────────────────────────────┤
│ Clerk Auth    │ Luma API    │ Storage (Supabase)        │
└────┬──────────┬────────────┬─────────────────────────────┘
     │          │            │
┌────▼─┐ ┌──────▼┐    ┌──────▼─────────────────────┐
│ Auth │ │ Event │    │ User Uploads               │
│Login │ │ Sync  │    │ (Projects, Avatars)        │
└──┬───┘ └──┬────┘    └────────────────────────────┘
   │        │
┌──▼────────▼──────────────────────────────────────┐
│         PostgreSQL (Single Source of Truth)      │
├──────────────────────────────────────────────────┤
│ ✅ Profiles (UUIDs, Clerk linked)               │
│ ✅ Events (from Luma)                           │
│ ⏳ Projects (pending migration from Mongo)       │
│ ⏳ Badges, Attendance, Surveys (pending)        │
└──┬─────────────────────────────────────────────┬─┘
   │                                             │
   │ Drizzle ORM                    Postgres     │
   │                                Adapters     │
   │                                (backward    │
┌──▼─────────────────────────────┐ compatible) │
│ Postgres Functions              │            │
│ (profiles.postgres.server.ts,   │            │
│  events.postgres.server.ts, etc)│            │
└──┬──────────────────────────────┘            │
   │                                ┌──────────▼──────┐
   │                                │ MongoDB Wrapper  │
   │                                │ (for other types)│
   │                                └──────────────────┘
   │
┌──▼──────────────────────────────────────────────┐
│          Application Layer                      │
├──────────────────────────────────────────────────┤
│ API Routes         │  Zero Sync                  │
│ (uses adapters)    │  • Queries (zero/queries.ts)
│                    │  • Mutators (zero/mutators.ts)
└──────────────────────────────────────────────────┘
   │
┌──▼──────────────────────────────────────────────┐
│       React Client (with Zero Provider)          │
├──────────────────────────────────────────────────┤
│ Real-time synced UI with optimistic updates     │
└──────────────────────────────────────────────────┘
```

---

## Questions?

Refer to:
- [docs/DATABASE.md](./DATABASE.md) - Schema overview
- [docs/DATABASE_INDEXES.md](./DATABASE_INDEXES.md) - Index strategy
- [docs/ZERO_SYNC_VALIDATION.md](./ZERO_SYNC_VALIDATION.md) - Testing guide
- [docs/DEPLOYMENT.md](./DEPLOYMENT.md) - Production setup
