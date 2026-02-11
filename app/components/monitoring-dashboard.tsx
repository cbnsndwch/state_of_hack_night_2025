/**
 * Monitoring Dashboard Component
 * Displays health status, metrics, and alerts
 */

import { useEffect, useState } from 'react';
import type { HealthCheckResult, ErrorLog } from '@/utils/monitoring.server';

interface MetricsSummary {
    [key: string]: {
        count: number;
        avg: number;
        min: number;
        max: number;
    };
}

interface MetricsData {
    metrics: MetricsSummary;
    errors: ErrorLog[];
    alerts: string[];
    period: string;
    timestamp: string;
}

export function MonitoringDashboard() {
    const [health, setHealth] = useState<HealthCheckResult | null>(null);
    const [metrics, setMetrics] = useState<MetricsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch health status
                const healthRes = await fetch('/api/health');
                if (healthRes.ok) {
                    const healthData = await healthRes.json();
                    setHealth(healthData);
                }

                // Fetch metrics (this will fail if user is not admin)
                const metricsRes = await fetch('/api/metrics?hours=1');
                if (metricsRes.ok) {
                    const metricsData = await metricsRes.json();
                    setMetrics(metricsData);
                }
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to load monitoring data'
                );
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds

        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="p-8">
                <div className="text-center">Loading monitoring data...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="text-red-600">Error: {error}</div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold">System Monitoring</h1>

            {/* Health Status */}
            {health && (
                <div className="border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <h2 className="text-2xl font-bold mb-4">Health Status</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <HealthStatusCard
                            name="Database"
                            status={health.checks.database}
                        />
                        <HealthStatusCard
                            name="Zero Cache"
                            status={health.checks.zeroCache}
                        />
                        <HealthStatusCard
                            name="Authentication"
                            status={health.checks.auth}
                        />
                    </div>
                    <div className="mt-4 text-sm text-gray-600">
                        <p>
                            Overall Status:{' '}
                            <span
                                className={`font-bold ${getStatusColor(health.status)}`}
                            >
                                {health.status.toUpperCase()}
                            </span>
                        </p>
                        <p>Uptime: {Math.floor(health.uptime / 60)} minutes</p>
                        <p>
                            Last Updated:{' '}
                            {new Date(health.timestamp).toLocaleTimeString()}
                        </p>
                    </div>
                </div>
            )}

            {/* Alerts */}
            {metrics && metrics.alerts.length > 0 && (
                <div className="border-4 border-red-500 bg-red-50 p-6 shadow-[8px_8px_0px_0px_rgba(239,68,68,1)]">
                    <h2 className="text-2xl font-bold mb-4 text-red-800">
                        Active Alerts
                    </h2>
                    <ul className="space-y-2">
                        {metrics.alerts.map((alert, i) => (
                            <li key={i} className="flex items-start">
                                <span className="text-red-600 mr-2">⚠</span>
                                <span>{alert}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Performance Metrics */}
            {metrics && Object.keys(metrics.metrics).length > 0 && (
                <div className="border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <h2 className="text-2xl font-bold mb-4">
                        Performance Metrics
                    </h2>
                    <p className="text-sm text-gray-600 mb-4">
                        {metrics.period}
                    </p>
                    <div className="space-y-4">
                        {Object.entries(metrics.metrics).map(([name, data]) => (
                            <div
                                key={name}
                                className="border-2 border-gray-300 p-4"
                            >
                                <h3 className="font-bold mb-2">{name}</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <div className="text-gray-600">
                                            Count
                                        </div>
                                        <div className="font-bold">
                                            {data.count}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-gray-600">
                                            Average
                                        </div>
                                        <div className="font-bold">
                                            {data.avg.toFixed(2)}ms
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-gray-600">Min</div>
                                        <div className="font-bold">
                                            {data.min.toFixed(2)}ms
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-gray-600">Max</div>
                                        <div className="font-bold">
                                            {data.max.toFixed(2)}ms
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Errors */}
            {metrics && metrics.errors.length > 0 && (
                <div className="border-4 border-yellow-500 bg-yellow-50 p-6 shadow-[8px_8px_0px_0px_rgba(234,179,8,1)]">
                    <h2 className="text-2xl font-bold mb-4">Recent Errors</h2>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {metrics.errors.map((err, i) => (
                            <div
                                key={i}
                                className="border-2 border-yellow-300 bg-white p-3 text-sm"
                            >
                                <div className="flex items-start justify-between">
                                    <span
                                        className={`font-bold ${err.level === 'error' ? 'text-red-600' : 'text-yellow-600'}`}
                                    >
                                        [{err.level.toUpperCase()}]
                                    </span>
                                    <span className="text-gray-500 text-xs">
                                        {new Date(
                                            err.timestamp
                                        ).toLocaleString()}
                                    </span>
                                </div>
                                <div className="mt-1">{err.message}</div>
                                {err.context && (
                                    <details className="mt-2">
                                        <summary className="cursor-pointer text-gray-600">
                                            Show context
                                        </summary>
                                        <pre className="mt-2 text-xs bg-gray-100 p-2 overflow-x-auto">
                                            {JSON.stringify(
                                                err.context,
                                                null,
                                                2
                                            )}
                                        </pre>
                                    </details>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function HealthStatusCard({
    name,
    status
}: {
    name: string;
    status: { status: string; responseTime?: number; error?: string };
}) {
    const statusColor =
        status.status === 'up'
            ? 'bg-green-500'
            : status.status === 'degraded'
              ? 'bg-yellow-500'
              : 'bg-red-500';

    return (
        <div className="border-2 border-black p-4">
            <h3 className="font-bold mb-2">{name}</h3>
            <div
                className={`${statusColor} text-white px-3 py-1 inline-block font-bold`}
            >
                {status.status.toUpperCase()}
            </div>
            {status.responseTime && (
                <div className="text-sm mt-2 text-gray-600">
                    Response: {status.responseTime}ms
                </div>
            )}
            {status.error && (
                <div className="text-sm mt-2 text-red-600">
                    Error: {status.error}
                </div>
            )}
        </div>
    );
}

function getStatusColor(status: string): string {
    switch (status) {
        case 'healthy':
            return 'text-green-600';
        case 'degraded':
            return 'text-yellow-600';
        case 'unhealthy':
            return 'text-red-600';
        default:
            return 'text-gray-600';
    }
}
