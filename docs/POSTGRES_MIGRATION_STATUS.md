---
title: MongoDB to PostgreSQL Migration Status
description: Complete PostgreSQL migration - all data types now using Postgres
updated: 2026-02-14
---

## MongoDB to PostgreSQL Migration Status

## Migration Complete ✅

All data types have been successfully migrated from MongoDB to PostgreSQL. The adapter layer has been collapsed and the application now runs entirely on PostgreSQL with Zero Sync for real-time data synchronization.

### Core Profile Functions

- [x] Created `app/lib/db/profiles.postgres.server.ts` with full CRUD operations
- [x] Collapsed into `app/lib/db/profiles.server.ts` (adapter layer removed)
- [x] Updated `app/routes/api/auth/complete-login.ts` to write profiles to Postgres
- [x] Updated `app/routes/api/webhooks/luma.ts` to use Postgres profile functions

### Core Event Functions

- [x] Created `app/lib/db/events.postgres.server.ts` with full CRUD operations
- [x] Collapsed into `app/lib/db/events.server.ts` (adapter layer removed)
- [x] Updated `app/lib/services/event-sync.server.ts` to sync Luma events to Postgres
- [x] Fixed `app/routes/api/zero.mutate.tsx` to resolve user role from Postgres profiles

### Projects

- [x] Created `app/lib/db/projects.postgres.server.ts` with full CRUD operations
- [x] Collapsed into `app/lib/db/projects.server.ts` (adapter layer removed)
- [x] Zero mutators integrated for project CRUD operations
- [x] Updated `app/routes/showcase.$projectId.tsx` with edit/delete UI

### Badges & Badge Assignments

- [x] Created `app/lib/db/badges.postgres.server.ts` with full CRUD operations
- [x] Created `app/lib/db/badge-assignment.postgres.server.ts` for junction table
- [x] Collapsed into respective `.server.ts` files (adapter layer removed)
- [x] Updated admin badge management routes

### Attendance

- [x] Created `app/lib/db/attendance.postgres.server.ts` with full CRUD operations
- [x] Collapsed into `app/lib/db/attendance.server.ts` (adapter layer removed)
- [x] Updated `app/routes/api/check-in.ts` to write to Postgres
- [x] Integrated with Luma webhooks for event attendance tracking
- [x] Added `useCheckIn` hook for Zero Sync mutations

### Surveys & Survey Responses

- [x] Created `app/lib/db/surveys.postgres.server.ts` with full CRUD operations
- [x] Created `app/lib/db/survey-responses.postgres.server.ts` with response handling
- [x] Collapsed into respective `.server.ts` files (adapter layer removed)
- [x] Updated survey routes to use Postgres
- [x] Added `useSubmitSurveyResponse` hook for Zero Sync mutations
- [x] Migrated seed script to Drizzle/Postgres

### Demo Slots

- [x] Created `app/lib/db/demo-slots.postgres.server.ts` with full CRUD operations
- [x] Collapsed into `app/lib/db/demo-slots.server.ts` (adapter layer removed)
- [x] Updated admin demo slots management
- [x] Added `useRequestDemoSlot` and `useUpdateDemoSlotStatus` hooks for Zero Sync

### Zero Sync Integration

- [x] Zero provider pre-configured (`app/components/providers/zero-provider.tsx`)
- [x] Query endpoint implemented with role resolution (`app/routes/api/zero.query.tsx`)
- [x] Mutate endpoint fixed with proper role resolution (`app/routes/api/zero.mutate.tsx`)
- [x] Database indexes created and optimized (`drizzle/migrations/0001_add_performance_indexes.sql`)
- [x] All mutation hooks created in `app/hooks/use-zero-mutate.ts`

### Scripts & Documentation

- [x] Created `scripts/backfill-luma-events.ts` for Luma → Postgres sync
- [x] Migrated `scripts/seed-survey.ts` to use Drizzle/Postgres
- [x] Migrated `scripts/seed-badges.ts` to use Drizzle/Postgres
- [x] Created `docs/ZERO_SYNC_VALIDATION.md` with full testing guide

### Drizzle Schema

- [x] Postgres schema defined in `drizzle/schema.ts` with:
    - Profiles table with proper indexes
    - Events table with proper indexes
    - Projects table with member FK relationship
    - Badges + MemberBadges junction table
    - Attendance table for event tracking
    - DemoSlots, Surveys, SurveyResponses tables

