/**
 * PostgreSQL Monitoring Dashboard Component
 * Displays comprehensive PostgreSQL performance metrics
 */

import { useEffect, useState } from 'react';
import type {
    PostgresPerformanceReport,
    PostgresQueryStats,
    PostgresActiveQuery,
    PostgresTableStats,
    PostgresIndexStats
} from '@/utils/postgres-monitoring.server';

interface PostgresStatsResponse {
    success: boolean;
    report: PostgresPerformanceReport;
    alerts: string[];
    timestamp: string;
}

export function PostgresMonitoringDashboard() {
    const [stats, setStats] = useState<PostgresStatsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('/api/postgres-stats');
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                const data = await response.json();
                setStats(data);
                setError(null);
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : 'Failed to load stats'
                );
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 30000); // Refresh every 30s

        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="p-8">
                <div className="text-center">
                    Loading PostgreSQL statistics...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="border-4 border-red-500 bg-red-50 p-6">
                    <h2 className="text-xl font-bold text-red-800 mb-2">
                        Error
                    </h2>
                    <p className="text-red-600">{error}</p>
                    <p className="text-sm text-red-500 mt-2">
                        Make sure you have admin access and the database is
                        running.
                    </p>
                </div>
            </div>
        );
    }

    if (!stats || !stats.report) {
        return (
            <div className="p-8">
                <div className="text-center text-gray-500">
                    No statistics available
                </div>
            </div>
        );
    }

    const { report, alerts } = stats;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">PostgreSQL Monitoring</h1>
                <div className="text-sm text-gray-600">
                    Last updated:{' '}
                    {new Date(report.timestamp).toLocaleTimeString()}
                </div>
            </div>

            {/* Alerts */}
            {alerts.length > 0 && (
                <div className="border-4 border-red-500 bg-red-50 p-6 shadow-[8px_8px_0px_0px_rgba(239,68,68,1)]">
                    <h2 className="text-2xl font-bold mb-4 text-red-800">
                        ⚠ Performance Alerts
                    </h2>
                    <ul className="space-y-2">
                        {alerts.map((alert, i) => (
                            <li key={i} className="flex items-start">
                                <span className="text-red-600 mr-2">●</span>
                                <span>{alert}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Cache Hit Ratio"
                    value={`${report.cacheHitRatio}%`}
                    subtitle="Should be > 95%"
                    alert={report.cacheHitRatio < 95}
                />
                <MetricCard
                    title="Transaction Rate"
                    value={`${report.transactionRate}/s`}
                    subtitle="Commits + Rollbacks"
                />
                <MetricCard
                    title="Active Connections"
                    value={report.connections.activeConnections}
                    subtitle={`${report.connections.utilizationPercent}% pool utilization`}
                    alert={report.connections.utilizationPercent > 80}
                />
                <MetricCard
                    title="Total Connections"
                    value={`${report.connections.totalConnections}/${report.connections.maxConnections}`}
                    subtitle="Current / Max"
                />
            </div>

            {/* Connection Statistics */}
            <div className="border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <h2 className="text-2xl font-bold mb-4">Connection Pool</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <StatItem
                        label="Total"
                        value={report.connections.totalConnections}
                    />
                    <StatItem
                        label="Active"
                        value={report.connections.activeConnections}
                    />
                    <StatItem
                        label="Idle"
                        value={report.connections.idleConnections}
                    />
                    <StatItem
                        label="Max"
                        value={report.connections.maxConnections}
                    />
                    <StatItem
                        label="Utilization"
                        value={`${report.connections.utilizationPercent}%`}
                    />
                </div>
            </div>

            {/* Slow Queries */}
            {report.slowQueries.length > 0 && (
                <div className="border-4 border-yellow-500 bg-yellow-50 p-6 shadow-[8px_8px_0px_0px_rgba(234,179,8,1)]">
                    <h2 className="text-2xl font-bold mb-4">
                        Slow Queries (Mean Time &gt; 100ms)
                    </h2>
                    <div className="space-y-3">
                        {report.slowQueries.map((query, i) => (
                            <SlowQueryCard key={i} query={query} />
                        ))}
                    </div>
                </div>
            )}

            {/* Active Queries */}
            {report.activeQueries.length > 0 && (
                <div className="border-4 border-blue-500 bg-blue-50 p-6 shadow-[8px_8px_0px_0px_rgba(59,130,246,1)]">
                    <h2 className="text-2xl font-bold mb-4">
                        Active Queries ({report.activeQueries.length})
                    </h2>
                    <div className="space-y-3">
                        {report.activeQueries.map((query, i) => (
                            <ActiveQueryCard key={i} query={query} />
                        ))}
                    </div>
                </div>
            )}

            {/* Table Statistics */}
            {report.tableStats.length > 0 && (
                <div className="border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <h2 className="text-2xl font-bold mb-4">
                        Table Statistics
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b-2 border-black">
                                <tr>
                                    <th className="text-left p-2">Table</th>
                                    <th className="text-right p-2">Rows</th>
                                    <th className="text-right p-2">
                                        Table Size
                                    </th>
                                    <th className="text-right p-2">
                                        Index Size
                                    </th>
                                    <th className="text-right p-2">
                                        Total Size
                                    </th>
                                    <th className="text-right p-2">
                                        Last Vacuum
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.tableStats.map((table, i) => (
                                    <TableStatsRow key={i} table={table} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Index Statistics */}
            {report.indexStats.length > 0 && (
                <div className="border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <h2 className="text-2xl font-bold mb-4">
                        Index Usage Statistics
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b-2 border-black">
                                <tr>
                                    <th className="text-left p-2">Table</th>
                                    <th className="text-left p-2">Index</th>
                                    <th className="text-right p-2">Size</th>
                                    <th className="text-right p-2">Scans</th>
                                    <th className="text-right p-2">
                                        Efficiency
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.indexStats.map((index, i) => (
                                    <IndexStatsRow key={i} index={index} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function MetricCard({
    title,
    value,
    subtitle,
    alert = false
}: {
    title: string;
    value: string | number;
    subtitle?: string;
    alert?: boolean;
}) {
    return (
        <div
            className={`border-4 ${alert ? 'border-red-500 bg-red-50' : 'border-black'} p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}
        >
            <div className="text-sm text-gray-600 mb-1">{title}</div>
            <div
                className={`text-3xl font-bold ${alert ? 'text-red-600' : ''}`}
            >
                {value}
            </div>
            {subtitle && (
                <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
            )}
        </div>
    );
}

function StatItem({ label, value }: { label: string; value: string | number }) {
    return (
        <div>
            <div className="text-sm text-gray-600">{label}</div>
            <div className="text-xl font-bold">{value}</div>
        </div>
    );
}

function SlowQueryCard({ query }: { query: PostgresQueryStats }) {
    return (
        <div className="border-2 border-yellow-600 bg-white p-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-2 text-sm">
                <StatItem label="Calls" value={query.calls} />
                <StatItem
                    label="Mean Time"
                    value={`${query.meanTimeMs.toFixed(2)}ms`}
                />
                <StatItem
                    label="Max Time"
                    value={`${query.maxTimeMs.toFixed(2)}ms`}
                />
                <StatItem
                    label="Total Time"
                    value={`${query.totalTimeMs.toFixed(2)}ms`}
                />
                <StatItem label="Rows" value={query.rows} />
            </div>
            <details className="mt-2">
                <summary className="cursor-pointer text-sm text-gray-700 hover:text-gray-900">
                    View Query
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 overflow-x-auto">
                    {query.query}
                </pre>
            </details>
        </div>
    );
}

function ActiveQueryCard({ query }: { query: PostgresActiveQuery }) {
    return (
        <div className="border-2 border-blue-600 bg-white p-3">
            <div className="flex justify-between items-start mb-2">
                <div className="text-sm">
                    <span className="font-bold">PID:</span> {query.pid} |{' '}
                    <span className="font-bold">User:</span> {query.username} |{' '}
                    <span className="font-bold">State:</span> {query.state}
                </div>
                <div className="text-sm font-bold text-blue-600">
                    {query.duration}
                </div>
            </div>
            {query.waitEvent && (
                <div className="text-xs text-gray-600 mb-1">
                    Waiting on: {query.waitEvent}
                </div>
            )}
            <details className="mt-2">
                <summary className="cursor-pointer text-sm text-gray-700 hover:text-gray-900">
                    View Query
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 overflow-x-auto">
                    {query.query}
                </pre>
            </details>
        </div>
    );
}

function TableStatsRow({ table }: { table: PostgresTableStats }) {
    return (
        <tr className="border-b border-gray-200">
            <td className="p-2 font-mono text-xs">{table.tableName}</td>
            <td className="p-2 text-right">
                {table.rowCount.toLocaleString()}
            </td>
            <td className="p-2 text-right">{table.tableSize}</td>
            <td className="p-2 text-right">{table.indexSize}</td>
            <td className="p-2 text-right font-bold">{table.totalSize}</td>
            <td className="p-2 text-right text-xs">
                {table.lastVacuum
                    ? new Date(table.lastVacuum).toLocaleDateString()
                    : 'Never'}
            </td>
        </tr>
    );
}

function IndexStatsRow({ index }: { index: PostgresIndexStats }) {
    const isUnused = index.scans === 0;
    const isInefficient = index.efficiency < 50 && index.scans > 0;

    return (
        <tr
            className={`border-b border-gray-200 ${
                isUnused ? 'bg-red-50' : isInefficient ? 'bg-yellow-50' : ''
            }`}
        >
            <td className="p-2 font-mono text-xs">{index.tableName}</td>
            <td className="p-2 font-mono text-xs">{index.indexName}</td>
            <td className="p-2 text-right">{index.indexSize}</td>
            <td className="p-2 text-right">
                {isUnused ? (
                    <span className="text-red-600 font-bold">
                        {index.scans} ⚠
                    </span>
                ) : (
                    index.scans.toLocaleString()
                )}
            </td>
            <td className="p-2 text-right">
                {index.scans > 0 ? (
                    <span
                        className={
                            isInefficient ? 'text-yellow-600 font-bold' : ''
                        }
                    >
                        {index.efficiency.toFixed(1)}%
                    </span>
                ) : (
                    '-'
                )}
            </td>
        </tr>
    );
}
