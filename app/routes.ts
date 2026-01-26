import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
    index('routes/landing.tsx'),
    route('manifesto', 'routes/manifesto.tsx'),
    route('reports/2025', 'routes/reports.2025/route.tsx'),
    route('dashboard', 'routes/dashboard.tsx')
] satisfies RouteConfig;
