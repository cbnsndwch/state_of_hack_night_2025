import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
    // public routes
    index('routes/landing.tsx'),
    route('ethos', 'routes/ethos.tsx'),
    route('reports/2025', 'routes/reports/state-of-hack-night-2025/route.tsx'),

    // auth routes
    route('login', 'routes/login.tsx'),

    // protected routes
    route('dashboard', 'routes/dashboard.tsx'),
    route('dashboard/profile', 'routes/dashboard.profile.tsx'),
    route(
        'dashboard/survey/:surveySlug',
        'routes/dashboard.survey.$surveySlug.tsx'
    ),
    route(
        'dashboard/survey/:surveySlug/results',
        'routes/dashboard.survey.$surveySlug.results.tsx'
    ),

    // admin routes
    route('admin/surveys', 'routes/admin.surveys.tsx'),
    route('admin/surveys/:surveyId', 'routes/admin.surveys.$surveyId.tsx'),
    route('admin/demo-slots', 'routes/admin.demo-slots.tsx'),

    // api routes
    route('api/webhooks/luma', 'routes/api/webhooks/luma.ts'),
    route('api/auth/check-user', 'routes/api/auth/check-user.ts'),
    route('api/auth/complete-login', 'routes/api/auth/complete-login.ts'),
    route('api/profile', 'routes/api/profile.ts'),
    route('api/events', 'routes/api/events.ts'),
    route('api/demo-slots', 'routes/api/demo-slots.ts'),
    route('api/projects-list', 'routes/api/projects-list.ts'),
    route('api/projects', 'routes/api/projects.ts'),
    route('api/check-in', 'routes/api/check-in.ts'),
    route('api/check-in-history', 'routes/api/check-in-history.ts'),
    route('api/recalculate-streaks', 'routes/api/recalculate-streaks.ts'),
    route('api/streak', 'routes/api/streak.ts'),
    route('api/survey-response', 'routes/api/survey-response.ts'),
    route('api/sync-events', 'routes/api/sync-events.ts'),
    route('api/upload-image', 'routes/api/upload-image.ts')
] satisfies RouteConfig;
