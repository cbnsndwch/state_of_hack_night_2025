# Hello Miami Community Portal — Product Requirements Document

**Version:** 1.1  
**Last Updated:** January 29, 2026  
**Status:** Draft  
**Authors:** Sergio Leon (Co-Host)

---

## Executive Summary

`hello_miami` is a twice-weekly builder community in Miami recognized for its "no-ego" culture and hands-on hack nights. This project aims to transform the existing static "Year in Review" report into a full-scale, interactive community platform that serves as a **public showcase**, an **event management hub**, and a **member-only collaborative space**.

The site should function as a "Third Place" for builders — outside of work and home — where people can learn from each other, build in public, demo progress, and get thoughtful feedback in a supportive environment.

---

## Background & Origin Story

hello_miami was founded in early 2024 by Alie Gonzalez-Guyon and Jose Sirven with a simple but ambitious goal: to build a real technical community for Miami engineers and builders — not just networking, not just panels, but consistent spaces to build together.

Through research, they identified over 10,000 engineers in Miami and noticed a pattern: many were advanced in their careers, spread out geographically, and working in silos. The demand for community clearly existed, but there were very few deeply technical, recurring spaces focused on hands-on building.

Sergio Leon joined as co-host in January 2025, with Fernando Boza joining in late 2025. The community scaled from once-weekly to twice-weekly hack nights, with attendance growing consistently.

**Venues:**

- **The DOCK** in Wynwood (Tuesdays)
- **Moonlighter FabLab** in South Beach (Thursdays)

**Partners & Sponsors:**

- The LAB / The DOCK
- Moonlighter FabLab
- INIT
- Supabase, Lovable, Bolt.new, ElevenLabs, InfoBip
- React Miami team at G2i (Remix Miami co-hosted events)

---

## Problem Statement

Miami's tech community lacks a centralized, inclusive hub where builders of all experience levels can:

- Connect with like-minded individuals
- Showcase and get feedback on their projects
- Stay informed about local tech events
- Access mentorship from experienced builders and investors

While Miami has many tech events, it is rare to find deeply technical spaces dedicated to consistent skill-sharing and real building outside of one-off hackathons or demo days.

---

## Current State (As of January 2026)

### Technical Stack

- **Frontend:** React Router 7 (Framework Mode with SSR + pre-rendered static files)
- **Backend:** Server-side loaders/actions in React Router 7
- **Database:** MongoDB (profiles, projects, badges, attendance)
- **Auth & Storage:** Supabase (GitHub OAuth, file uploads)
- **Maps:** MapLibre GL + D3 Geo (matching 2025 report style)
- **Content:** Local JSON/MDX for data-driven pages
- **Hosting:** Vercel

### Existing Features

| Feature | Status | Description |
| --- | --- | --- |
| Landing Page (`/`) | ✅ Live | Homepage with core values, "Next Event" CTA |
| Ethos Page (`/ethos`) | ✅ Live | Community values and philosophy |
| 2025 Year Report (`/reports/2025`) | ✅ Live | Data visualizations from Luma calendar data |
| Dashboard (`/dashboard`) | 🚧 WIP | Authenticated member area |
| Project APIs | 🚧 WIP | APIs for member project submissions and updates |

### 2025 Community Metrics (from Luma data)

| Metric | Value |
| --- | --- |
| Hack nights hosted | 75 |
| Total registrations | ~3,000 |
| Unique attendees | 315 |
| Total community members | 1,000+ |
| Best attendance months | July, September, October |
| Hackathons held | 2-3 |

### Member Demographics

**Roles:**

- Software Engineers (majority)
- Builders & Technical Founders
- Designers
- Hardware/Electrical engineers
- Investors/VCs

**Experience Distribution:**

- Newcomers just getting started
- Veterans with years of building experience
- This mix enables fresh perspectives + mentorship opportunities

**Geography:**

