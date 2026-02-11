---
title: PostgreSQL Migration - Pre-Testing Checklist
description: Complete checklist before validating Zero Sync integration
updated: 2026-02-11
---

# PostgreSQL Migration - Pre-Testing Checklist

Use this checklist to ensure everything is ready before beginning validation.

## Environment Setup

- [ ] PostgreSQL database is running and accessible
- [ ] `DATABASE_URL` is set in `.env.local`
- [ ] Database migrations have been applied: `drizzle-kit push:pg`
- [ ] Connection test passes: `curl http://localhost:5173/api/postgres-stats`

## Luma Integration

- [ ] `LUMA_API_KEY` environment variable is set
- [ ] `LUMA_CALENDAR_ID` environment variable is set
- [ ] Luma API is accessible from your environment (can make test call)

## Clerk Authentication

- [ ] `CLERK_SECRET_KEY` is set
- [ ] `CLERK_PUBLISHABLE_KEY` is set
- [ ] Clerk is configured with GitHub OAuth (or your auth provider)
- [ ] User email matches a subscriber in Luma calendar

## Zero Sync Configuration

- [ ] `VITE_ZERO_CACHE_URL` is set in `.env.local`
  - **Development**: Usually `http://localhost:5173/api/zero`
  - **Production**: Matches your deployment domain
- [ ] Zero cache endpoints exist:
  - `app/routes/api/zero.query.tsx` ✅
  - `app/routes/api/zero.mutate.tsx` ✅

## Code Changes Verified

### New Files Created
- [ ] `app/lib/db/profiles.postgres.server.ts` exists
- [ ] `app/lib/db/events.postgres.server.ts` exists
- [ ] `scripts/backfill-luma-events.ts` exists
- [ ] `scripts/analyze-migration-status.ts` exists
- [ ] `docs/ZERO_SYNC_VALIDATION.md` exists
- [ ] `docs/POSTGRES_MIGRATION_STATUS.md` exists

### Files Modified (Backward Compatible)
- [ ] `app/lib/db/profiles.server.ts` - Wraps Postgres functions
- [ ] `app/lib/db/events.server.ts` - Wraps Postgres functions
- [ ] `app/routes/api/auth/complete-login.ts` - Uses Postgres
- [ ] `app/lib/services/event-sync.server.ts` - Uses Postgres
- [ ] `app/routes/api/webhooks/luma.ts` - Uses Postgres

### Critical Fixes Applied
- [ ] `app/routes/api/zero.mutate.tsx` - Role resolution from Postgres ✅
  - Looks up `isAppAdmin` from profile
  - Sets `ctx.role` correctly for authorization
- [ ] No MongoDB calls in auth/event flows ✅

## TypeScript Compilation

- [ ] No TypeScript errors: `pnpm tsc --noEmit` or `pnpm lint`
- [ ] All modified routes compile cleanly
- [ ] Adapter functions have correct return types

## Database State

**Check current data:**
```sql
SELECT COUNT(*) as profiles FROM profiles;
SELECT COUNT(*) as events FROM events;
SELECT COUNT(*) as projects FROM projects;
```

Expected state:
- `profiles`: 0 (until you login)
- `events`: 0 (until backfill script runs)
- `projects`: 0 (still using MongoDB)

## Development Server

- [ ] Dev server starts: `pnpm dev`
- [ ] No console errors on startup
- [ ] Vite build completes without warnings
- [ ] Can navigate to `http://localhost:5173`

## Git Status

- [ ] Changes are committed or staged
- [ ] Current branch is `feat/community-site`
- [ ] No uncommitted changes in critical files

## Testing Prerequisites

### For Phase 1-3 Testing
- [ ] You have a GitHub account (or other auth)
- [ ] Your email is subscribed to Luma calendar OR you're in `APP_ADMINS`

### For Phase 4-5 Testing (Multi-User)
- [ ] Access to two browsers or private window
- [ ] Two different users/emails for testing

## Quick Smoke Tests (Run These)

### Test 1: Database Connection
```bash
curl http://localhost:5173/api/postgres-stats
# Should return JSON with connection status
```

### Test 2: TypeScript Compilation
```bash
pnpm lint
# Should have 0 errors (markdown linting OK, only TS matters)
```

### Test 3: Dev Server Startup
```bash
pnpm dev
# Should start without errors
# Check console for: "[Zero] Client initialized"
```

### Test 4: Migration Analysis
```bash
# After dev server is running:
pnpm tsx scripts/analyze-migration-status.ts
# Should show table counts (profiles/events = 0 initially)
```

## Ready to Begin Testing

Once all items above are checked:

1. **Phase 1**: [docs/ZERO_SYNC_VALIDATION.md](../docs/ZERO_SYNC_VALIDATION.md#phase-1-data-initialization)
   - Backfill events from Luma
   - Verify database connection

2. **Phase 2**: [docs/ZERO_SYNC_VALIDATION.md](../docs/ZERO_SYNC_VALIDATION.md#phase-2-authentication--profile-creation)
   - Test single user auth flow
   - Verify profile created in Postgres

3. **Phase 3**: [docs/ZERO_SYNC_VALIDATION.md](../docs/ZERO_SYNC_VALIDATION.md#phase-3-zero-sync-client-testing)
   - Verify Zero client initialization
   - Test profile and event queries

4. **Phase 4-8**: Continue multi-user testing...

## Troubleshooting During Setup

**Issue**: Database connection fails
- [ ] Verify PostgreSQL is running: `psql` should connect
- [ ] Check `DATABASE_URL` format: `postgresql://user:pass@host:port/dbname`
- [ ] Try connecting directly: `psql $DATABASE_URL`

**Issue**: Zero client not initializing
- [ ] Check `VITE_ZERO_CACHE_URL` is set correctly
- [ ] Verify `/api/zero/query` endpoint exists
- [ ] Check browser console for specific errors

**Issue**: TypeScript errors
- [ ] Run `pnpm install` to ensure all dependencies present
- [ ] Check for stale imports from old MongoDB modules
- [ ] Verify `drizzle/schema.ts` is imported correctly

**Issue**: Dev server won't start
- [ ] Kill any existing node processes: `pkill -f "node|tsx"`
- [ ] Try clearing Vite cache: `rm -rf .vite`
- [ ] Check for port conflicts on 5173

## Sign-Off

When you're satisfied all items above are ✅:

```bash
# Create a test commit summarizing readiness
git add -A
git commit -m "feat: PostgreSQL migration complete - ready for Zero Sync validation

- Profile and event data layer migrated to PostgreSQL
- Zero Sync queries and mutations configured
- Backward-compatible adapters in place
- Testing guide and scripts provided
- Ready for Phase 1 validation: Luma backfill

See docs/ZERO_SYNC_VALIDATION.md for full testing guide"
```

Then proceed to [docs/ZERO_SYNC_VALIDATION.md](../docs/ZERO_SYNC_VALIDATION.md) Phase 1.

---

**Estimated Time**: 30-60 minutes to complete setup + Phase 1-3 validation
**Risk Level**: Low (all changes backward-compatible)
**Next Person**: Can pick up from Phase 2 or Phase 4 (multi-user testing)
