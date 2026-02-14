Session Summary - MongoDB→PostgreSQL Migration - Feb 11, 2026

Current state (repo)
- Zero Sync code is wired in: Zero client provider, query/mutate endpoints, and Drizzle adapter are present.
  - Zero provider: app/components/providers/zero-provider.tsx
  - Query endpoint: app/routes/api/zero.query.tsx
  - Mutate endpoint: app/routes/api/zero.mutate.tsx
  - DB adapter: app/lib/db/provider.server.ts
- Zero queries and mutators exist in app/zero/queries.ts and app/zero/mutators.ts.
- Performance index migration exists: drizzle/migrations/0001_add_performance_indexes.sql.
- Index documentation exists: docs/DATABASE_INDEXES.md and docs/PERFORMANCE_OPTIMIZATION.md.
- .ralph summaries exist; corrected one count and added index source notes in docs.

Key findings
1) Zero Sync is integrated at the code level, but the data layer is split:
	- Luma event sync uses MongoDB, not Postgres/Zero: app/lib/services/event-sync.server.ts and app/lib/db/events.server.ts.
	- Auth flow ensures profiles in MongoDB (not Postgres): app/hooks/use-auth.tsx calls /api/auth/complete-login.
	=> Postgres likely has little or no data unless manually seeded, so Zero queries can return empty.

2) Mutate endpoint has a TODO about API changes:
	- app/routes/api/zero.mutate.tsx notes the API changed and needs updates.
	- Role context is hard-coded to 'user' in query/mutate handlers.

3) Legacy Mongo routes still exist (deprecated but active):
	- app/routes/api/onboarding.ts
	- app/routes/api/profile-update.ts

4) Indexes are in two sources:
	- Base indexes/uniques in drizzle/schema.ts
	- Performance indexes in the migration 0001_add_performance_indexes.sql
	Added explicit reconciliation notes in docs.

Answers to user questions
- Do we have Zero Sync integrated? Yes, in code. Real-time hooks and endpoints are present, but some flows still use Mongo.
- Does the DB have enough data to evaluate? Not necessarily; Luma sync and profile creation go to Mongo, so Postgres likely lacks data.
- How to test Zero Sync with auth? Use Clerk login in two browsers, but first ensure Postgres has a profile + data (seed or mutate).
- What areas are not implemented? Remaining Mongo routes, Luma sync to Postgres, and role-based auth in Zero endpoints.

Recent edits made in this session
- docs/PERFORMANCE_OPTIMIZATION.md: added “Index Sources (Reconciled)” note.
- docs/DATABASE_INDEXES.md: added “Index Sources (Reconciled)” note.
- .ralph/INDEX_OPTIMIZATION_SUMMARY.md: fixed composite index count to 4.

Next steps (recommended)
1) Decide on data source alignment:
	- Move Luma event sync from Mongo to Postgres OR add a Postgres sync path.
	- Update auth profile creation to write to Postgres (or dual-write) so Zero queries work.
2) Validate Zero Sync end-to-end:
	- Seed Postgres with minimal profiles/events/projects, or build a seed script.
	- Test two-browser realtime updates using Zero queries/mutators.
3) Clean up legacy routes:
	- Remove or fully migrate deprecated Mongo endpoints (onboarding/profile-update).
4) Zero mutate handler:
	- Reconcile handleMutateRequest API changes and add role resolution if needed.

Open questions for next session
- Should Luma sync be fully migrated to Postgres now, or keep Mongo as temporary?
- Do we want a seed script for Postgres test data, or use real Luma + webhook flows?
