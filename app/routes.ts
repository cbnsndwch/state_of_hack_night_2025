import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
    // public routes
    index('routes/landing.tsx'),
    route('manifesto', 'routes/manifesto.tsx'),
    route('reports/2025', 'routes/reports/state-of-hack-night-2025/route.tsx'),

    // protected routes
    route('dashboard', 'routes/dashboard.tsx')
] satisfies RouteConfig;