- Primary: South Florida (Miami area)
- Secondary: New York, Boston, California (14+ from CA)
- Midwest representation
- Visitors from cold-weather states seeking "an excuse to escape the cold"

---

## Product Vision for 2026

### Goals

1. **Centralize Community Data** — Move from fragmented tools (Luma, Slack, static site) to a unified "Third Place" for builders
2. **Member Onboarding** — Let community members claim their login using the email they registered with on Luma
3. **Drive Engagement** — Empower members to self check-in at physical events via the platform
4. **Project Showcase** — Create a permanent, searchable gallery of "Hacks" (projects) built by the community
5. **Event Coordination** — Streamline demo night scheduling and event discovery
6. **Preserve Legacy** — Integrate annual Year in Review reports as public submodules
7. **Networking** — Facilitate connections between founders and investors

---

## Site Architecture

### Information Architecture / Sitemap

```plain
/                       → Landing Page (public)
/ethos                  → Philosophy & Manifesto (public)
/events                 → Events Calendar (public, RSVP requires login)
  /events/:id           → Event Detail + RSVP
/showcase               → Project Gallery (public)
  /showcase/:id         → Project Detail
/reports                → Annual Reports Hub
  /reports/2025         → 2025 Year in Review
/blog                   → News & Recaps (public)
  /blog/:slug           → Blog Post
/dashboard              → Member Portal (authenticated)
  /dashboard/profile    → Edit Profile
  /dashboard/projects   → My Projects
  /dashboard/events     → My RSVPs & Check-ins
/login                  → Auth Gateway
/api/*                  → Backend APIs
```

### Design System

**Visual Style:** Neo-Brutalism + Terminal Chic

- **Colors:**
  - Background: `#0a0a0a`
  - Primary Green: `#22c55e`
  - Primary Foreground: `#ffffff`
- **Typography:**
  - Monospaced (IBM Plex Mono / Courier) for UI/interactive elements
  - Sans-serif (Inter) for body copy
- **Components:**
  - Neo-Shadow: 2px solid border with offset black shadow
  - Border Radius: `0px` globally
  - Terminal-inspired hero with dynamic cursor (`hello_miami> _`)

---

## Feature Roadmap

### Phase 1: Foundation (Q1 2026)

#### 1.1 Member Authentication & Onboarding

**Priority:** P0  
**Description:** Allow community members to claim their accounts using their Luma registration email.

**Acceptance Criteria:**

- [ ] GitHub OAuth sign-up that maps metadata to community profile
- [ ] User can log in with email used for Luma registration
- [ ] User profile is pre-populated with data from Luma
- [ ] Dashboard prompt to link Luma Attendee ID for automated tracking
- [ ] Onboarding checklist ("3 steps to get started")
- [ ] User can complete their profile with additional information

#### 1.2 Member Survey System

**Priority:** P0  
**Description:** Collect feedback from members on community direction and feature priorities.

**Acceptance Criteria:**

- [ ] Members receive onboarding questionnaire
- [ ] Survey responses are stored and analyzable
- [ ] Dashboard displays aggregate survey insights

#### 1.3 Demo Night Scheduling

**Priority:** P1  
**Description:** Dashboard feature to let members claim time slots for demos.

**Acceptance Criteria:**

- [ ] Members can view upcoming hack nights
- [ ] Members can reserve demo slots with topic/description
- [ ] Organizers can see scheduled demos per event
- [ ] Notifications sent to confirm demo bookings

#### 1.4 Self Check-In ("I'm Here")

**Priority:** P1  
**Description:** Allow members to check themselves in at physical events.

**Acceptance Criteria:**

- [ ] "I'm Here" button active only during event hours (6:30 PM - 1:00 AM)
- [ ] Check-in calls Luma Check-In API (proxied through server to protect API keys)
- [ ] Check-in history visible on member profile

---

### Phase 2: Community Features (Q2 2026)

#### 2.1 Project Gallery / Showcase

**Priority:** P1  
**Description:** Members can add projects they're working on and provide updates.

