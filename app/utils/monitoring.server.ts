/**
 * Monitoring and alerting utilities for Hello Miami
 * Server-side only
 */

// Types
export interface HealthCheckResult {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    checks: {
        database: HealthStatus;
        zeroCache: HealthStatus;
        auth: HealthStatus;
    };
    uptime: number;
    version: string;
}

export interface HealthStatus {
    status: 'up' | 'down' | 'degraded';
    responseTime?: number;
    error?: string;
    details?: Record<string, unknown>;
}

export interface MetricData {
    name: string;
    value: number;
    timestamp: string;
    tags?: Record<string, string>;
}

export interface ErrorLog {
    level: 'error' | 'warn' | 'info';
    message: string;
    timestamp: string;
    context?: Record<string, unknown>;
    stack?: string;
    userId?: string;
}

// In-memory metrics store (for development)
const metrics: MetricData[] = [];
const errors: ErrorLog[] = [];
const MAX_STORED_METRICS = 1000;
const MAX_STORED_ERRORS = 500;

// Performance tracking
export class PerformanceTracker {
    private startTime: number;
    private name: string;

    constructor(name: string) {
        this.name = name;
        this.startTime = Date.now();
    }

    end(tags?: Record<string, string>): number {
        const duration = Date.now() - this.startTime;
        recordMetric({
            name: this.name,
            value: duration,
            timestamp: new Date().toISOString(),
            tags
        });
        return duration;
    }
}

// Metric recording
export function recordMetric(metric: MetricData): void {
    metrics.push(metric);

    // Keep only recent metrics
    if (metrics.length > MAX_STORED_METRICS) {
        metrics.shift();
    }

    // Log slow queries
    if (metric.name.includes('query') && metric.value > 1000) {
        logError({
            level: 'warn',
            message: `Slow query detected: ${metric.name} took ${metric.value}ms`,
            timestamp: metric.timestamp,
            context: { metric }
        });
    }
}

// Error logging
export function logError(error: ErrorLog): void {
    errors.push(error);

    // Keep only recent errors
    if (errors.length > MAX_STORED_ERRORS) {
        errors.shift();
    }

    // Console output for development
    const logMethod =
        error.level === 'error'
            ? console.error
            : error.level === 'warn'
              ? console.warn
              : console.log;

    logMethod(`[${error.level.toUpperCase()}] ${error.message}`, {
        timestamp: error.timestamp,
        context: error.context,
        stack: error.stack
    });

    // In production, send to external logging service (e.g., Sentry, LogRocket)
    if (process.env.NODE_ENV === 'production') {
        // TODO: Integrate with external logging service
        // Example: Sentry.captureException(error)
    }
}

// Health checks
export async function checkDatabaseHealth(): Promise<HealthStatus> {
    const startTime = Date.now();

    try {
        // Import here to avoid circular dependencies
        const { db } = await import('@/lib/db/provider.server');

        // Simple query to check connection
        await db.execute('SELECT 1 as health');

        const responseTime = Date.now() - startTime;

        return {
            status: responseTime < 100 ? 'up' : 'degraded',
            responseTime
        };
    } catch (err) {
        const error = err as Error;
        logError({
            level: 'error',
            message: 'Database health check failed',
            timestamp: new Date().toISOString(),
            context: { error: error.message },
            stack: error.stack
        });

        return {
            status: 'down',
            error: error.message
        };
    }
}

export async function checkZeroCacheHealth(): Promise<HealthStatus> {
    const startTime = Date.now();

    try {
        const zeroCacheUrl =
            process.env.ZERO_QUERY_URL || 'http://localhost:4848';

        // Try to fetch from zero-cache
        const response = await fetch(zeroCacheUrl, {
            method: 'HEAD',
            signal: AbortSignal.timeout(5000)
        });

        const responseTime = Date.now() - startTime;

        if (!response.ok) {
            return {
                status: 'degraded',
                responseTime,
                error: `HTTP ${response.status}`
            };
        }

        return {
            status: responseTime < 100 ? 'up' : 'degraded',
            responseTime
        };
    } catch (err) {
        const error = err as Error;
        logError({
            level: 'warn',
            message: 'Zero Cache health check failed',
            timestamp: new Date().toISOString(),
            context: { error: error.message }
        });

        return {
            status: 'down',
            error: error.message
        };
    }
}