### Adapter Layer Cleanup

- [x] Removed all `.postgres.server.ts` files (collapsed into `.server.ts`)
- [x] Updated `app/types/adapters.ts` to use `id: string` instead of `_id: ObjectId`
- [x] Removed `ObjectId` type alias
- [x] Updated all `._id` and `['_id']` references to `.id` and `['id']`
- [x] Updated `app/lib/db/index.server.ts` header comment to remove MongoDB references

---

## Environment Setup Checklist

For running the fully-migrated application:

- [ ] PostgreSQL database running
- [ ] `DATABASE_URL` set in `.env.local`
- [ ] Drizzle migrations applied (`drizzle-kit push:pg`)
- [ ] `LUMA_API_KEY` and `LUMA_CALENDAR_ID` configured
- [ ] `CLERK_*` environment variables set
- [ ] `VITE_ZERO_CACHE_URL` set in `.env.local` for Zero Sync client
- [ ] Backfill scripts run:
    - `pnpm tsx scripts/backfill-luma-events.ts`
    - `pnpm tsx scripts/seed-badges.ts`
    - `pnpm tsx scripts/seed-survey.ts`

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

## Future Enhancements

### Core Postgres Integration

- [ ] Full-text search for profiles (requires raw SQL with ILIKE or pg_trgm)
- [ ] Automated Luma event webhook sync (currently uses manual backfill script)
- [ ] Real-time event updates from Luma via scheduled sync

### MongoDB Deprecation

MongoDB is no longer used for data storage. Consider:

- [ ] Removing `app/utils/mongodb.server.ts` entirely (if not used for legacy migrations)
- [ ] Archiving old MongoDB collection documentation

### Production Hardening

- [ ] Add database connection pooling monitoring
- [ ] Set up automated backups for PostgreSQL
- [ ] Configure read replicas if needed for performance
- [ ] Implement cache warming for frequently accessed profiles
- [ ] Add query performance monitoring and slow query logging

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
   │        │
┌──▼────────▼──────────────────────────────────────┐
│         PostgreSQL (Single Source of Truth)      │
├──────────────────────────────────────────────────┤
│ ✅ Profiles (UUIDs, Clerk linked)               │
│ ✅ Events (from Luma)                           │
│ ✅ Projects (with member FK)                    │
│ ✅ Badges & MemberBadges (junction table)       │
│ ✅ Attendance (event participation tracking)    │
│ ✅ Surveys & SurveyResponses                    │
│ ✅ DemoSlots (demo night management)            │
└──┬───────────────────────────────────────────────┘
   │
   │ Drizzle ORM
   │
┌──▼─────────────────────────────────┐
│ Data Access Layer (.server.ts)     │
│ • profiles.server.ts                │
│ • events.server.ts                  │
│ • projects.server.ts                │
│ • badges.server.ts                  │
│ • badge-assignment.server.ts        │
│ • attendance.server.ts              │
│ • surveys.server.ts                 │
│ • survey-responses.server.ts        │
│ • demo-slots.server.ts              │
└──┬──────────────────────────────────┘
   │
┌──▼──────────────────────────────────────────────┐
│          Application Layer                      │
├──────────────────────────────────────────────────┤
│ API Routes         │  Zero Sync                  │
│ (React Router 7)   │  • Queries (zero/queries.ts)│
│                    │  • Mutators (zero/mutators) │
│                    │  • Real-time sync via hooks │
└──────────────────────────────────────────────────┘
   │
┌──▼──────────────────────────────────────────────┐
│       React Client (with Zero Provider)          │
├──────────────────────────────────────────────────┤
│ Real-time synced UI with optimistic updates     │
│ • useZero hooks for queries                      │
│ • Mutation hooks in use-zero-mutate.ts           │
└──────────────────────────────────────────────────┘
```

---

## Questions?

Refer to:

- [docs/DATABASE.md](./DATABASE.md) - Schema overview
- [docs/DATABASE_INDEXES.md](./DATABASE_INDEXES.md) - Index strategy
- [docs/ZERO_SYNC_VALIDATION.md](./ZERO_SYNC_VALIDATION.md) - Testing guide
- [docs/DEPLOYMENT.md](./DEPLOYMENT.md) - Production setup