**Acceptance Criteria:**

- [ ] Add project with title, description, images, links, GitHub URL
- [ ] Markdown-supported editor for "shipping" hacks
- [ ] Direct image/video uploads to Supabase Storage
- [ ] Post project updates/progress logs
- [ ] Other members can view and provide feedback (comments)
- [ ] Projects appear on member profiles
- [ ] Searchable grid with filters by tech stack (Python, React Router, Hardware, etc.)
- [ ] Public project pages (SEO-friendly) with login required to comment

#### 2.2 Events & RSVP System

**Priority:** P1  
**Description:** Centralized event management synced with Luma.

**Acceptance Criteria:**

- [ ] Active/Upcoming events synced from Luma calendar
- [ ] Past event recaps with photo galleries
- [ ] RSVP button for logged-in members
- [ ] Show attendee count ("25 people are hacking this Tuesday!")
- [ ] Lightweight map showing current venues (The DOCK & Moonlighter)
- [ ] Post-event recap linking to projects demoed

#### 2.3 Hackathon Support

**Priority:** P1  
**Description:** Tools to organize and run more hackathons in 2026.

**Acceptance Criteria:**

- [ ] Hackathon event pages with registration
- [ ] Team formation features
- [ ] Submission and judging workflow
- [ ] Post-hackathon showcase
- [ ] Monthly themed challenges (async, like Hackaday.io contests)

#### 2.4 Event Notifications (Text/SMS)

**Priority:** P2  
**Description:** Opt-in text notifications for exclusive technical events in Miami.

**Acceptance Criteria:**

- [ ] Members can opt-in to SMS notifications
- [ ] Respect messaging preferences
- [ ] Integration with Luma for event broadcasts
- [ ] Unsubscribe mechanism

---

### Phase 3: Networking & Growth (Q3-Q4 2026)

#### 3.1 Founder-Investor Connections

**Priority:** P2  
**Description:** Facilitate introductions between startup founders and investors/VCs in the community.

**Acceptance Criteria:**

- [ ] Members can indicate if they're seeking funding
- [ ] Investors can indicate investment interests
- [ ] Matchmaking or introduction requests
- [ ] Privacy controls for sensitive information

#### 3.2 Workshops

**Priority:** P2  
**Description:** Organize and track educational workshops.

**Acceptance Criteria:**

- [ ] Workshop event pages
- [ ] Topic voting/suggestions from members
- [ ] Speaker/facilitator sign-up
- [ ] Post-workshop resources/recordings

#### 3.3 Member Profiles & Gamification

**Priority:** P2  
**Description:** Rich profiles with badges and stats to recognize contributions.

**Acceptance Criteria:**

- [ ] "Builder Stats" (hack nights attended, projects shipped)
- [ ] ASCII Badge gallery
- [ ] Badges for: First Hack, Contributor, Demo Night, Streak, Mentor
- [ ] Focus on fun recognition, not competitive rankings (no-ego culture)
- [ ] Skills/interests tags ("Can help with: Python, CAD design, etc.")

#### 3.4 Blog / News Section

**Priority:** P2  
**Description:** MDX-driven content for recaps, member spotlights, and announcements.

**Acceptance Criteria:**

- [ ] Event recaps with photos
- [ ] Member spotlight interviews
- [ ] Tutorials and essays on community philosophy
- [ ] RSS feed

#### 3.5 Enhanced Year Reports

**Priority:** P3  
**Description:** More detailed analytics and insights throughout the year.

**Acceptance Criteria:**

- [ ] Monthly/quarterly mini-reports
- [ ] Member-facing stats (personal attendance, projects)
- [ ] Community growth metrics

---

## Luma Integration

### Event Sync (Server-side)

- **Scheduled Cron Job:** Fetch Luma calendar events into MongoDB to reduce API latency
- **Check-In Proxy:** Securely sign check-in requests with `LUMA_API_KEY` without exposing keys to client
- **Attendee ID Linking:** Allow members to connect their Luma Attendee ID for automated tracking

