# Session Context: hello_miami Community Platform Transition

## 1. Project Mission

Transform the static **2025 Year in Review** report into the official **hello_miami** community platform. The site serves as the "Third Place" for Miami builders, emphasizing a "no-ego" culture, hands-on hacking, and consistent weekly momentum.

## 2. Technical Blueprint

- **Frontend:** React Router 7 (Framework Mode) for SSR and public content.
- **Backend:** NestJS for Luma API proxies and background sync tasks.
- **Database/Auth:** Supabase (GitHub OAuth, PostgreSQL, Storage).
- **Design System:** Neo-Brutalism + Terminal Chic (Dark mode, `#22c55e` primary, sharp corners, monospaced headers).
- **Legacy Integration:** The existing 2025 report will be moved to `/reports/2025`.

## 3. Core Features Locked

- **Luma Self Check-In:** Members check in via the site during the Luma event window (6:30 PM - 1:00 AM).
- **Luma Sync:** Event data is pulled from Luma and cached in Supabase.
- **Project Showcase:** A gallery of member "Hacks" with image/video uploads to Supabase.
- **Manifesto:** MDX-driven content on community philosophy.

## 4. Source of Truth

- **PRD:** [.local/projects/community-site/hello_miami_community_site_prd.md](.local/projects/community-site/hello_miami_community_site_prd.md)
- **Background Docs:** [.local/projects/community-site/](.local/projects/community-site/) (contains original vision and Q&A).

## 5. Current State & Progress

- **Framework:** Successfully migrated to **React Router 7 (Framework Mode)**.
- **Identity:** All branding and headers normalized to **strictly lowercase** (e.g., _hello_miami_, _2025 impact report_).
- **Architecture:**
    - `app/routes/landing.tsx`: Terminal-chic home page.
    - `app/routes/manifesto.tsx`: Community philosophy.
    - `app/routes/reports.2025/`: Migrated legacy report logic.
    - `app/routes/dashboard.tsx`: Protected member area (requires auth).
- **Auth:** Supabase client initialized; `useAuth` hook implemented; GitHub OAuth button integrated in `Navbar`.
- **Backend:** NestJS server scaffolded in `server/` with initial `LumaService` for attendance syncing.

## 6. Next Immediate Steps

1. **Supabase Schema:** Create the SQL migrations for `profiles`, `attendance`, and `projects` tables.
2. **Luma Logic:** Finalize the NestJS proxy to allow members to check in via the site during active event windows.
3. **Project Showcase:** Build the gallery component to let builders upload and display their latest hacks.
4. **Environment Sync:** Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are populated to test Auth flow.
5. **Dashboard hydration:** Connect the dashboard to real Supabase data (profiles, attendance streaks).
