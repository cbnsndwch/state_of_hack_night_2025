/**
 * Health Check API Endpoint
 * Returns the health status of all critical systems
 */

import { data, type LoaderFunctionArgs } from 'react-router';
import { getHealthStatus } from '@/utils/monitoring.server';

export async function loader(_args: LoaderFunctionArgs) {
    const health = await getHealthStatus();

    // Return appropriate HTTP status based on health
    const statusCode =
        health.status === 'healthy'
            ? 200
            : health.status === 'degraded'
              ? 200 // Still return 200 for degraded
              : 503; // Service Unavailable for unhealthy

    return data(health, { status: statusCode });
}