### Data Schema

```typescript
// profiles
{
  id: string;
  github_uid: string;
  luma_attendee_id?: string;
  email: string;
  bio?: string;
  skills?: string[];
  streak_count: number;
}

// projects
{
  id: string;
  member_id: string;
  title: string;
  description: string;
  tags: string[];
  image_urls: string[];
  github_url?: string;
  created_at: Date;
  updated_at: Date;
}

// badges
{
  id: string;
  name: string;
  icon_ascii: string;
  criteria: string;
}
```

---

## Open Source & Licensing

| Component | License | Commercial Use |
| --- | --- | --- |
| Code | MIT | ✅ Allowed |
| Data | CC BY-NC 4.0 | ❌ Non-commercial only |
| Branding | CC BY-NC 4.0 | ❌ Non-commercial only |

**Repository:** GitHub (MIT licensed, PRs welcome)

---

## Community Values (Ethos)

These values should be reflected in all product decisions:

1. **Inclusive** — Everyone is welcome regardless of experience level
2. **No Ego** — Check egos at the door; stick to constructive feedback
3. **Collaborative** — Work together, build together, learn from each other
4. **Ship-Focused** — Shipping is important; bias toward action
5. **Consistency** — Show up regularly; most communities fail at this

> "hello_miami is not about status, titles, or résumés. It is about curiosity, generosity, and showing up. Some members are senior engineers. Others are students. Some are founders. Others are exploring their first side project. Everyone is treated as a builder first."

---

## Success Metrics

| Metric | Target (2026) |
| --- | --- |
| Unique attendees | 500+ |
| Total community members | 1,500+ |
| Members with claimed accounts | 200+ |
| Projects showcased | 50+ |
| Hackathons hosted | 6+ |
| Demo nights with scheduled demos | 80% of events |
| Member NPS score | 8+ |

---

## Open Questions

1. **Notification Strategy** — How do we balance text notifications without being spammy?
2. **Identity Verification** — How do we verify Luma email ownership during onboarding?
3. **Investor Features** — What level of vetting is needed for investor-founder connections?
4. **Workshop Content** — What topics are most requested? (Need survey data)
5. **Mentorship Matching** — Should we formalize a mentorship program or keep it organic?
6. **External Channels** — How tightly do we integrate Slack/Discord vs. keep it separate?

---

## Appendix

### A. Geographic Reach (2025)

Based on zip code data from registrations:

- **Florida:** Primary concentration in South Florida
- **Northeast:** Strong presence from New York, Boston
- **West Coast:** 14+ members from California
- **Midwest:** Growing representation

### B. Interest Areas (from Luma registration questions)

Top requested features/events:

1. Hackathons
2. Access to exclusive technical events
3. Demo nights
4. Workshops

### C. Hack Night Schedule

```plain
6:30 PM  — Doors open
8:30 PM  — Lightning demo, intros, then building
1:00 AM  — Lights out
```

### D. Case Studies & Inspiration

The following communities were studied for best practices:

- **Hackaday.io** — Project showcases, contests, Hack Chat
- **Instructables** — Visual project layouts, search/filter UX
- **Stack Overflow** — Reputation/badges, SEO patterns
- **Devpost** — Hackathon management, project galleries
- **Behance/Dribbble** — Creative showcase UX
- **Hack Club** — Playful design, open-source ethos

### E. UX Principles

1. **Public content for SEO** — Server-render all public pages
2. **Member features enhance, not gate** — Browse without login, interact with login
3. **Terminal aesthetic** — Monospaced fonts, dark mode, cursor animations
4. **Mobile-first** — Responsive design, touch-friendly
5. **Performance** — Keep bundles light, defer interactivity scripts
6. **Accessibility** — WCAG compliance despite the theme

---

*This document is a living artifact. Feedback welcome via Telegram or GitHub issues.*
