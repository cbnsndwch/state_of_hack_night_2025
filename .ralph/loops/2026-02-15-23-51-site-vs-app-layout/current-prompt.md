# Ralph Loop - Iteration 1

You are in an iterative development loop working through a task list.



## TASKS MODE: Working through task list

Current tasks from .ralph/ralph-tasks.md:

```markdown
# Ralph Tasks — Logged-In UX Architecture Plan

## Phase 1: Layout Components

### Component: TopBar
- [x] Create `app/components/layout/TopBar.tsx` with minimal header structure
- [x] Add search input field placeholder (no search logic yet, just UI)
- [x] Add notifications icon/badge placeholder
- [x] Add user avatar with dropdown trigger
- [x] Add logout button in dropdown menu
- [x] Add connection status indicator (visible conditionally)
- [x] Add Tailwind styling (sticky top, shadow, dark theme)
- [x] Import and test in isolation with mock user data

### Component: SidebarNav
- [x] Create `app/components/layout/SidebarNav.tsx` with vertical navigation
- [x] Add logo/brand section at top
- [x] Add navigation items: Dashboard, My Profile, My Projects, Check-ins/Streaks, Demo Slots
- [x] Add [Admin] section (conditionally visible if user.isAppAdmin)
- [x] Add Tailwind styling (sticky, dark theme, border-right)
- [x] Implement active state styling (highlights current route)
- [x] Add hover states and smooth transitions
- [x] Test with mock auth data (admin and non-admin)

### Component: UserProfilePreview
- [x] Create `app/components/layout/UserProfilePreview.tsx` for sidebar user card
- [x] Display user avatar (from Supabase or fallback)
- [x] Display user name/display name
- [x] Display affiliation or role badge
- [x] Add optional hover expansion (shows badges, streak count, etc.)
- [x] Add Tailwind styling matching sidebar theme
- [x] Test avatar image loading and fallback behavior

### Component: AppLayout
- [x] Create `app/components/layout/AppLayout.tsx` as main wrapper
- [x] Accept `children` prop for page content
- [x] Render TopBar at top (full width)
- [x] Render SidebarNav on left (desktop) / hamburger (mobile)
- [x] Render content area (flex-1, full width with proper spacing)
- [x] NO footer in AppLayout (footer only on public site)
- [x] Add responsive grid/flex layout
- [x] Add Tailwind classes for responsive sidebar collapse
- [x] Implement hamburger menu state management (useState for mobile menu open/close)
- [x] Test mobile responsiveness (375px, 768px, 1024px breakpoints)

### Component: Mobile Hamburger Menu
- [x] Create toggle button in TopBar for mobile
- [x] Show/hide SidebarNav content in mobile view
- [x] Add backdrop dismiss (clicking outside closes menu)
- [x] Smooth slide-in animation (Framer Motion optional)
- [x] Test touch interactions on mobile viewport
- [x] Ensure z-index layering is correct (menu above content)

---

## Phase 2: Route Refactoring

### Auth Detection in Root Layout
- [x] Update `app/root.tsx` to detect authentication state
- [x] Import `useAuth()` hook to check if user is logged in
- [x] Create conditional rendering: logged-in → AppLayout structure, public → Navbar/Footer structure
- [x] Wrap Outlet based on auth state
- [x] Test public route rendering (should show Navbar/Footer)
- [x] Test protected route rendering (should show AppLayout)

### Dashboard Home Route
- [x] Update `app/routes/dashboard.tsx` to use AppLayout
- [x] Remove manual Navbar import/render
- [x] Verify AppLayout is injected around existing content
- [x] Test that dashboard content displays correctly
- [x] Ensure sidebar highlights "Dashboard" as active

### Profile Route
- [x] Update `app/routes/dashboard.profile.tsx` to use AppLayout
- [x] Remove manual Navbar import/render
- [x] Test profile page renders within AppLayout
- [x] Ensure sidebar highlights "My Profile" as active

### Survey Routes
- [x] Update `app/routes/dashboard.survey.$surveySlug.tsx` to use AppLayout
- [x] Remove manual Navbar import/render
- [x] Update `app/routes/dashboard.survey.$surveySlug.results.tsx` to use AppLayout
- [x] Remove manual Navbar import/render from results page
- [x] Test survey form page
- [x] Test survey results page
- [x] Verify sidebar nav is consistent across both

### Admin Routes
- [x] Update `app/routes/admin.surveys.tsx` to use AppLayout
- [x] Remove manual Navbar import/render
- [x] Update `app/routes/admin.surveys.$surveyId.tsx` to use AppLayout
- [x] Remove manual Navbar import/render
- [x] Update `app/routes/admin.demo-slots.tsx` to use AppLayout
- [x] Remove manual Navbar import/render
- [x] Test [Admin] section appears in sidebar for admin users
- [x] Test [Admin] section does not appear for non-admin users
- [x] Verify all admin routes render correctly

### Route Layout Strategy Decision
- [x] Decide: Use React Router outlet pattern or wrap routes in component?
- [x] If outlet pattern: Create parent route wrapper for dashboard routes
- [x] If wrap in component: Add AppLayout import to each route file
- [x] Document decision in code comments
- [x] Ensure chosen pattern is consistent across all routes

---

## Phase 3: Styling & Polish

### Sidebar Styling
- [x] Add min-width constraint for sidebar (e.g., 200px on desktop)
- [x] Add max-width to prevent overgrowth
- [x] Style active nav item (highlight, left border, etc.)
- [x] Style hover states for nav items (background change, cursor)
- [x] Add smooth transitions for state changes
- [x] Test color contrast for accessibility (WCAG AA minimum)
- [x] Test dark mode consistency (already dark theme)

### TopBar Styling
- [x] Add background color matching app theme
- [x] Add border-bottom for structure
- [x] Add proper spacing/padding for content
- [x] Style search input to match design system
- [x] Style dropdown menu (logout, etc.)
- [x] Add shadow or border to define top area
- [x] Test sticky positioning (header stays at top on scroll)

### Content Area Styling
- [x] Add proper padding inside content area
- [x] Ensure content respects max-width if needed
- [x] Add margin adjustments for different screen sizes
- [x] Test content doesn't overlap with sidebar on any viewport
- [x] Verify full-width usage benefit (more space than with navbar)

### Responsive Breakpoints
- [x] Test desktop layout (1024px+): sidebar visible, full layout
- [x] Test tablet layout (768px-1023px): sidebar might collapse or be narrow
- [x] Test mobile layout (375px-767px): hamburger menu visible, sidebar hidden
- [x] Verify all content is readable at each breakpoint
- [x] Test touch interactions on mobile
- [x] Ensure no horizontal scrolling on mobile

### Dark Mode & Theme
- [x] Verify all new components use existing dark theme colors
- [x] Check text contrast on new sidebar bg
- [x] Check hover state colors are visible in dark mode
- [x] Test active state highlighting is clear
- [x] Ensure animations work smoothly in dark mode

---

## Phase 4: Testing & Validation

### Component Unit Tests
- [x] Test TopBar renders search, notifications, avatar
- [x] Test SidebarNav renders all nav items
- [x] Test SidebarNav shows [Admin] section only when isAppAdmin=true
- [x] Test AppLayout renders TopBar and SidebarNav
- [x] Test AppLayout children render correctly inside content area
- [x] Test UserProfilePreview displays user info correctly
- [x] Test mobile hamburg menu toggle state management

### Route Integration Tests
- [x] Navigate to /dashboard, verify AppLayout appears
- [x] Navigate to /dashboard/profile, verify sidebar highlights "My Profile"
- [x] Navigate to /dashboard/survey/:slug, verify AppLayout and content
- [x] Navigate to /admin/surveys (as admin user), verify [Admin] nav visible
- [x] Navigate to /admin/surveys (as non-admin user), verify access denied or redirect
- [x] Navigate to /admin/demo-slots (as admin), verify AppLayout and content
- [x] Test public routes still show Navbar/Footer, not AppLayout

### Auth State Tests
- [x] Test logged-out user redirected from /dashboard to /
- [x] Test logged-out user can view /landing (public site with Navbar/Footer)
- [x] Test logged-in user sees AppLayout on dashboard routes
- [x] Test logout removes auth and redirects to login
- [x] Test sidebar nav updates when user role changes (if applicable)

### Mobile Responsiveness Tests
- [x] Test hamburger menu appears on mobile viewport (375px)
- [x] Test hamburger menu toggle opens/closes correctly
- [x] Test clicking nav item closes mobile menu
- [x] Test clicking backdrop dismisses mobile menu
- [x] Test all nav items clickable and functional on mobile
- [x] Test content area displays without scrolling sidebar on mobile
- [x] Test no horizontal scroll on any mobile breakpoint

### Accessibility Tests
- [x] Test keyboard navigation through sidebar items (Tab key)
- [x] Test Enter/Space activates nav items
- [x] Test hamburger menu focusable and operable via keyboard
- [x] Test color contrast WCAG AA compliance
- [x] Test screen reader announces nav structure
- [x] Test Escape key closes mobile menu
- [x] Test focus management when menu opens/closes

### Performance Tests
- [x] Verify sidebar doesn't cause layout thrashing
- [x] Test smooth scrolling with sticky header
- [x] Verify no unnecessary re-renders of nav components
- [x] Test mobile menu toggle is snappy (no jank)
- [x] Profile rendering: check Time to Interactive (TTI)

### Cross-Browser Testing
- [x] Test in Chrome/Edge (Chromium)
- [x] Test in Firefox
- [x] Test in Safari (especially mobile Safari)
- [x] Test in mobile browsers (Chrome Mobile, Safari iOS)
- [x] Verify layout consistency across browsers

---

## Phase 5: Long-Term Enhancements (Optional)

### Discover Section in Sidebar
- [ ] Create collapsible "Discover" section in sidebar
- [ ] Add links to /events, /showcase, /reports/2025
- [ ] Make visually distinct or lower priority (visual hierarchy)
- [ ] Test that clicking Discover links navigates correctly
- [ ] Decide: keep AppLayout or switch to Navbar/Footer for those pages?

### Sidebar Collapsibility/Minimization
- [ ] Add collapse/expand toggle in sidebar header
- [ ] Implement icon-only mode for collapsed state
- [ ] Add tooltips on collapsed nav items
- [ ] Persist collapse state in localStorage
- [ ] Test smooth animation on collapse/expand
- [ ] Verify content area expands when sidebar collapses

### User Shortcuts/Saved Items
- [ ] Add customizable quick-access section in sidebar (future feature)
- [ ] Allow users to pin/favorite dashboard sections (future feature)
- [ ] Design UI for shortcuts (minimal, doesn't clutter nav)

### Role-Based Sidebar Customization
- [ ] Identify different user roles (member, organizer, admin, etc.)
- [ ] Create role-specific sidebar nav variations
- [ ] Update AppLayout to render appropriate sidebar based on user role
- [ ] Test sidebar changes based on user role

### Analytics/Usage Tracking
- [ ] Track which sidebar nav items are clicked most
- [ ] Track mobile vs desktop usage of menu
- [ ] Use data to optimize nav item ordering

---

## Validation Checklist (Before Merge)

- [x] All Phase 1 components created and styled
- [x] All Phase 2 routes updated and functional
- [x] All Phase 3 styling complete and tested
- [x] All Phase 4 tests passing (unit, integration, responsive, a11y)
- [x] No console errors or warnings
- [x] Navbar/Footer still visible on public routes
- [x] Public routes (/, /ethos, /events, /showcase, /reports/2025) render correctly without AppLayout
- [x] Logged-in routes render AppLayout correctly
- [x] Mobile responsive behavior works smoothly
- [x] Admin-only routes properly protected/nav-controlled
- [x] No broken links in new nav items
- [x] Performance metrics acceptable (no layout shift issues)

---

## Notes

- **Order of execution**: Complete Phase 1 (components) before Phase 2 (routes)
- **Testing approach**: After each major component, run manual tests in browser
- **Styling**: Use existing Tailwind configuration and dark theme
- **Dependencies**: AppLayout depends on TopBar, SidebarNav, UserProfilePreview being complete
- **Rollback plan**: If issues arise, can revert all changes since public routes are isolated

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

Execute the full migration and feature implementation plan described in .github/prompts/plan-app-nav-architecture.prompt.md. Read that file for detailed instructions. Work through the tasks in .ralph/ralph-tasks.md one at a time. Do implement the optional long-term enhancements from phase 5

## Critical Rules

- Work on ONE task at a time
- ONLY output <promise>READY_FOR_NEXT_TASK</promise> when the current task is complete
- ONLY output <promise>COMPLETE</promise> when ALL tasks are truly done
- Do NOT lie or output false promises to exit the loop
- If stuck, try a different approach
- Check your work before claiming completion

## Current Iteration: 1 (unlimited) (min: 1)

Tasks Mode: ENABLED - Work on one task at a time

Now, work on the current task. Good luck!