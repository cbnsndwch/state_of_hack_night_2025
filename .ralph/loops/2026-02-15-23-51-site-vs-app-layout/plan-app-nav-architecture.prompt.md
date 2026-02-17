# Logged-In UX Architecture Plan

## Current State Problems

The hello_miami dashboard reuses the public site layout (Navbar + Footer), which:
- **Loses screen real estate** with persistent discovery links (home, ethos, events, showcase, 2025 report)
- **Pollutes task-focused UX** with SEO/discoverability links meant for the public site
- **Mixes navigation contexts** without clear separation of discovery mode vs. action mode
- **Lacks app-like appearance** that would reinforce membership/belonging
- **Creates confusion** (e.g., "showcase" link could mean "my projects" or "community projects")

Screenshot shows a compact navbar consuming space while dashboard users need to focus on their own data.

---

## Recommended Architecture: Dual-Layer Navigation Model

### Design Principles

Anchor this in established UX research:

1. **Context Switching & Cognitive Load (Nielsen Norman Group)**
   - Discovery mode (public): breadth, exploration, learning
   - Action mode (logged-in): depth, personal management, task execution
   - Mixing these increases error rates and friction
   - Example: Amazon doesn't show category links in "Your Account"

2. **Information Hierarchy & Fitts' Law**
   - Public users need **breadth**: ethos, events, people, report
   - Dashboard users need **depth**: profile, projects, attendance, bookings
   - Navigation should reflect task frequency and importance
   - SEO links should never compete with action items

3. **Onboarding & Progressive Disclosure**
   - Logged-in UX should feel like an **earned space**—member-only area
   - Reinforces belonging and community identity
   - Improves perceived value and retention (Slack, GitHub, Notion pattern)

4. **Mobile Responsiveness & Real Estate**
   - Current navbar + content is inefficient on mobile
   - Sidebar collapses to hamburger on mobile (industry standard for apps)
   - Full-width content area for dashboard items

---

## Public Site Layout (Keep Current)

```
┌─────────────────────────────────────────────────────┐
│ [Logo] [Home][Ethos][Events][Showcase][2025 Report] │
│                                          [Login]    │
└─────────────────────────────────────────────────────┘
│                                                       │
│                    Content Area                       │
│                                                       │
│                                                       │
└─────────────────────────────────────────────────────┘
│ [Social] [License] [etc]                             │
└─────────────────────────────────────────────────────┘
```

**Purpose**: Discovery, warming, SEO, public onboarding

---

## Logged-In Experience Layout (New)

### Desktop View

```
┌──────────────────────────────────────────┐
│ [Search] [Notifications] [Avatar▼]       │
└──────────────────────────────────────────┘
┌──────────┬──────────────────────────────┐
│ [Logo]   │                              │
│          │      Content Area            │
│ Dashboard│   (full width - no footer)   │
│ My Profs │                              │
│ My Projc │                              │
│ Check-in │                              │
│ Demo Sls │                              │
│ [Admin]  │                              │
│          │                              │
│          │                              │
└──────────┴──────────────────────────────┘
```

### Mobile View

```
┌───────────────────────────────────────────┐
│ [≡] [Logo]  [Notif] [Avatar▼]            │
└───────────────────────────────────────────┘
│                                           │
│      Content Area (full width)            │
│                                           │
│                                           │
└───────────────────────────────────────────┘

When menu open:
┌───────────────────┐
│ Dashboard         │
│ My Profile        │
│ My Projects       │
│ Check-ins/Streaks │
│ Demo Slots        │
│ [Admin if Admin]  │
└───────────────────┘
```

### Key Features

**Left Sidebar (Desktop only)**
- Always visible, persistent context
- Contains all task navigation
- Quick user profile preview (avatar, name, affiliation)
- Collapsible hamburger on mobile
- No footer

**Top Minimal Bar**
- Search / Notifications / Alerts
- User avatar with logout dropdown
- Connection status if needed
- No discovery links

**Content Area**
- Full width (no competing nav)
- Uses existing `max-w-7xl` container
- Cleaner, more spacious UX

---

## Navigation Structure

### Public Site Routes (Current)
- `/` — Landing
- `/ethos` — Community values
- `/events` — Calendar & discovery
- `/showcase` — Project gallery
- `/showcase/:projectId` — Project detail
- `/reports/2025` — State of Hack Night report
- `/login` — Auth entry

