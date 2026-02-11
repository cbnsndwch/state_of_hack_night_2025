# Monitoring and Alerting

This document describes the monitoring and alerting infrastructure for Hello Miami.

## Overview

The monitoring system tracks the health and performance of critical systems:

- **PostgreSQL Database**: Connection health and query performance
- **Zero Cache**: Realtime sync service availability
- **Clerk Authentication**: Auth service availability
- **Application Performance**: Query times, error rates, and other metrics

## Components

### 1. Monitoring Utilities (`app/utils/monitoring.server.ts`)

Server-side utilities for health checks, metrics tracking, and error logging.

**Key Functions:**

- `getHealthStatus()`: Returns overall system health
- `recordMetric(metric)`: Records performance metrics
- `logError(error)`: Logs errors with context
- `checkAlerts()`: Checks if alert thresholds are exceeded
- `PerformanceTracker`: Class for timing operations

**Example Usage:**

```typescript
import {
    PerformanceTracker,
    recordMetric,
    logError
} from '@/utils/monitoring.server';

// Track query performance
const tracker = new PerformanceTracker('database.query.profiles');
const result = await db.select().from(profiles);
tracker.end({ table: 'profiles' });

// Record custom metrics
recordMetric({
    name: 'api.requests',
    value: 1,
    timestamp: new Date().toISOString(),
    tags: { endpoint: '/api/profile', method: 'GET' }
});

// Log errors
logError({
    level: 'error',
    message: 'Failed to update profile',
    timestamp: new Date().toISOString(),
    context: { userId: 'user_123', error: err.message },
    stack: err.stack
});
```

### 2. Health Check Endpoint (`/api/health`)

Public endpoint that returns system health status.

**Response Example:**

```json
{
    "status": "healthy",
    "timestamp": "2026-02-11T12:00:00.000Z",
    "checks": {
        "database": {
            "status": "up",
            "responseTime": 45
        },
        "zeroCache": {
            "status": "up",
            "responseTime": 23
        },
        "auth": {
            "status": "up",
            "responseTime": 12
        }
    },
    "uptime": 3600,
    "version": "1.0.0"
}
```

**HTTP Status Codes:**

- `200`: Healthy or degraded
- `503`: Unhealthy (one or more critical systems down)

### 3. Metrics Endpoint (`/api/metrics`)

Protected endpoint (admin only) that returns performance metrics and errors.

**Query Parameters:**

- `hours`: Number of hours of data to return (default: 1)

**Response Example:**

```json
{
    "metrics": {
        "database.query.profiles": {
            "count": 150,
            "avg": 45.5,
            "min": 12,
            "max": 320
        }
    },
    "errors": [
        {
            "level": "error",
            "message": "Database connection failed",
            "timestamp": "2026-02-11T12:00:00.000Z",
            "context": { "error": "Connection timeout" }
        }
    ],
    "alerts": ["High error rate: 15 errors in the last minute"],
    "period": "Last 1 hour(s)",
    "timestamp": "2026-02-11T12:00:00.000Z"
}
```

### 4. Monitoring Dashboard Component

React component for visualizing monitoring data.

**Usage:**

```tsx
import { MonitoringDashboard } from '@/components/monitoring-dashboard';

export default function MonitoringPage() {
    return <MonitoringDashboard />;
}
```

## Alert Thresholds

The system monitors these thresholds and triggers alerts:

| Metric            | Threshold         | Action          |
| ----------------- | ----------------- | --------------- |
| Error Rate        | >10 errors/minute | Alert logged    |
| Query Time        | >2000ms           | Warning logged  |
| Database Response | >200ms            | Degraded status |

## Integration with External Services

### Production Monitoring

For production deployments, integrate with external monitoring services:

#### Sentry (Error Tracking)

1. Install Sentry:

```bash
pnpm add @sentry/react @sentry/node
```

2. Update `app/utils/monitoring.server.ts`:

```typescript
import * as Sentry from '@sentry/node';

// In logError function
if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(new Error(error.message), {
        level: error.level,
        extra: error.context
    });
}
```

3. Initialize Sentry in `app/entry.server.tsx`:

```typescript
Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1
});
```

#### DataDog (Metrics & APM)

1. Install DataDog client:

```bash
pnpm add dd-trace
```

2. Initialize in `app/entry.server.tsx`:

```typescript
import tracer from 'dd-trace';

tracer.init({
    service: 'hello-miami',
    env: process.env.NODE_ENV
});
```

3. Send custom metrics:

```typescript
import { StatsD } from 'node-dogstatsd';

const statsd = new StatsD();
statsd.increment('api.requests', 1, ['endpoint:/api/profile']);
```

