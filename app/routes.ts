import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
    // public routes
    index('routes/landing.tsx'),
    route('ethos', 'routes/ethos.tsx'),
    route('reports/2025', 'routes/reports/state-of-hack-night-2025/route.tsx'),

    // protected routes
    route('dashboard', 'routes/dashboard.tsx'),

    // api routes
    route('api/webhooks/luma', 'routes/api/webhooks/luma.ts'),
    route('api/auth/check-user', 'routes/api/auth/check-user.ts'),
    route('api/auth/complete-login', 'routes/api/auth/complete-login.ts'),
    route('api/profile', 'routes/api/profile.ts'),
    route('api/events', 'routes/api/events.ts'),
    route('api/demo-slots', 'routes/api/demo-slots.ts'),
    route('api/projects-list', 'routes/api/projects-list.ts')
] satisfies RouteConfig;