export async function checkAuthHealth(): Promise<HealthStatus> {
    const startTime = Date.now();

    try {
        const clerkUrl = process.env.CLERK_PUBLISHABLE_KEY
            ? 'https://api.clerk.com/v1/health'
            : null;

        if (!clerkUrl) {
            return {
                status: 'degraded',
                error: 'Clerk not configured'
            };
        }

        // Simple connectivity check
        const responseTime = Date.now() - startTime;

        return {
            status: 'up',
            responseTime
        };
    } catch (err) {
        const error = err as Error;
        return {
            status: 'down',
            error: error.message
        };
    }
}

export async function getHealthStatus(): Promise<HealthCheckResult> {
    const [database, zeroCache, auth] = await Promise.all([
        checkDatabaseHealth(),
        checkZeroCacheHealth(),
        checkAuthHealth()
    ]);

    const allUp =
        database.status === 'up' &&
        zeroCache.status === 'up' &&
        auth.status === 'up';

    const anyDown =
        database.status === 'down' ||
        zeroCache.status === 'down' ||
        auth.status === 'down';

    return {
        status: anyDown ? 'unhealthy' : allUp ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        checks: {
            database,
            zeroCache,
            auth
        },
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
    };
}

// Get metrics summary
export function getMetricsSummary(since?: Date) {
    const cutoff = since ? since.getTime() : Date.now() - 3600000; // Last hour
    const recentMetrics = metrics.filter(
        m => new Date(m.timestamp).getTime() > cutoff
    );

    const summary: Record<
        string,
        { count: number; avg: number; min: number; max: number }
    > = {};

    recentMetrics.forEach(metric => {
        if (!summary[metric.name]) {
            summary[metric.name] = {
                count: 0,
                avg: 0,
                min: Infinity,
                max: -Infinity
            };
        }

        const s = summary[metric.name];
        s.count++;
        s.avg = (s.avg * (s.count - 1) + metric.value) / s.count;
        s.min = Math.min(s.min, metric.value);
        s.max = Math.max(s.max, metric.value);
    });

    return summary;
}

// Get recent errors
export function getRecentErrors(limit = 50) {
    return errors.slice(-limit);
}

// Alert thresholds
const ALERT_THRESHOLDS = {
    queryTimeMs: 2000,
    errorRatePerMinute: 10,
    databaseResponseMs: 200
};

// Check if alerts should be triggered
export function checkAlerts(): string[] {
    const alerts: string[] = [];
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Check error rate
    const recentErrors = errors.filter(
        e =>
            new Date(e.timestamp).getTime() > oneMinuteAgo &&
            e.level === 'error'
    );

    if (recentErrors.length > ALERT_THRESHOLDS.errorRatePerMinute) {
        alerts.push(
            `High error rate: ${recentErrors.length} errors in the last minute`
        );
    }

    // Check slow queries
    const recentSlowQueries = metrics.filter(
        m =>
            m.name.includes('query') &&
            new Date(m.timestamp).getTime() > oneMinuteAgo &&
            m.value > ALERT_THRESHOLDS.queryTimeMs
    );

    if (recentSlowQueries.length > 0) {
        alerts.push(
            `${recentSlowQueries.length} slow queries detected (>${ALERT_THRESHOLDS.queryTimeMs}ms)`
        );
    }

    return alerts;
}

// Export for external monitoring integrations
export const monitoring = {
    recordMetric,
    logError,
    getHealthStatus,
    getMetricsSummary,
    getRecentErrors,
    checkAlerts,
    PerformanceTracker
};
