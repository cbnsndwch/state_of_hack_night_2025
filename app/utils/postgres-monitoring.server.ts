/**
 * PostgreSQL Query Monitoring Utilities
 * Server-side only
 *
 * Provides tools for monitoring PostgreSQL performance:
 * - Slow query detection
 * - Connection pool statistics
 * - Active queries
 * - Table statistics
 * - Index usage
 */

import { db } from '@/lib/db/provider.server';
import { sql } from 'drizzle-orm';
import {
    logError,
    recordMetric,
    PerformanceTracker
} from './monitoring.server';

// Types
export interface PostgresQueryStats {
    query: string;
    calls: number;
    totalTimeMs: number;
    meanTimeMs: number;
    maxTimeMs: number;
    rows: number;
}

export interface PostgresConnectionStats {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    maxConnections: number;
    utilizationPercent: number;
}

export interface PostgresTableStats {
    tableName: string;
    rowCount: number;
    tableSize: string;
    indexSize: string;
    totalSize: string;
    lastVacuum: Date | null;
    lastAnalyze: Date | null;
}

export interface PostgresIndexStats {
    tableName: string;
    indexName: string;
    indexSize: string;
    scans: number;
    tuplesRead: number;
    tuplesReturned: number;
    efficiency: number;
}

export interface PostgresActiveQuery {
    pid: number;
    username: string;
    database: string;
    query: string;
    duration: string;
    state: string;
    waitEvent: string | null;
}

export interface PostgresPerformanceReport {
    timestamp: string;
    connections: PostgresConnectionStats;
    slowQueries: PostgresQueryStats[];
    activeQueries: PostgresActiveQuery[];
    tableStats: PostgresTableStats[];
    indexStats: PostgresIndexStats[];
    cacheHitRatio: number;
    transactionRate: number;
}

/**
 * Enable pg_stat_statements extension (run once during setup)
 * This allows tracking of query statistics
 */
export async function enableQueryStats(): Promise<void> {
    try {
        await db.execute(
            sql`CREATE EXTENSION IF NOT EXISTS pg_stat_statements`
        );
        console.log('✅ pg_stat_statements extension enabled');
    } catch (error) {
        console.error('Failed to enable pg_stat_statements:', error);
        throw error;
    }
}

/**
 * Get connection pool statistics
 */
export async function getConnectionStats(): Promise<PostgresConnectionStats> {
    const tracker = new PerformanceTracker('postgres.connection_stats');

    try {
        const result = await db.execute(sql`
            SELECT 
                (SELECT count(*) FROM pg_stat_activity) AS total_connections,
                (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') AS active_connections,
                (SELECT count(*) FROM pg_stat_activity WHERE state = 'idle') AS idle_connections,
                (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') AS max_connections
        `);

        const row = result.rows[0] as any;
        const utilizationPercent =
            (Number(row.total_connections) / Number(row.max_connections)) * 100;

        return {
            totalConnections: Number(row.total_connections),
            activeConnections: Number(row.active_connections),
            idleConnections: Number(row.idle_connections),
            maxConnections: Number(row.max_connections),
            utilizationPercent: Number(utilizationPercent.toFixed(2))
        };
    } catch (error) {
        logError({
            level: 'error',
            message: 'Failed to get connection stats',
            timestamp: new Date().toISOString(),
            context: { error }
        });
        throw error;
    } finally {
        tracker.end();
    }
}

/**
 * Get slow queries from pg_stat_statements
 * Requires pg_stat_statements extension
 */
export async function getSlowQueries(
    limitRows = 10,
    minTimeMs = 100
): Promise<PostgresQueryStats[]> {
    const tracker = new PerformanceTracker('postgres.slow_queries');

    try {
        const result = await db.execute(sql`
            SELECT 
                query,
                calls,
                total_exec_time as total_time_ms,
                mean_exec_time as mean_time_ms,
                max_exec_time as max_time_ms,
                rows
            FROM pg_stat_statements
            WHERE mean_exec_time > ${minTimeMs}
            ORDER BY total_exec_time DESC
            LIMIT ${limitRows}
        `);

        const queries = result.rows.map((row: any) => ({
            query: String(row.query).substring(0, 200), // Truncate long queries
            calls: Number(row.calls),
            totalTimeMs: Number(row.total_time_ms),
            meanTimeMs: Number(row.mean_time_ms),
            maxTimeMs: Number(row.max_time_ms),
            rows: Number(row.rows)
        }));

        // Log slow queries as metrics
        queries.forEach(q => {
            if (q.meanTimeMs > 500) {
                recordMetric({
                    name: 'postgres.slow_query',
                    value: q.meanTimeMs,
                    timestamp: new Date().toISOString(),
                    tags: { query: q.query.substring(0, 50) }
                });
            }
        });

        return queries;
    } catch (error: any) {
        // If pg_stat_statements is not available, return empty array
        if (error.message?.includes('pg_stat_statements')) {
            console.warn(
                'pg_stat_statements extension not available. Run enableQueryStats() to enable.'
            );
            return [];
        }

        logError({
            level: 'error',
            message: 'Failed to get slow queries',
            timestamp: new Date().toISOString(),
            context: { error }
        });
        return [];
    } finally {
        tracker.end();
    }
}

