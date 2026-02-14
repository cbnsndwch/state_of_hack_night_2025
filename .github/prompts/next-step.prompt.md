## Full Migration & Feature Implementation Loop

You are working on the `hello_miami` community site. Your job is to **execute the remaining migration and feature work until DONE**, not just plan it. After each task, run `pnpm build` to verify no regressions, then move to the next task. Do NOT stop until all tasks below are completed or you hit a genuine blocker that requires human input (missing credentials, design decisions with no clear default, etc.).

Read `AGENTS.md` at the repo root for project context, stack, and conventions. Read `docs/PRD.md` for feature requirements. Read `docs/POSTGRES_MIGRATION_STATUS.md` for migration status (note: it is outdated — the actual code is ahead of the docs).

---

### Current State (as of Feb 14, 2026)

**MongoDB is GONE from runtime code.** All `app/lib/db/*.server.ts` files delegate to `*.postgres.server.ts` implementations via Drizzle ORM. The `mongodb.server.ts` utility has been deleted. No MongoDB driver is imported anywhere in `app/`.

**What remains is cleanup, wiring, and missing features.**

Key context:
- Branch: `feat/community-site` (89 commits ahead of origin)
- All 10 Drizzle tables defined in `drizzle/schema.ts`: profiles, projects, badges, member_badges, events, attendance, pending_users, luma_webhooks, surveys, survey_responses, demo_slots
- Zero schema auto-generated in `app/zero/schema.ts` (907 lines, covers all tables)
- Zero queries defined in `app/zero/queries.ts` for ALL entity types
- Zero mutators defined in `app/zero/mutators.ts` for: profiles.update, projects CRUD, attendance.checkIn, surveyResponses.submit, demoSlots.request/updateStatus
- Zero client hooks in `app/hooks/use-zero-mutate.ts`: useUpdateProfile, useDismissOnboarding, useCreateProject, useUpdateProject, useDeleteProject
- DB connection: `app/lib/db/provider.server.ts` uses `drizzle-orm/node-postgres` with a Pool

---

### PHASE 1: Adapter Layer Cleanup

The adapter files (`*.server.ts`) shim `_id` fields onto Postgres results for backward compat with the old MongoDB shape. This indirection is now unnecessary. Collapse it.

**Tasks:**
1. Update `app/types/adapters.ts` — replace `_id: ObjectId` with `id: string` across all interfaces. Remove the `ObjectId = any` alias.
2. For each adapter file pair in `app/lib/db/`:
   - Merge the `.postgres.server.ts` logic into the `.server.ts` file (or have `.server.ts` re-export from `.postgres.server.ts` directly)
   - Remove the `toMongo*` conversion functions that add `_id` fields
   - Delete the now-redundant `.postgres.server.ts` files
3. Update all route files and components that reference `._id` to use `.id` instead. Grep for `\._id` and `['_id']` across `app/`.
4. Update `app/lib/db/index.server.ts` header comment (still says "Server-side data access layer for MongoDB").
5. Run `pnpm build` — fix any breakage.

**Adapter pairs to collapse:**
- `profiles.server.ts` ← `profiles.postgres.server.ts`
- `projects.server.ts` ← `projects.postgres.server.ts`
- `badges.server.ts` ← `badges.postgres.server.ts`
- `badge-assignment.server.ts` ← `badge-assignment.postgres.server.ts`
- `attendance.server.ts` ← `attendance.postgres.server.ts`
- `events.server.ts` ← `events.postgres.server.ts`
- `surveys.server.ts` ← `surveys.postgres.server.ts`
- `survey-responses.server.ts` ← `survey-responses.postgres.server.ts`
- `demo-slots.server.ts` ← `demo-slots.postgres.server.ts`

---

### PHASE 2: Zero Sync Completion

Zero queries exist for all tables. Zero mutators exist for profiles, projects, attendance, surveys, and demo slots. But client-side mutation hooks and route wiring are incomplete.

**Tasks:**
1. **Add missing Zero mutation hooks** in `app/hooks/use-zero-mutate.ts`:
   - `useCheckIn` — wraps `attendance.checkIn` mutator
   - `useSubmitSurveyResponse` — wraps `surveyResponses.submit` mutator
   - `useRequestDemoSlot` — wraps `demoSlots.request` mutator
   - `useUpdateDemoSlotStatus` — wraps `demoSlots.updateStatus` mutator