#### Uptime Monitoring

Use external services to monitor `/api/health`:

- **UptimeRobot**: Free tier available
- **Pingdom**: Advanced monitoring
- **Better Uptime**: Modern alternative

Set up alerts for:

- HTTP status != 200
- Response time > 5 seconds
- Response contains `"status": "unhealthy"`

## Best Practices

### 1. Wrap Critical Operations

Always wrap critical operations with performance tracking:

```typescript
const tracker = new PerformanceTracker('operation.name');
try {
    await criticalOperation();
} catch (err) {
    logError({
        level: 'error',
        message: 'Critical operation failed',
        timestamp: new Date().toISOString(),
        context: { error: err.message },
        stack: err.stack
    });
    throw err;
} finally {
    tracker.end();
}
```

### 2. Add Context to Errors

Always include relevant context when logging errors:

```typescript
logError({
    level: 'error',
    message: 'Failed to process checkout',
    timestamp: new Date().toISOString(),
    context: {
        userId: user.id,
        orderId: order.id,
        amount: order.total,
        error: err.message
    },
    stack: err.stack,
    userId: user.id // For user-specific error tracking
});
```

### 3. Monitor Key User Flows

Track performance of critical user flows:

```typescript
// Check-in flow
recordMetric({
    name: 'user_flow.check_in.duration',
    value: checkInDuration,
    timestamp: new Date().toISOString(),
    tags: { eventId: event.id, success: 'true' }
});

// Profile update flow
recordMetric({
    name: 'user_flow.profile_update.duration',
    value: updateDuration,
    timestamp: new Date().toISOString(),
    tags: { userId: user.id, fields: 'bio,links' }
});
```

### 4. Set Up Automated Health Checks

Configure a cron job or service to regularly check health:

```bash
# Check health every minute
* * * * * curl -f https://hellomiami.io/api/health || echo "Health check failed"
```

## Troubleshooting

### High Database Response Times

1. Check PostgreSQL logs for slow queries
2. Review query performance with metrics endpoint
3. Add indexes for frequently queried fields
4. Consider connection pool size adjustment

### Zero Cache Connection Issues

1. Verify zero-cache container is running:
    ```bash
    docker ps | grep zero-cache
    ```
2. Check zero-cache logs:
    ```bash
    docker logs zero-cache-dev
    ```
3. Verify environment variables:
    - `ZERO_QUERY_URL`
    - `ZERO_MUTATE_URL`
    - `ZERO_UPSTREAM_DB`

### High Error Rates

1. Check `/api/metrics` for recent errors
2. Review error context and stack traces
3. Check external service status (Clerk, Luma)
4. Verify database connection pool hasn't been exhausted

## Development vs Production

### Development

- Metrics stored in-memory (resets on restart)
- Errors logged to console
- Health checks run every 30 seconds in dashboard

### Production

- Integrate with external monitoring (Sentry, DataDog)
- Set up automated alerts
- Configure log aggregation (CloudWatch, Papertrail)
- Monitor from external services (UptimeRobot)

## Zero Inspector Integration

### Query Performance Monitoring

Zero includes a powerful browser-based inspector for monitoring query performance. See [ZERO_INSPECTOR.md](./ZERO_INSPECTOR.md) for detailed usage guide.

**Quick Start:**

Open browser console and run:

```javascript
// View active queries
let queries = await __zero.inspector.client.queries();
console.table(queries);

// Analyze query performance
let analysis = await queries[0].analyze();
console.log(analysis);

// Check server version
console.log(await __zero.inspector.serverVersion());
```

**Key Metrics to Monitor:**

- `hydrateTotal`: Total time to load query (should be < 1000ms)
- `readRowCount / syncedRowCount`: Query efficiency ratio (should be < 10)
- Query plans: Look for "TEMP B-TREE" warnings (indicates missing indexes)

**Environment Configuration:**

The inspector is already configured via `.env`:

```bash
ZERO_ADMIN_PASSWORD='dev-password'  # Protects production access
VITE_ZERO_CACHE_URL='http://localhost:4848'  # Zero cache server
```

**Access:**

- **Development**: Open console, use `__zero.inspector`
- **Production**: Same, but requires `ZERO_ADMIN_PASSWORD` authentication

For comprehensive guide, see [docs/ZERO_INSPECTOR.md](./ZERO_INSPECTOR.md).

## Future Enhancements

- [x] Zero Inspector integration for query analysis ✅
- [ ] Custom dashboard with real-time charts
- [ ] Slack/Discord webhook notifications for alerts
- [ ] Performance budget tracking
- [ ] Automated incident response playbooks
- [ ] User-facing status page
