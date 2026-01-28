import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
    // public routes
    index('routes/landing.tsx'),
    route('ethos', 'routes/ethos.tsx'),
    route('reports/2025', 'routes/reports/state-of-hack-night-2025/route.tsx'),

    // protected routes
    route('dashboard', 'routes/dashboard.tsx'),

    // API routes (server-side loaders/actions for MongoDB)
    route('api/projects', 'routes/api/projects.ts'),
    route('api/projects-list', 'routes/api/projects-list.ts'),
    route('api/profile', 'routes/api/profile.ts')
] satisfies RouteConfig;
