/**
 * Reusable error boundary for dashboard routes.
 *
 * Displays a styled error card inside the AppLayout shell so the user
 * can still navigate away using the sidebar/topbar. This keeps
 * loader failures from nuking the entire page to white.
 *
 * Usage — export from any route file:
 * ```ts
 * export { DashboardErrorBoundary as ErrorBoundary } from '@/components/layout/DashboardErrorBoundary';
 * ```
 */

import { isRouteErrorResponse, Link, useRouteError } from 'react-router';

import { AppLayout } from '@/components/layout/AppLayout';
import { NeoButton } from '@/components/ui/NeoButton';
import { NeoCard } from '@/components/ui/NeoCard';

function getErrorInfo(error: unknown) {
    if (isRouteErrorResponse(error)) {
        if (error.status === 404) {
            return {
                title: '404 — not_found',
                message: "The page you're looking for doesn't exist.",
                status: error.status
            };
        }
        if (error.status === 401 || error.status === 302) {
            return {
                title: 'session_expired',
                message:
                    'Your session may have expired. Try logging in again.',
                status: error.status
            };
        }
        return {
            title: `error_${error.status}`,
            message:
                error.statusText ||
                'Something went wrong loading this page.',
            status: error.status
        };
    }

    if (error instanceof Error) {
        return {
            title: 'unexpected_error',
            message: import.meta.env.DEV
                ? error.message
                : 'Something went wrong. Please try again.',
            stack: import.meta.env.DEV ? error.stack : undefined,
            status: 500
        };
    }

    return {
        title: 'unknown_error',
        message: 'An unexpected error occurred.',
        status: 500
    };
}

export function DashboardErrorBoundary() {
    const error = useRouteError();
    const { title, message, stack, status } = getErrorInfo(error);

    return (
        <AppLayout>
            <div className="min-h-full bg-black px-4 py-12">
                <div className="max-w-2xl mx-auto">
                    <NeoCard className="p-8 text-center">
                        <div className="mb-4 text-5xl font-mono opacity-40">
                            {status === 404 ? '¯\\_(ツ)_/¯' : '⚠'}
                        </div>

                        <h1 className="mb-3 font-mono text-2xl font-bold text-red-500">
                            {title}
                        </h1>

                        <p className="mb-6 text-zinc-400">{message}</p>

                        {stack && (
                            <pre className="mb-6 max-h-48 overflow-auto rounded bg-zinc-900 p-4 text-left text-xs text-zinc-500">
                                <code>{stack}</code>
                            </pre>
                        )}

                        <div className="flex flex-wrap items-center justify-center gap-4">
                            <NeoButton
                                onClick={() => window.location.reload()}
                                variant="primary"
                            >
                                retry
                            </NeoButton>
                            <Link to="/dashboard">
                                <NeoButton variant="secondary">
                                    back_to_dashboard
                                </NeoButton>
                            </Link>
                        </div>
                    </NeoCard>
                </div>
            </div>
        </AppLayout>
    );
}
