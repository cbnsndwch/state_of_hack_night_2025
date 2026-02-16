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
- **Database**: PostgreSQL 16+ with [Zero Sync](https://zero.rocicorp.dev/) (realtime sync engine)
- **Authentication**: Clerk (user authentication with GitHub OAuth)
- **File Storage**: Cloudinary (project images, member avatars)
- **Event Integration**: Luma (calendar subscriptions, webhooks)

## Getting Started

### Prerequisites

- Node.js >= v20
- pnpm
- PostgreSQL 16+ instance (local via Docker or managed service)
- Clerk account (for authentication)
- Cloudinary account (for file storage)

### Environment Variables

```env
# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5433/hello_miami

# Zero Sync
VITE_ZERO_CACHE_URL=http://localhost:4848
ZERO_UPSTREAM_DB=postgresql://user:password@localhost:5433/hello_miami
ZERO_ADMIN_PASSWORD=dev-password

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

1. **Start PostgreSQL and zero-cache** (via Docker):

```bash
docker-compose up -d
```

This starts:

- PostgreSQL on port 5433
- zero-cache on port 4848

2. **Run database migrations**:

```bash
pnpm drizzle-kit push
```

3. **Start the development server**:

```bash
pnpm dev
```

The application will be available at `http://localhost:5173`.

To stop the Docker services:

```bash
docker-compose down
```

### Building for Production

```bash
pnpm build
pnpm start   # Preview production build
```

## Deployment

For production deployment with Docker and Zero Sync:

```bash
# Quick deployment (recommended)
./scripts/deploy-production.sh production
```

See the complete deployment guides:

- **[Quick Deploy Guide](docs/QUICK_DEPLOY.md)** - Get started in minutes
- **[Full Deployment Guide](docs/DEPLOYMENT.md)** - Comprehensive production setup
- **[Deployment Checklist](docs/DEPLOYMENT_CHECKLIST.md)** - Pre/post deployment verification

## Project Structure

```text
app/
├── components/   # Reusable UI (buttons, charts, maps, projects)
├── data/         # JSON data files and precomputed stats
├── hooks/        # Custom hooks (use-auth, use-mobile)
├── lib/db/       # Server-side database providers and utilities
├── routes/       # React Router 7 routes with loaders/actions
│   ├── api/      # API endpoints (projects, profile)
│   └── reports/  # Annual report pages
├── sections/     # Major page sections (Hero, Impact, etc.)
├── types/        # TypeScript interfaces
└── utils/        # Helpers and utilities
drizzle/
└── schema.ts     # PostgreSQL schema definitions (Drizzle ORM)
app/zero/
├── queries.ts    # Zero Sync query definitions
├── mutators.ts   # Zero Sync mutation definitions
└── schema.ts     # Auto-generated Zero schema (from Drizzle)
```

## Scripts

- `pnpm dev` — Start development server
- `pnpm build` — Build for production
- `pnpm start` — Preview production build
- `pnpm lint` — Run ESLint
- `pnpm format` — Format code with Prettier
- `pnpm test:e2e` — Run Playwright E2E tests
- `pnpm test:e2e:ui` — Run Playwright with interactive UI
- `pnpm test:e2e:headed` — Run Playwright with visible browser
- `pnpm tsx scripts/performance-test.ts` — Run database performance analysis

## Architecture: SSR + Zero Sync

The application uses a **progressive enhancement** pattern for data loading:

1. **Server-Side Rendering**: React Router 7 `loader` functions fetch data from Postgres on the server. Pages render immediately with real data — no loading spinners on first paint.
2. **Zero Hydration**: After the page hydrates on the client, [Zero Sync](https://zero.rocicorp.dev/) activates and takes over with live, reactive data. Updates from other users appear in real time.
3. **Graceful Degradation**: If the Zero WebSocket fails, the app still works with the server-loaded snapshot.

### Key Patterns

**`useSafeQuery` hook** (`app/hooks/use-safe-query.ts`):
Wraps Zero's `useQuery` to handle SSR safely. During server-side rendering, it passes `null` to the underlying hook, avoiding the "useZero must be used within ZeroProvider" error.

```tsx
// Before (crashes during SSR):
const [profile] = useQuery(profileQueries.byClerkUserId(userId));

// After (SSR-safe):
const [profile] = useSafeQuery(profileQueries.byClerkUserId(userId));
```

**`createDashboardLoader` factory** (`app/lib/create-dashboard-loader.server.ts`):
Creates standardized server-side loaders for authenticated dashboard routes. Handles Clerk auth checks, profile fetching, and route-specific data in one place.

```tsx
// Simple: just auth + profile
export const loader = createDashboardLoader();

// Extended: auth + profile + projects
export const loader = createDashboardLoader(async ({ profile }) => {
    const projects = profile ? await getProjectsByMemberId(profile.id) : [];
    return { projects };
});
```

**Data resolution order**: `const data = zeroData ?? serverData ?? null`

### Error Boundaries

Dashboard routes export a shared `DashboardErrorBoundary` that catches loader and render errors. The error is displayed inside the `AppLayout` shell so the sidebar and navigation remain functional — users can navigate away without a full page reload.

## E2E Testing

End-to-end tests use [Playwright](https://playwright.dev/) and live in the `e2e/` directory.

```bash
# Start the dev server first (or let Playwright start it automatically)
pnpm dev

# Run all tests
pnpm test:e2e

# Interactive UI mode
pnpm test:e2e:ui

# Run with visible browser
pnpm test:e2e:headed
```

Test suites:
- **`public-pages.spec.ts`** — SSR smoke tests for all public routes (landing, ethos, events, showcase, login)
- **`dashboard.spec.ts`** — Auth redirects and WSOD prevention for protected routes
- **`ssr-hydration.spec.ts`** — Verifies pages render before Zero connects and hydrate without errors

## Deployment Checklist

Before deploying to production, ensure the following steps are completed:

### 1. Environment Variables

Verify all required environment variables are set in your production environment:

- **Database (PostgreSQL + Zero Sync)**
    - `DATABASE_URL` — PostgreSQL connection string
    - `VITE_ZERO_CACHE_URL` — Zero cache URL (e.g., `https://sync.hellomiami.co`)
    - `ZERO_UPSTREAM_DB` — PostgreSQL connection string (for zero-cache)
    - `ZERO_ADMIN_PASSWORD` — Admin password for Zero Inspector

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

### 2. PostgreSQL Database Setup

Set up PostgreSQL 16+ with logical replication enabled. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed instructions.

**Quick setup**:

1. Run database migrations:

    ```bash
    pnpm drizzle-kit migrate
    ```

2. Verify tables were created:

    ```bash
    psql $DATABASE_URL -c "\dt"
    ```

    ```

    ```

3. Seed initial badges (optional):
    ```sql
    INSERT INTO badges (name, description, icon, category) VALUES
    ('First Check-In', 'Attended your first hack night', '⭐', 'attendance'),
    ('Streak Starter', 'Maintained a 2-week attendance streak', '🔥', 'streak'),
    ('Consistent Builder', 'Maintained a 4-week attendance streak', '⚡', 'streak'),
    ('Dedicated Member', 'Maintained an 8-week attendance streak', '💎', 'streak');
    ```

### 3. Deploy zero-cache

Deploy the zero-cache sync engine. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for platform-specific instructions.

**Quick deployment** (using the provided script):

```bash
# Configure production environment
cp .env.production.example .env.production
# Edit .env.production with your values

# Deploy zero-cache
./scripts/deploy-zero-cache.sh production
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

**For detailed production deployment instructions with PostgreSQL + Zero Sync**, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

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
