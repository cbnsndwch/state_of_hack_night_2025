/**
 * Health Check Endpoint
 *
 * Provides a simple health check for monitoring and load balancers.
 * Returns HTTP 200 with "OK" status if the application is running.
 */

import { data } from 'react-router';

export async function loader() {
    // Basic health check - application is running
    // Can be extended to check:
    // - Database connectivity
    // - Zero cache connectivity
    // - External service availability

    return data(
        {
            status: 'OK',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development'
        },
        {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate',
                'Content-Type': 'application/json'
            }
        }
    );
}

// Simple text response for basic health checks
export function Component() {
    return null;
}