/**
 * Get currently active queries
 */
export async function getActiveQueries(): Promise<PostgresActiveQuery[]> {
    const tracker = new PerformanceTracker('postgres.active_queries');

    try {
        const result = await db.execute(sql`
            SELECT 
                pid,
                usename as username,
                datname as database,
                query,
                state,
                wait_event as wait_event,
                now() - query_start AS duration
            FROM pg_stat_activity
            WHERE state = 'active' 
            AND query NOT LIKE '%pg_stat_activity%'
            ORDER BY query_start ASC
        `);

        return result.rows.map((row: any) => ({
            pid: Number(row.pid),
            username: String(row.username),
            database: String(row.database),
            query: String(row.query).substring(0, 200),
            duration: String(row.duration),
            state: String(row.state),
            waitEvent: row.wait_event ? String(row.wait_event) : null
        }));
    } catch (error) {
        logError({
            level: 'error',
            message: 'Failed to get active queries',
            timestamp: new Date().toISOString(),
            context: { error }
        });
        return [];
    } finally {
        tracker.end();
    }
}

/**
 * Get table statistics (size, row count, vacuum stats)
 */
export async function getTableStats(): Promise<PostgresTableStats[]> {
    const tracker = new PerformanceTracker('postgres.table_stats');

    try {
        const result = await db.execute(sql`
            SELECT 
                schemaname || '.' || tablename AS table_name,
                n_live_tup AS row_count,
                pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
                pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
                pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS index_size,
                last_vacuum,
                last_analyze
            FROM pg_stat_user_tables
            ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        `);

        return result.rows.map((row: any) => ({
            tableName: String(row.table_name),
            rowCount: Number(row.row_count),
            tableSize: String(row.table_size),
            indexSize: String(row.index_size),
            totalSize: String(row.total_size),
            lastVacuum: row.last_vacuum ? new Date(row.last_vacuum) : null,
            lastAnalyze: row.last_analyze ? new Date(row.last_analyze) : null
        }));
    } catch (error) {
        logError({
            level: 'error',
            message: 'Failed to get table stats',
            timestamp: new Date().toISOString(),
            context: { error }
        });
        return [];
    } finally {
        tracker.end();
    }
}

/**
 * Get index usage statistics
 */
export async function getIndexStats(): Promise<PostgresIndexStats[]> {
    const tracker = new PerformanceTracker('postgres.index_stats');

    try {
        const result = await db.execute(sql`
            SELECT 
                schemaname || '.' || tablename AS table_name,
                indexname AS index_name,
                pg_size_pretty(pg_relation_size(schemaname||'.'||indexname)) AS index_size,
                idx_scan AS scans,
                idx_tup_read AS tuples_read,
                idx_tup_fetch AS tuples_returned,
                CASE 
                    WHEN idx_tup_read > 0 THEN (idx_tup_fetch::float / idx_tup_read * 100)
                    ELSE 0 
                END AS efficiency
            FROM pg_stat_user_indexes
            ORDER BY idx_scan DESC
        `);

        return result.rows.map((row: any) => ({
            tableName: String(row.table_name),
            indexName: String(row.index_name),
            indexSize: String(row.index_size),
            scans: Number(row.scans),
            tuplesRead: Number(row.tuples_read),
            tuplesReturned: Number(row.tuples_returned),
            efficiency: Number(row.efficiency)
        }));
    } catch (error) {
        logError({
            level: 'error',
            message: 'Failed to get index stats',
            timestamp: new Date().toISOString(),
            context: { error }
        });
        return [];
    } finally {
        tracker.end();
    }
}

/**
 * Get cache hit ratio (should be > 95% for good performance)
 */
export async function getCacheHitRatio(): Promise<number> {
    const tracker = new PerformanceTracker('postgres.cache_hit_ratio');

    try {
        const result = await db.execute(sql`
            SELECT 
                sum(blks_hit) / nullif(sum(blks_hit) + sum(blks_read), 0) * 100 AS cache_hit_ratio
            FROM pg_stat_database
            WHERE datname = current_database()
        `);

        const ratio = Number(result.rows[0]?.cache_hit_ratio || 0);

        recordMetric({
            name: 'postgres.cache_hit_ratio',
            value: ratio,
            timestamp: new Date().toISOString()
        });

        return Number(ratio.toFixed(2));
    } catch (error) {
        logError({
            level: 'error',
            message: 'Failed to get cache hit ratio',
            timestamp: new Date().toISOString(),
            context: { error }
        });
        return 0;
    } finally {
        tracker.end();
    }
}

