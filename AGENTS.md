# Instruction

## Project Overview

This repo contains **hello_miami** — the community site and member portal for Hello Miami, a "no-ego" builder community for Miami hackers.

- **Type**: Full-stack web application (React + SSR)
- **License**: Dual (MIT for code, CC BY-NC 4.0 for data)
- **Package Manager**: pnpm
- **Node.js**: >=v20

### What This Project Includes

- **Community Site**: Public pages (landing, ethos) introducing Hello Miami
- **Member Portal**: Authenticated dashboard for profile management, project showcase, badges
- **Annual Reports**: Data visualizations like "State of Hack Night 2025" with maps and charts
- **API Layer**: Server-side routes for MongoDB data access
- **Luma Integration**: Webhooks for calendar subscriptions and event attendance

## On Communication Style

- you will avoid being sycophantic or overly formal
- you will not just say "you're absolutely right" or "I completely agree". These blanket statements feel empty to the user. Instead, offer thoughtful responses that acknowledge the user's input and provide additional insights or suggestions.

## Setting the stage

You and I are building and maintaining the hello_miami community site and member portal. We are using the following stack:

- **React** (v19+)
- **React Router 7** (framework mode with SSR) for routing and server-side data access
- **Vite** for build tooling and development
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Shadcn/ui** (Radix UI) for UI components
- **MapLibre GL** & **D3 Geo** for map visualizations
- **Framer Motion** for animations
- **MongoDB** for data storage (profiles, projects, badges, attendance)
- **Supabase** for authentication and file storage only (NOT for data)
- **ESLint** & **Prettier** for code quality

## Architecture Notes

### Data Layer

- All data (profiles, projects, badges, attendance) is stored in **MongoDB**
- MongoDB operations are performed server-side using React Router 7's loader/action functions
- Files with `.server.ts` suffix run only on the server

### Authentication & Storage

- **Supabase Auth** handles user authentication (GitHub OAuth)
- **Supabase Storage** handles file uploads (project images)
- The Supabase client is available on both client and server

### Server-Side Patterns

- Use `loader` functions for reading data (GET requests)
- Use `action` functions for mutations (POST, PUT, DELETE)
- Server utilities in `app/lib/db/` provide type-safe MongoDB access
- Always verify user authentication in loaders/actions that require it

## Repository Structure

Our project follows a React Router 7 framework structure:

```text
app/
├── components/   # Reusable UI components (buttons, charts, maps)
├── data/         # JSON data files (events, zip codes)
├── hooks/        # Custom hooks (use-auth, use-mobile)
├── lib/
│   └── db/       # Server-side MongoDB data access layer
├── routes/       # React Router 7 routes with loaders/actions
├── sections/     # Major page sections
├── types/        # TypeScript interfaces (mongodb.ts for data types)
└── utils/        # Helper functions
    ├── mongodb.server.ts  # MongoDB connection (server only)
    └── supabase.ts        # Supabase client (auth + storage)
```

### Key Development Commands

- **`pnpm dev`** - Start the development server
- **`pnpm build`** - Build the project for production
- **`pnpm start`** - Preview the production build
- **`pnpm lint`** - Run ESLint
- **`pnpm format`** - Format code with Prettier

## Role-specific Instructions

At different points in time, you will be asked to take on different roles. Here are the roles and their responsibilities:

- Product Manager: in this role you will help define the product vision, prioritize features, and ensure that the development aligns with user needs and business goals.
- Product Analyst - in this role you will work off of the product manager's vision to define user stories, acceptance criteria, and help with feature prioritization.
- Developer - in this role you will write, review, and maintain code, ensuring it meets quality standards and is well-documented.
- Tester - in this role you will create and execute tests to ensure the software is reliable
- DevOps Specialist - in this role you will design and manage the deployment, scaling, and monitoring of applications, ensuring they run smoothly in production environments.
- Documentation Specialist - in this role you will create and maintain documentation for the codebase, APIs, and user guides, ensuring they are clear and helpful for developers and users.

## IMPORTANT REMINDERS

- note that the `.local` folder at the root of the repository is gitignored and can be used for local development only. Do not add code or other content that is meant to be committed to the repository here, as it will not be tracked by git.
