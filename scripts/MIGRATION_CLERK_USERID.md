# MongoDB Migration: supabaseUserId → clerkUserId

## Overview

This migration renames the `supabaseUserId` field to `clerkUserId` in the `profiles` collection to reflect the authentication provider migration from Supabase Auth to Clerk.

## What This Migration Does

1. **Finds** all profiles with a `supabaseUserId` field
2. **Renames** the field to `clerkUserId` using MongoDB's `$rename` operator
3. **Updates** the `updatedAt` timestamp
4. **Verifies** the migration was successful
5. **Is idempotent** - safe to run multiple times

## Prerequisites

- MongoDB connection configured in `.env` file
- `MONGODB_URI` and `MONGODB_DB_NAME` environment variables set
- Node.js and pnpm installed
- `tsx` package installed (already in devDependencies)

## Running the Migration

### Using pnpm script (recommended)

```bash
pnpm migrate:clerk-userid
```

### Using tsx directly

```bash
tsx scripts/migrate-supabase-to-clerk-userid.ts
```

## Expected Output

```
Starting supabaseUserId → clerkUserId migration...

Found 42 profiles with 'supabaseUserId' field

✓ Migration complete!
  - Matched: 42 profiles
  - Modified: 42 profiles

Verification:
  - Profiles with 'supabaseUserId': 0
  - Profiles with 'clerkUserId': 42

Sample migrated profile:
  - _id: 507f1f77bcf86cd799439011
  - lumaEmail: member@example.com
  - clerkUserId: user_2abc123def456
  - has supabaseUserId field: false

✓ Migration verified successfully!
```

## If Migration Already Ran

If you run this migration on a database where it was already applied, you'll see:

```
Starting supabaseUserId → clerkUserId migration...

Found 0 profiles with 'supabaseUserId' field
✓ No profiles need migration. All done!
```

## Production Deployment Checklist

Before deploying to production:

1. ✅ Backup your MongoDB database
2. ✅ Verify `.env` has correct production `MONGODB_URI`
3. ✅ Test migration on a staging/development database first
4. ✅ Run the migration: `pnpm migrate:clerk-userid`
5. ✅ Verify output shows successful migration
6. ✅ Check application still works correctly
7. ✅ Monitor for any auth-related errors

## Rollback (if needed)

If you need to rollback this migration:

```typescript
// Rename clerkUserId back to supabaseUserId
await collection.updateMany(
    { clerkUserId: { $exists: true } },
    {
        $rename: { clerkUserId: 'supabaseUserId' },
        $set: { updatedAt: new Date() }
    }
);
```

## Related Files

- Migration script: `scripts/migrate-supabase-to-clerk-userid.ts`
- Type definitions: `app/types/mongodb.ts` (Profile interface)
- Database utilities: `app/utils/mongodb.server.ts`
- Profile data access: `app/lib/db/profiles.server.ts`

## Notes

- The migration uses MongoDB's atomic `$rename` operator, which is safe and efficient
- No data is lost during migration - only the field name changes
- The migration script includes verification to ensure success
- Exit codes: 0 = success, 1 = failure