/**
 * Get transaction rate (commits + rollbacks per second)
 */
export async function getTransactionRate(): Promise<number> {
    const tracker = new PerformanceTracker('postgres.transaction_rate');

    try {
        const result = await db.execute(sql`
            SELECT 
                (xact_commit + xact_rollback) / GREATEST(EXTRACT(EPOCH FROM (now() - stats_reset)), 1) AS tx_per_second
            FROM pg_stat_database
            WHERE datname = current_database()
        `);

        const rate = Number(result.rows[0]?.tx_per_second || 0);

        recordMetric({
            name: 'postgres.transaction_rate',
            value: rate,
            timestamp: new Date().toISOString()
        });

        return Number(rate.toFixed(2));
    } catch (error) {
        logError({
            level: 'error',
            message: 'Failed to get transaction rate',
            timestamp: new Date().toISOString(),
            context: { error }
        });
        return 0;
    } finally {
        tracker.end();
    }
}

/**
 * Get a comprehensive performance report
 */
export async function getPerformanceReport(): Promise<PostgresPerformanceReport> {
    const tracker = new PerformanceTracker('postgres.performance_report');

    try {
        const [
            connections,
            slowQueries,
            activeQueries,
            tableStats,
            indexStats,
            cacheHitRatio,
            transactionRate
        ] = await Promise.all([
            getConnectionStats(),
            getSlowQueries(10, 100),
            getActiveQueries(),
            getTableStats(),
            getIndexStats(),
            getCacheHitRatio(),
            getTransactionRate()
        ]);

        return {
            timestamp: new Date().toISOString(),
            connections,
            slowQueries,
            activeQueries,
            tableStats,
            indexStats,
            cacheHitRatio,
            transactionRate
        };
    } catch (error) {
        logError({
            level: 'error',
            message: 'Failed to generate performance report',
            timestamp: new Date().toISOString(),
            context: { error }
        });
        throw error;
    } finally {
        tracker.end();
    }
}

/**
 * Check if any performance alerts should be triggered
 */
export function checkPostgresAlerts(
    report: PostgresPerformanceReport
): string[] {
    const alerts: string[] = [];

    // Connection pool alerts
    if (report.connections.utilizationPercent > 80) {
        alerts.push(
            `High connection pool utilization: ${report.connections.utilizationPercent}%`
        );
    }

    // Cache hit ratio alert
    if (report.cacheHitRatio < 95) {
        alerts.push(
            `Low cache hit ratio: ${report.cacheHitRatio}% (should be > 95%)`
        );
    }

    // Slow query alerts
    const criticalSlowQueries = report.slowQueries.filter(
        q => q.meanTimeMs > 1000
    );
    if (criticalSlowQueries.length > 0) {
        alerts.push(
            `${criticalSlowQueries.length} queries with mean time > 1000ms`
        );
    }

    // Long-running query alerts
    const longRunningQueries = report.activeQueries.filter(q => {
        const durationMatch = q.duration.match(/(\d+):(\d+):(\d+)/);
        if (durationMatch) {
            const hours = parseInt(durationMatch[1]);
            const minutes = parseInt(durationMatch[2]);
            return hours > 0 || minutes > 5;
        }
        return false;
    });

    if (longRunningQueries.length > 0) {
        alerts.push(
            `${longRunningQueries.length} queries running for > 5 minutes`
        );
    }

    // Unused index alerts (indexes with 0 scans that take up space)
    const unusedIndexes = report.indexStats.filter(
        idx => idx.scans === 0 && idx.indexSize !== '0 bytes'
    );
    if (unusedIndexes.length > 0) {
        alerts.push(
            `${unusedIndexes.length} unused indexes detected (consider removal)`
        );
    }

    return alerts;
}

/**
 * Reset query statistics (for pg_stat_statements)
 */
export async function resetQueryStats(): Promise<void> {
    try {
        await db.execute(sql`SELECT pg_stat_statements_reset()`);
        console.log('✅ Query statistics reset');
    } catch (error: any) {
        if (error.message?.includes('pg_stat_statements')) {
            throw new Error(
                'pg_stat_statements extension not available. Run enableQueryStats() first.'
            );
        }
        throw error;
    }
}

// Export all monitoring functions
export const postgresMonitoring = {
    enableQueryStats,
    getConnectionStats,
    getSlowQueries,
    getActiveQueries,
    getTableStats,
    getIndexStats,
    getCacheHitRatio,
    getTransactionRate,
    getPerformanceReport,
    checkPostgresAlerts,
    resetQueryStats
};
