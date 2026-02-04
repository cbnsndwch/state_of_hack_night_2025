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

## License

This project is dual-licensed:

- **Source Code**: [MIT](LICENSE.md#source-code-license-mit) — Copyright (c) 2025-2026 cbnsndwch LLC
- **Data**: [CC BY-NC 4.0](LICENSE.md#data-license-cc-by-nc-40) — Copyright (c) 2025-2026 cbnsndwch LLC

See [LICENSE.md](LICENSE.md) for full details.
