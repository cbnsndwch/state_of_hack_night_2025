# Sprint Prompt: Hello Miami Community Portal — February 2026 Sprint

## Context & Current State

You are working on **hello_miami**, a community site and member portal for a twice-weekly builder community in Miami. The project uses React Router 7 (SSR), MongoDB, Clerk (auth), and Cloudinary (file storage).

**Key Recent Changes:**

- Migrated from Supabase to **Clerk** for authentication
- Migrated from Supabase Storage to **Cloudinary** for file uploads
- Implemented **badge system** with check-in and streak milestones
- Built **survey system** with admin insights and member result views
- Created **demo slot booking** with email notifications
- Added **event sync** from Luma calendar to MongoDB

**PRD Phase Status:**
| Phase | Status |
|-------|--------|
| 1.1 Member Auth & Onboarding | ✅ Mostly complete (Clerk migration done, onboarding checklist exists) |
| 1.2 Member Survey System | ✅ Complete (onboarding survey, admin insights, member results view) |
| 1.3 Demo Night Scheduling | ✅ Complete (booking, admin management, email notifications) |
| 1.4 Self Check-In ("I'm Here") | 🚧 Partially implemented (needs integration with new auth) |
| 2.1 Project Gallery/Showcase | 🚧 Backend complete, needs public showcase page |
| 2.2 Events & RSVP System | 🚧 Event sync exists, needs public events page |

---

## Sprint Goals

Complete the following high-priority items to close out Phase 1 and begin Phase 2:

### 1. Complete Auth Migration Cleanup (P0)

- [ ] Update remaining `supabaseUserId` references to `clerkUserId` in:
    - `app/routes/api/demo-slots.ts` (still uses `getProfileBySupabaseUserId`)
    - Any other files still referencing Supabase user IDs
- [ ] Run MongoDB migration to rename `supabaseUserId` → `clerkUserId` in production profiles
- [ ] Remove the old `app/hooks/use-auth.tsx` and rename `use-auth-new.tsx` to `use-auth.tsx`
- [ ] Remove `login.tsx` route if `login-new.tsx` is the canonical login page
- [ ] Update README.md environment variables section to reflect Clerk + Cloudinary

### 2. Self Check-In Feature Completion (P0 — PRD 1.4)

- [ ] Verify "I'm Here" button works with Clerk auth
- [ ] Ensure check-in updates Luma via proxy API (protect API keys)
- [ ] Display check-in history on member profile/dashboard
- [ ] Time-gate button to event hours (6:30 PM - 1:00 AM)
- [ ] Award badges on successful check-in (integrate `awardCheckInBadges`)
- [ ] Show toast notification when new badge is earned

### 3. Public Events Page (P1 — PRD 2.2)

- [ ] Create `/events` route showing upcoming events from MongoDB
- [ ] Display event cards with: name, date, venue, registered count
- [ ] Link to Luma for RSVP (or build in-app RSVP if scope allows)
- [ ] Mobile-responsive grid layout matching neo-brutalist design system
- [ ] Add "Events" link to Navbar

### 4. Public Project Showcase (P1 — PRD 2.1)

- [ ] Create `/showcase` route listing all community projects
- [ ] Display project cards with: title, description, image, tags, author
- [ ] Add search/filter by tech stack tags
- [ ] Individual project pages at `/showcase/:id` with full details
- [ ] SEO-friendly server-rendered public pages
- [ ] Add "Showcase" link to Navbar

### 5. Dashboard Polish

- [ ] Show member's badges in dashboard with ASCII icons
- [ ] Display current streak prominently
- [ ] Show recent check-in activity
- [ ] Link to completed surveys with "View Results" button
- [ ] Ensure onboarding checklist completion logic is accurate

### 6. Documentation Updates

- [ ] Update `docs/DATABASE.md` to reflect `clerkUserId` field
- [ ] Add deployment checklist to README (env vars, MongoDB indexes, badge seeding)
- [ ] Document the complete auth flow with Clerk

---

## Technical Notes

**Database Collections:**

- `profiles` — Member data (uses `clerkUserId` now)
- `projects` — Project showcase entries
- `badges` / `member_badges` — Badge system
- `attendance` — Check-in records
- `events` — Synced from Luma
- `demo_slots` — Demo night bookings
- `surveys` / `survey_responses` — Survey system

**Key Server Utilities:**

- Auth: `getAuth()` from `@clerk/react-router/server`
- DB: Functions in `app/lib/db/*.server.ts`
- Email: `app/lib/notifications/*.server.ts` (uses Resend)

**Design System:**

- Background: `#0a0a0a`
- Primary Green: `#22c55e`
- Neo-Shadow: 2px solid border with offset shadow
- Font: Monospace for UI, Inter for body

---

## Acceptance Criteria Summary

1. All Supabase references removed, Clerk auth fully integrated
2. Check-in flow works end-to-end with badge awards and streak updates
3. Public `/events` page shows upcoming hack nights
4. Public `/showcase` page displays community projects with filtering
5. Dashboard displays badges, streaks, and survey results
6. Documentation reflects current architecture

---

## Out of Scope (Future Sprints)

- Hackathon support features (PRD 2.3)
- SMS/Text notifications (PRD 2.4)
- Founder-investor connections (PRD 3.1)
- Workshops (PRD 3.2)
- Blog/News section (PRD 3.4)

---

_Take on the Developer role. Start by reviewing the current `feat/community-site` branch, then tackle items in priority order. Commit frequently with semantic commit messages._
