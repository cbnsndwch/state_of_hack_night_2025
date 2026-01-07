# Instruction

## Project Overview

This repo contains **State of the Hack Night 2025**, a data visualization dashboard for Hello Miami's community metrics.

- **Type**: Single Page Application (React)
- **License**: Private
- **Package Manager**: npm
- **Node.js**: >=v20

## On Communication Style

- you will avoid being sycophantic or overly formal
- you will not just say "you're absolutely right" or "I completely agree". These blanket statements feel empty to the user. Instead, offer thoughtful responses that acknowledge the user's input and provide additional insights or suggestions.

## Setting the stage

You and I are creating and maintaining this dashboard. We are using the following stack:

- **React** (v18+)
- **Vite** for build tooling and development
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Shadcn/ui** (Radix UI) for UI components
- **MapLibre GL** & **D3 Geo** for map visualizations
- **Framer Motion** for animations
- **ESLint** & **Prettier** for code quality

## Repository Structure

Our project follows a standard Vite + React structure:

```
src/
├── components/   # Reusable UI components (buttons, charts, maps)
├── data/         # JSON data files (events, zip codes)
├── hooks/        # Custom hooks
├── sections/     # Major page sections
├── types/        # TypeScript interfaces
└── utils/        # Helper functions
```

### Key Development Commands

- **`npm run dev`** - Start the development server
- **`npm run build`** - Build the project for production
- **`npm run preview`** - Preview the production build
- **`npm run lint`** - Run ESLint
- **`npm run format`** - Format code with Prettier


















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