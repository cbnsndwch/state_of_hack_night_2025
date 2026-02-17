# Ralph Loop - Iteration 11

You are in an iterative development loop working through a task list.



## TASKS MODE: Working through task list

Current tasks from .ralph/ralph-tasks.md:

```markdown
# Ralph Tasks — Full Migration & Feature Implementation

## Phase 1: Adapter Layer Cleanup
- [x] Update `app/types/adapters.ts` — replace `_id: ObjectId` with `id: string`, remove `ObjectId = any` alias
- [x] Collapse `profiles.server.ts` ← `profiles.postgres.server.ts` (merge, remove toMongo shim, delete .postgres file)
- [x] Collapse `events.server.ts` ← `events.postgres.server.ts`
- [x] Collapse `projects.server.ts` ← `projects.postgres.server.ts`
- [x] Collapse `badges.server.ts` ← `badges.postgres.server.ts`
- [x] Collapse `badge-assignment.server.ts` ← `badge-assignment.postgres.server.ts`
- [x] Collapse `attendance.server.ts` ← `attendance.postgres.server.ts`
- [x] Collapse `surveys.server.ts` ← `surveys.postgres.server.ts`
- [x] Collapse `survey-responses.server.ts` ← `survey-responses.postgres.server.ts`
- [x] Collapse `demo-slots.server.ts` ← `demo-slots.postgres.server.ts`
- [x] Grep `app/` for all `._id` and `['_id']` references — update to `.id` / `['id']` (COMPLETED - all references updated)
- [x] Update `app/lib/db/index.server.ts` header comment (remove MongoDB mention)
- [x] Run `pnpm build` — fix any breakage from Phase 1 (BUILD PASSED!)

## Phase 2: Zero Sync Completion
- [x] Add `useCheckIn` hook in `app/hooks/use-zero-mutate.ts` (wraps `attendance.checkIn`)
- [x] Add `useSubmitSurveyResponse` hook (wraps `surveyResponses.submit`)
- [x] Add `useRequestDemoSlot` hook (wraps `demoSlots.request`)
- [x] Add `useUpdateDemoSlotStatus` hook (wraps `demoSlots.updateStatus`)
- [x] Fix Zero query role resolution in `app/routes/api/zero.query.tsx` (~line 170, resolve role from profile)
- [x] Wire project edit/delete UI in `app/routes/showcase.$projectId.tsx` (uncomment hooks, add buttons)
- [x] Run `pnpm build` — fix any breakage from Phase 2

## Phase 3: Deprecated Route Cleanup
- [x] Delete `app/routes/api/onboarding.ts` and remove all references/fetch calls to `/api/onboarding`
- [x] Delete `app/routes/api/profile-update.ts` and remove all references/fetch calls to `/api/profile-update`
- [x] Run `pnpm build` — fix any breakage from Phase 3

## Phase 4: Missing Features
- [x] Implement RSVP tracking in dashboard (replace TODO at `app/routes/dashboard.tsx` ~line 108)
- [x] Migrate check-in attendance write to Zero where possible (`app/routes/api/check-in.ts`)
- [x] Migrate survey response write to Zero where possible (`app/routes/api/survey-response.ts`)
- [x] Migrate demo slots write to Zero where possible (`app/routes/api/demo-slots.ts`)
- [x] Run `pnpm build` — fix any breakage from Phase 4

## Phase 5: Fix Broken Scripts
- [x] Rewrite `scripts/seed-survey.ts` to use Drizzle/Postgres (currently imports deleted mongodb.server.ts)
- [x] Rewrite `scripts/seed-badges.ts` to use Drizzle/Postgres
- [x] Evaluate and update or delete `scripts/migrate-profiles.ts` and `scripts/migrate-supabase-to-clerk-userid.ts`

## Phase 6: Documentation Sync
- [ ] Update `docs/POSTGRES_MIGRATION_STATUS.md` — mark all tables completed, remove "In Progress" section, update architecture diagram
- [ ] Remove stale MongoDB references from comments in `app/lib/db/` files
- [ ] Run `pnpm build` — final verification

## Phase 7: Final Verification
- [ ] Run `pnpm lint` and fix any errors
- [ ] Run `pnpm format`
- [ ] Commit in thematic groups using semantic conventions (see `.github/prompts/do-commits.prompt.md`)

```


📋 No tasks found. Add tasks to .ralph/ralph-tasks.md or use `ralph --add-task`


### Task Workflow

1. Find any task marked [/] (in progress). If none, pick the first [ ] task.
2. Mark the task as [/] in the tasks file before starting.
3. Complete the task.
4. Mark as [x] when verified complete.
5. Output <promise>READY_FOR_NEXT_TASK</promise> to move to the next task.
6. Only output <promise>COMPLETE</promise> when ALL tasks are [x].

---

## Your Main Goal

Execute the full migration and feature implementation plan described in .github/prompts/next-step.prompt.md. Read that file for detailed instructions. Work through the tasks in .ralph/ralph-tasks.md one at a time.

## Critical Rules

- Work on ONE task at a time
- ONLY output <promise>READY_FOR_NEXT_TASK</promise> when the current task is complete
- ONLY output <promise>COMPLETE</promise> when ALL tasks are truly done
- Do NOT lie or output false promises to exit the loop
- If stuck, try a different approach
- Check your work before claiming completion

## Current Iteration: 11 (unlimited) (min: 7)

Tasks Mode: ENABLED - Work on one task at a time

Now, work on the current task. Good luck!