2. **Fix Zero query role resolution** in `app/routes/api/zero.query.tsx`:
   - Line ~170 has `role: 'user' // TODO: Determine role from profile`
   - Look up the authenticated user's profile from Postgres and resolve their actual role (admin vs user)

3. **Wire project edit/delete UI** in `app/routes/showcase.$projectId.tsx`:
   - `useUpdateProject` and `useDeleteProject` hooks are imported but commented out (~line 14-15)
   - Uncomment and wire edit/delete buttons with proper ownership checks

4. Run `pnpm build` — fix any breakage.

---

### PHASE 3: Deprecated Route Cleanup

**Tasks:**
1. Delete `app/routes/api/onboarding.ts` (marked `TODO: Remove once migrated to Zero`)
2. Delete `app/routes/api/profile-update.ts` (marked `TODO: Remove once migrated to Zero`)
3. Search the entire codebase for any fetch calls to `/api/onboarding` or `/api/profile-update` and remove or replace them with Zero mutations.
4. Remove these routes from `app/routes.ts` if explicitly listed there.
5. Run `pnpm build` — fix any breakage.

---

### PHASE 4: Missing Features (from PRD Phase 1)

Implement features that are referenced in the PRD but not yet built.

**4a. RSVP Tracking**
- `app/routes/dashboard.tsx` ~line 108: `completed: false, // TODO: Track RSVPs when event system is implemented`
- Implement RSVP tracking: check if the user has attendance records (or a dedicated RSVP field), and mark the onboarding step as complete when they've RSVP'd or attended an event.

**4b. Check-in → Zero Migration**
- `app/routes/api/check-in.ts` currently uses the adapter layer directly (server-side)
- Consider whether this should stay server-side (it calls the Luma API with secret keys) or if the attendance write can also go through Zero. The Luma API call MUST stay server-side. The attendance record write could go through Zero.

**4c. Survey Response → Zero Migration**
- `app/routes/api/survey-response.ts` uses adapter layer
- Wire through Zero for real-time sync where it makes sense

**4d. Demo Slots → Zero Migration**
- `app/routes/api/demo-slots.ts` uses adapter layer
- Wire through Zero for real-time sync

---

### PHASE 5: Fix Broken Scripts

**Tasks:**
1. Update `scripts/seed-survey.ts` — currently imports from deleted `app/utils/mongodb.server.ts`. Rewrite to use Drizzle/Postgres (import from `drizzle/schema` + `app/lib/db/provider.server`).
2. Update `scripts/seed-badges.ts` — same issue. Rewrite to use Drizzle/Postgres.
3. Evaluate `scripts/migrate-profiles.ts` and `scripts/migrate-supabase-to-clerk-userid.ts` — these are one-time migration scripts. If they've already been run successfully, delete them. If not, update their imports.
4. Run each updated script with `pnpm tsx scripts/<name>.ts --dry-run` (or equivalent) to verify it parses without errors.

---

### PHASE 6: Documentation Sync & Cleanup

**Tasks:**
1. Update `docs/POSTGRES_MIGRATION_STATUS.md`:
   - Move ALL tables to the "Completed" section
   - Remove the "In Progress / Remaining Work" section for data types
   - Update the architecture diagram to remove MongoDB references
   - Update the "Known Limitations / TODO" section to reflect actual remaining work
2. Remove stale MongoDB references from comments throughout `app/lib/db/` files.
3. Update `app/lib/db/index.server.ts` header if not done in Phase 1.
4. Do NOT create new documentation files.

---

### PHASE 7: Final Verification

**Tasks:**
1. Run `pnpm build` — must pass clean.
2. Run `pnpm lint` — fix any lint errors.
3. Run `pnpm format` — apply formatting.
4. Commit changes using the `#do-commits` prompt conventions (thematic groups, semantic messages).

---

### Execution Rules

- **Work sequentially through the phases.** Each phase builds on the previous.
- **Run `pnpm build` after EACH phase** to catch regressions early. Do not proceed to the next phase if the build fails.
- **Do NOT skip a task.** If something seems already done, verify it and move on.
- **If a task requires a design decision with no obvious default**, state your assumption, pick the simpler option, and continue. Flag it in a `// NOTE:` comment for later review.
- **Do NOT create new documentation files** unless the task explicitly calls for it.
- **Track progress** using the todo list tool — create entries for each phase and mark them as you go.
- **When deleting files**, use `rm` in the terminal, not file editing.
- **When renaming/moving files**, use `mv` in the terminal.
- **Grep is your friend.** Before declaring a `_id` → `id` migration complete, grep the entire `app/` directory for remaining `_id` references.

