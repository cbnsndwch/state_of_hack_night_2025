/**
 * Metrics API Endpoint
 * Returns performance metrics and recent errors
 * Protected endpoint - requires admin access
 */

import { data, type LoaderFunctionArgs } from 'react-router';
import { getAuth } from '@clerk/react-router/server';
import {
    getMetricsSummary,
    getRecentErrors,
    checkAlerts
} from '@/utils/monitoring.server';
import { getProfileByClerkUserId } from '@/lib/db/profiles.server';

export async function loader({ request }: LoaderFunctionArgs) {
    const auth = await getAuth({ request } as any);

    if (!auth.userId) {
        return data({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (you can adjust this logic)
    const profile = await getProfileByClerkUserId(auth.userId);
    if (!profile || profile.role !== 'admin') {
        return data(
            { error: 'Forbidden - Admin access required' },
            { status: 403 }
        );
    }

    const url = new URL(request.url);
    const hoursAgo = parseInt(url.searchParams.get('hours') || '1', 10);
    const since = new Date(Date.now() - hoursAgo * 3600000);

    const metrics = getMetricsSummary(since);
    const errors = getRecentErrors(50);
    const alerts = checkAlerts();

    return data({
        metrics,
        errors,
        alerts,
        period: `Last ${hoursAgo} hour(s)`,
        timestamp: new Date().toISOString()
    });
}
