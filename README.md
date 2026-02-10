# hello_miami

The community site and member portal for Hello Miami — a "no-ego" builder community for Miami hackers.

## Overview

This project serves as:

- **Community Site**: Public-facing pages introducing Hello Miami, our ethos, and how to join
- **Member Portal**: Authenticated dashboard for members to manage profiles, showcase projects, and track attendance
- **Annual Reports**: Data visualizations like the "State of Hack Night 2025" exploring community growth and impact

## Features

### Public

- **Landing Page**: Community introduction with terminal-inspired aesthetic
- **Ethos Page**: The philosophy behind Hello Miami
- **Annual Reports**: Interactive data visualizations (maps, charts) for community metrics

### Member Portal (Authenticated)

- **Builder Dashboard**: Personal stats, streak tracking, and profile management
- **Project Gallery**: Showcase hacks and side projects with image uploads
- **Badges**: ASCII badges earned through community participation

## Tech Stack

- **Framework**: [React 19](https://react.dev/) + [React Router 7](https://reactrouter.com/) (SSR framework mode)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives)
- **Maps**: [MapLibre GL JS](https://maplibre.org/) + D3 Geo
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Database**: MongoDB (profiles, projects, badges, attendance)
- **Authentication**: Clerk (user authentication with GitHub OAuth)
- **File Storage**: Cloudinary (project images, member avatars)
- **Event Integration**: Luma (calendar subscriptions, webhooks)

## Getting Started

### Prerequisites

- Node.js >= v20
- pnpm
- MongoDB instance (local or Atlas)
- Clerk account (for authentication)
- Cloudinary account (for file storage)

### Environment Variables

```env
# Database
MONGODB_URI=mongodb://...

# Authentication (Clerk)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# File Storage (Cloudinary)
VITE_CLOUDINARY_CLOUD_NAME=...
VITE_CLOUDINARY_UPLOAD_PRESET=...

# Event Integration (Luma)
LUMA_API_KEY=...                # Required: for event sync and check-ins
LUMA_WEBHOOK_SECRET=...         # Optional: for webhook verification

# Email Notifications (Resend)
RESEND_API_KEY=...              # Optional: for demo slot and badge notifications
```

### Installation

```bash
git clone <repository-url>
cd state-of-the-hack-night-2025
pnpm install
```

### Development

```bash
pnpm dev
```

The application will be available at `http://localhost:5173`.

### Building for Production

```bash
pnpm build
pnpm start   # Preview production build
```

## Project Structure

```text
app/
├── components/   # Reusable UI (buttons, charts, maps, projects)
├── data/         # JSON data files and precomputed stats
├── hooks/        # Custom hooks (use-auth, use-mobile)
├── lib/db/       # Server-side MongoDB data access layer
├── routes/       # React Router 7 routes with loaders/actions
│   ├── api/      # API endpoints (projects, profile)
│   └── reports/  # Annual report pages
├── sections/     # Major page sections (Hero, Impact, etc.)
├── types/        # TypeScript interfaces
└── utils/        # Helpers (MongoDB connection, Supabase client)
```

## Scripts

- `pnpm dev` — Start development server
- `pnpm build` — Build for production
- `pnpm start` — Preview production build
- `pnpm lint` — Run ESLint
- `pnpm format` — Format code with Prettier

## Deployment Checklist

Before deploying to production, ensure the following steps are completed:

### 1. Environment Variables

Verify all required environment variables are set in your production environment:

- **Database**
    - `MONGODB_URI` — MongoDB connection string
    - `MONGODB_DB_NAME` — Database name (default: `hello_miami`)

- **Authentication (Clerk)**
    - `VITE_CLERK_PUBLISHABLE_KEY` — Clerk publishable key
    - `CLERK_SECRET_KEY` — Clerk secret key

- **File Storage (Cloudinary)**
    - `VITE_CLOUDINARY_CLOUD_NAME` — Cloudinary cloud name
    - `VITE_CLOUDINARY_UPLOAD_PRESET` — Upload preset (unsigned)

- **Event Integration (Luma)**
    - `LUMA_API_KEY` — Required for event sync and check-ins
    - `LUMA_WEBHOOK_SECRET` — Optional for webhook verification

- **Email Notifications (Resend)**
    - `RESEND_API_KEY` — Optional for demo slot and badge notifications

### 2. MongoDB Indexes

Create all required indexes for optimal performance. Connect to your MongoDB instance and run:

```javascript
use hello_miami

// profiles
db.profiles.createIndex({ clerkUserId: 1 }, { unique: true, sparse: true })
db.profiles.createIndex({ lumaEmail: 1 }, { unique: true })
db.profiles.createIndex({ lumaAttendeeId: 1 }, { sparse: true })

// projects
db.projects.createIndex({ memberId: 1 })
db.projects.createIndex({ createdAt: -1 })
db.projects.createIndex({ tags: 1 })

// member_badges
db.member_badges.createIndex({ memberId: 1, badgeId: 1 }, { unique: true })

// attendance
db.attendance.createIndex({ memberId: 1, lumaEventId: 1 }, { unique: true })
db.attendance.createIndex({ lumaEventId: 1 })

// events
db.events.createIndex({ lumaEventId: 1 }, { unique: true })
db.events.createIndex({ startAt: -1 })

// surveys
db.surveys.createIndex({ slug: 1 }, { unique: true })
db.surveys.createIndex({ type: 1 })

// survey_responses
db.survey_responses.createIndex({ surveyId: 1, memberId: 1 }, { unique: true })
db.survey_responses.createIndex({ surveyId: 1 })

// demo_slots
db.demo_slots.createIndex({ memberId: 1 })
db.demo_slots.createIndex({ eventId: 1 })

// pending_users
db.pending_users.createIndex({ email: 1 }, { unique: true })
db.pending_users.createIndex({ lumaAttendeeId: 1 })

// luma_webhooks
db.luma_webhooks.createIndex({ type: 1 })
db.luma_webhooks.createIndex({ receivedAt: -1 })
```

### 3. Badge Seeding

Seed the initial set of badges by inserting them into the `badges` collection:

```javascript
db.badges.insertMany([
    {
        name: 'First Check-In',
        iconAscii: '⭐\n★',
        criteria: 'Attended your first hack night',
        createdAt: new Date()
    },
    {
        name: 'Streak Starter',
        iconAscii: '🔥\n↑',
        criteria: 'Maintained a 2-week attendance streak',
        createdAt: new Date()
    },
    {
        name: 'Consistent Builder',
        iconAscii: '⚡\n██',
        criteria: 'Maintained a 4-week attendance streak',
        createdAt: new Date()
    },
    {
        name: 'Dedicated Member',
        iconAscii: '💎\n◆',
        criteria: 'Maintained an 8-week attendance streak',
        createdAt: new Date()
    }
]);
```

### 4. Clerk Configuration

In your Clerk dashboard:

1. **Enable GitHub OAuth** under "Authentication" → "Social connections"
2. **Set up redirect URLs**:
    - Development: `http://localhost:5173`
    - Production: Your production domain
3. **Configure webhook endpoints** (optional):
    - Endpoint URL: `https://your-domain.com/api/webhooks/clerk`
    - Events: `user.created`, `user.updated`

### 5. Cloudinary Configuration

In your Cloudinary dashboard:

1. **Create an unsigned upload preset**:
    - Go to "Settings" → "Upload"
    - Click "Add upload preset"
    - Set mode to "Unsigned"
    - Configure folder, transformations, and limits as needed
2. **Note your cloud name** and **upload preset name** for environment variables

### 6. Luma Integration

1. **Generate API key** from Luma dashboard
2. **Set up webhook endpoint** (optional):
    - URL: `https://your-domain.com/api/webhooks/luma`
    - Events: `calendar.person.subscribed`, `event.guest.registered`, etc.
3. **Verify webhook secret** is set in environment variables

### 7. Build and Deploy

```bash
pnpm install
pnpm build
```

Deploy the contents of the `build/` directory to your hosting provider. The application requires Node.js runtime for SSR.

### 8. Post-Deployment Verification

- [ ] Test authentication flow (sign up, sign in, sign out)
- [ ] Verify profile creation and updates
- [ ] Test project uploads with Cloudinary
- [ ] Check event sync from Luma
- [ ] Verify check-in functionality
- [ ] Test badge awarding
- [ ] Confirm survey submissions
- [ ] Test demo slot bookings

## License

This project is dual-licensed:

- **Source Code**: [MIT](LICENSE.md#source-code-license-mit) — Copyright (c) 2025-2026 cbnsndwch LLC
- **Data**: [CC BY-NC 4.0](LICENSE.md#data-license-cc-by-nc-40) — Copyright (c) 2025-2026 cbnsndwch LLC

See [LICENSE.md](LICENSE.md) for full details.