### Dashboard Routes (Protected)
- `/dashboard` — Dashboard home (consolidated view)
- `/dashboard/profile` — Edit profile
- `/dashboard/survey/:slug` — Survey forms
- `/dashboard/survey/:slug/results` — Survey responses
- `/admin/surveys` — Survey management (admin only)
- `/admin/surveys/:id` — Survey detail (admin only)
- `/admin/demo-slots` — Demo slot management (admin only)

---

## Implementation Strategy

### Phase 1: Layout Components
1. Create `AppLayout.tsx` component (sidebar + top bar structure)
2. Create `SidebarNav.tsx` component (persistent left nav)
3. Create `TopBar.tsx` component (minimal header)
4. Update `root.tsx` to detect auth state and render appropriate layout

### Phase 2: Route Refactoring
1. Create layout outlet/wrapper for dashboard routes
2. Apply `AppLayout` to all `/dashboard/*`, `/admin/*` routes
3. Keep public routes using current `Navbar` + `Footer`
4. Test responsive behavior (mobile hamburger)

### Phase 3: Polish & Refinement
1. Add transition animations (Framer Motion)
2. Test accessibility (keyboard nav in sidebar)
3. Mobile testing and refinement
4. Dark mode consistency (already has dark theme)

### Phase 4: Long-term Enhancements
- Add "Discover" section in sidebar linking to public pages (optional, for community discovery within app)
- Add saved bookmarks/shortcuts
- Role-based navigation tweaks for different user types

---

## File Changes Required

### New Files
- `app/components/layout/AppLayout.tsx` — Main dashboard layout wrapper
- `app/components/layout/SidebarNav.tsx` — Persistent left navigation
- `app/components/layout/TopBar.tsx` — Minimal header with search/notifications
- `app/components/layout/UserProfilePreview.tsx` — Quick profile in sidebar

### Modified Files
- `app/root.tsx` — Add auth detection to swap layouts
- `app/routes/dashboard.tsx` — Use `AppLayout`
- `app/routes/dashboard.profile.tsx` — Use `AppLayout`
- `app/routes/dashboard.survey.$surveySlug.tsx` — Use `AppLayout`
- `app/routes/admin.surveys.tsx` — Use `AppLayout`
- `app/routes/admin.surveys.$surveyId.tsx` — Use `AppLayout`
- `app/routes/admin.demo-slots.tsx` — Use `AppLayout`

### Styling
- New CSS for sidebar (sticky, responsive, hamburger states)
- Tailwind utility classes for layout spacing
- Dark theme adjustments if needed

---

## Success Metrics

- ✅ Dashboard feels like a dedicated app, not a website
- ✅ No confusion between "discover" (public) and "manage" (app) modes
- ✅ More usable screen real estate for content
- ✅ Mobile users get proper responsive sidebar collapse
- ✅ Admin routes have same polished navigation as member dashboard
- ✅ Clear visual affordance: "I'm in my space now"

---

## Questions for Refinement

1. **Should the app include a "Discover" section** linking to community pages (/events, /showcase, etc.) for users who want to explore while logged in?
   - Pro: Reduces friction for members discovering new projects/events
   - Con: Reintroduces the "mixed context" problem
   - Recommendation: Add as optional section at bottom of sidebar, lower visual prominence

2. **Quick profile preset or collapsible privacy panel?**
   - Option A: Always show user avatar + name in sidebar
   - Option B: Collapsible details (name, membership streak, badges)
   - Recommendation: Show avatar + name; expand on hover for badges/streak

3. **Admin toggle or separate admin interface?**
   - Option A: Admin functions in the same sidebar nav
   - Option B: Separate "Admin Mode" switch that changes navigation entirely
   - Recommendation: Single sidebar with [Admin] section visible only if `isAppAdmin` role

4. **Search UI position?**
   - Top bar (currently proposed)
   - Floating search button
   - Embedded in sidebar
   - Recommendation: Top bar with optional sidebar quick-filters

---

## Risk Mitigation

**Risk**: Users expect to see public nav links in the app
- **Mitigation**: Prominent "Discover" section at bottom of sidebar links to /events, /showcase

**Risk**: Sidebar takes up too much space on desktop
- **Mitigation**: Collapsible/minimizable sidebar (icon-only mode) for power users

**Risk**: Admin routes lose consistency if treated separately
- **Mitigation**: Same `AppLayout` for admin routes; role-based nav items

**Risk**: Mobile UX regresses
- **Mitigation**: Test hamburger menu behavior; ensure touch targets are adequate
