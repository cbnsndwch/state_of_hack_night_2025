/**
 * Admin Monitoring Dashboard Route
 * Protected route - requires admin access
 */

import { data, type LoaderFunctionArgs } from 'react-router';
import { getAuth } from '@clerk/react-router/server';
import { getProfileByClerkUserId } from '@/lib/db/profiles.server';
import { MonitoringDashboard } from '@/components/monitoring-dashboard';
import { PostgresMonitoringDashboard } from '@/components/postgres-monitoring-dashboard';
import { useState } from 'react';

export async function loader(args: LoaderFunctionArgs) {
    const auth = await getAuth(args);

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
    const [activeTab, setActiveTab] = useState<'system' | 'postgres'>('system');

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto p-8">
                {/* Tab Navigation */}
                <div className="mb-8 flex gap-4">
                    <button
                        onClick={() => setActiveTab('system')}
                        className={`px-6 py-3 font-bold border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:shadow-none hover:translate-x-1 hover:translate-y-1 ${
                            activeTab === 'system'
                                ? 'bg-yellow-300'
                                : 'bg-white'
                        }`}
                    >
                        System Health
                    </button>
                    <button
                        onClick={() => setActiveTab('postgres')}
                        className={`px-6 py-3 font-bold border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:shadow-none hover:translate-x-1 hover:translate-y-1 ${
                            activeTab === 'postgres'
                                ? 'bg-yellow-300'
                                : 'bg-white'
                        }`}
                    >
                        PostgreSQL Stats
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'system' ? (
                    <MonitoringDashboard />
                ) : (
                    <PostgresMonitoringDashboard />
                )}
            </div>
        </div>
    );
}
