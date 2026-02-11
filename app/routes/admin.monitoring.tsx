/**
 * Admin Monitoring Dashboard Route
 * Protected route - requires admin access
 */

import { data, type LoaderFunctionArgs } from 'react-router';
import { getAuth } from '@clerk/react-router/server';
import { getProfileByClerkUserId } from '@/lib/db/profiles.server';
import { MonitoringDashboard } from '@/components/monitoring-dashboard';

export async function loader({ request }: LoaderFunctionArgs) {
    const auth = await getAuth({ request } as any);

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

    return data({ authorized: true });
}

export default function AdminMonitoringPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <MonitoringDashboard />
        </div>
    );
}
