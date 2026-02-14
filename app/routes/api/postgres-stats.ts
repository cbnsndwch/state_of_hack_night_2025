/**
 * API endpoint for PostgreSQL statistics
 * GET /api/postgres-stats
 *
 * Returns comprehensive PostgreSQL performance metrics
 * Admin-only endpoint
 */

import { data, type LoaderFunctionArgs } from 'react-router';
import { getAuth } from '@clerk/react-router/server';
import { getProfileByClerkUserId } from '@/lib/db/profiles.server';
import { postgresMonitoring } from '@/utils/postgres-monitoring.server';

export async function loader(args: LoaderFunctionArgs) {
    const auth = await getAuth(args);

    // Require authentication
    if (!auth.userId) {
        return data({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const profile = await getProfileByClerkUserId(auth.userId);
    if (!profile || profile.role !== 'admin') {
        return data(
            { error: 'Forbidden - Admin access required' },
            { status: 403 }
        );
    }

    try {
        const report = await postgresMonitoring.getPerformanceReport();
        const alerts = postgresMonitoring.checkPostgresAlerts(report);

        return data({
            success: true,
            report,
            alerts,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Failed to get PostgreSQL stats:', error);
        return data(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : 'Failed to get PostgreSQL stats'
            },
            { status: 500 }
        );
    }
}
