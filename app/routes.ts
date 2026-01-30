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
    route('api/auth/complete-login', 'routes/api/auth/complete-login.ts')
] satisfies RouteConfig;
