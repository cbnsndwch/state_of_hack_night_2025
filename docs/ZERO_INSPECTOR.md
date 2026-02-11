# Zero Inspector Guide

This guide explains how to use the Zero Inspector for monitoring and debugging query performance in the hello_miami application.

## Overview

The Zero Inspector is a powerful browser-based debugging tool that provides detailed insights into:

- Active queries and their performance
- Query hydration times (client and server)
- Row counts and data flow
- Query execution plans
- Client-side database contents

## Accessing the Inspector

### 1. Browser Console Access

Zero automatically injects itself as `__zero` on the global scope. Open the browser console (F12 or Cmd+Option+I on Mac) and type:

```javascript
__zero.inspector;
```

This returns the inspector instance with methods for monitoring queries and performance.

### 2. Environment Setup

The inspector is available in both development and production environments. In production, access is protected by the `ZERO_ADMIN_PASSWORD` environment variable.

**Environment Variables** (already configured in `.env`):

```bash
ZERO_ADMIN_PASSWORD='dev-password'  # Required for production access
VITE_ZERO_CACHE_URL='http://localhost:4848'  # Zero cache server URL
```

## Common Inspection Tasks

### View Active Queries

To see all queries currently active for the current client:

```javascript
// Get all queries for current client
let queries = await __zero.inspector.client.queries();
console.table(queries);

// Get all queries for the entire client group (recommended for performance debugging)
let groupQueries = await __zero.inspector.group.queries();
console.table(groupQueries);
```

**Output includes:**

| Field             | Description                                   |
| ----------------- | --------------------------------------------- |
| `name`, `args`    | Query name and arguments                      |
| `clientZQL`       | Client-side ZQL (optimistic)                  |
| `serverZQL`       | Server-side ZQL (authoritative)               |
| `got`             | Whether first result received                 |
| `hydrateClient`   | Client hydration time (ms)                    |
| `hydrateServer`   | Server hydration time (ms)                    |
| `hydrateTotal`    | Total hydration time including network (ms)   |
| `rowCount`        | Number of rows returned                       |
| `updateClientP50` | Median client update time after mutation (ms) |
| `updateClientP95` | 95th percentile client update time (ms)       |
| `updateServerP50` | Median server update time after mutation (ms) |
| `updateServerP95` | 95th percentile server update time (ms)       |

### Analyze Query Performance

To analyze a specific query's execution:

```javascript
// Get queries
let queries = await __zero.inspector.client.queries();

// Analyze the first query
let analysis = await queries[0].analyze();
console.log(analysis);
```

**Key Performance Metrics:**

| Field                  | Description                      | Good Target            |
| ---------------------- | -------------------------------- | ---------------------- |
| `elapsed`              | Total analysis time (ms)         | < 100ms                |
| `readRowCount`         | Total rows read from replica     | < 10x `syncedRowCount` |
| `syncedRowCount`       | Rows actually synced to client   | Varies by query        |
| `readRowCountsByQuery` | Breakdown by SQLite query        | Lower is better        |
| `plans`                | SQLite EXPLAIN QUERY PLAN output | No TEMP B-TREE         |

**Example Output:**

```javascript
{
  elapsed: 45.2,
  readRowCount: 150,
  syncedRowCount: 25,
  readRowCountsByQuery: {
    "SELECT * FROM profiles WHERE...": 100,
    "SELECT * FROM projects WHERE...": 50
  },
  syncedRows: [...],
  plans: [...]
}
```

### Analyze Arbitrary ZQL

You can analyze ZQL queries without them being active. First, expose the Zero query builder globally:

```typescript
// In app/zero/schema.ts
const g = globalThis as any;
g.__builder = builder;
```

Then in the console:

```javascript
// Analyze a custom query
await __zero.inspector.analyzeQuery(
    __builder.profiles
        .where('verification_status', 'verified')
        .related('projects', q => q.limit(5))
);
```

### View Query Plans

To see how SQLite and Zero plan query execution:

```javascript
let queries = await __zero.inspector.client.queries();

// View SQLite query plans
let analysis = await queries[0].analyze();
console.log('SQLite Plans:', analysis.plans);

// View Zero join plans
let analysisWithJoins = await queries[0].analyze({ joinPlans: true });
console.log('Join Plans:', analysisWithJoins.joinPlans);
```

### Inspect Client-Side Data

View the raw data synced to the client:

```javascript
const client = __zero.inspector.client;

// View all key-value data synced to client
console.log('Client map:', await client.map());

// View specific table data
console.log('Profiles:', await client.rows('profiles'));
console.table(await client.rows('projects'));
console.table(await client.rows('attendance'));
```

### Check Server Version

Verify the Zero cache server version:

```javascript
const version = await __zero.inspector.serverVersion();
console.log('Server version:', version);
```

## Performance Optimization Workflow

### 1. Identify Slow Queries

```javascript
// Get all queries sorted by hydration time
let queries = await __zero.inspector.group.queries();
let slowQueries = queries
    .filter(q => q.hydrateTotal > 1000) // Over 1 second
    .sort((a, b) => b.hydrateTotal - a.hydrateTotal);

console.table(slowQueries);
```

### 2. Analyze Query Efficiency

```javascript
// Analyze a slow query
let analysis = await slowQueries[0].analyze();

// Check if we're reading too many rows
const efficiency = analysis.syncedRowCount / analysis.readRowCount;
console.log('Query efficiency:', efficiency); // Should be > 0.1 (10%)

// Check for missing indexes (look for TEMP B-TREE in plans)
console.log('Query plans:', analysis.plans);
```

### 3. Optimize with npx analyze-query

For detailed optimization recommendations:

```bash
# Run in terminal
npx analyze-query <query-name>
```

### 4. Monitor After Changes

After optimizing, verify improvements:

```javascript
// Clear and re-run query
let queries = await __zero.inspector.client.queries();
let optimized = queries.find(q => q.name === 'your-query-name');

await optimized.analyze(); // Should show improved metrics
```

## Common Performance Issues

### Issue: High `readRowCount` vs `syncedRowCount`

**Symptoms:**

- `readRowCount` is 10x+ higher than `syncedRowCount`
- Query takes a long time to hydrate

**Solution:**

- Add indexes to PostgreSQL for frequently filtered columns
- Use more selective WHERE clauses
- Consider query restructuring

### Issue: TEMP B-TREE in Query Plans

**Symptoms:**

- Query plans show "USING TEMP B-TREE"
- Slow query execution

**Solution:**

- Add composite indexes for multi-column filters
- Run `npx analyze-query` for specific recommendations

### Issue: Slow Network Hydration

**Symptoms:**

- Large gap between `hydrateServer` and `hydrateTotal`

**Solution:**

- Reduce data transfer size with selective fields
- Implement pagination for large result sets
- Check network latency between app and zero-cache

## Integration with Monitoring Dashboard

To integrate inspector data into the monitoring dashboard, add a component:

```typescript
// app/components/zero-inspector-panel.tsx
import { useEffect, useState } from 'react';

export function ZeroInspectorPanel() {
  const [queries, setQueries] = useState([]);

  useEffect(() => {
    const fetchQueries = async () => {
      if (typeof window !== 'undefined' && (window as any).__zero) {
        const inspector = (window as any).__zero.inspector;
        const qs = await inspector.client.queries();
        setQueries(qs);
      }
    };

    fetchQueries();
    const interval = setInterval(fetchQueries, 5000); // Update every 5s

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Active Zero Queries</h2>
      <table className="w-full">
        <thead>
          <tr>
            <th>Query Name</th>
            <th>Rows</th>
            <th>Client Hydration</th>
            <th>Server Hydration</th>
            <th>Total Time</th>
          </tr>
        </thead>
        <tbody>
          {queries.map((q, i) => (
            <tr key={i}>
              <td>{q.name}</td>
              <td>{q.rowCount}</td>
              <td>{q.hydrateClient?.toFixed(1)}ms</td>
              <td>{q.hydrateServer?.toFixed(1)}ms</td>
              <td>{q.hydrateTotal?.toFixed(1)}ms</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## Best Practices

### 1. Regular Performance Audits

Schedule weekly query performance reviews:

```javascript
// Weekly audit script
async function auditPerformance() {
    const queries = await __zero.inspector.group.queries();

    const report = {
        totalQueries: queries.length,
        slowQueries: queries.filter(q => q.hydrateTotal > 1000).length,
        avgHydrationTime:
            queries.reduce((sum, q) => sum + (q.hydrateTotal || 0), 0) /
            queries.length,
        inefficientQueries: []
    };

    for (const q of queries) {
        const analysis = await q.analyze();
        const efficiency = analysis.syncedRowCount / analysis.readRowCount;

        if (efficiency < 0.1) {
            report.inefficientQueries.push({
                name: q.name,
                efficiency,
                readRows: analysis.readRowCount,
                syncedRows: analysis.syncedRowCount
            });
        }
    }

    console.log('Performance Audit Report:', report);
    return report;
}

// Run the audit
await auditPerformance();
```

### 2. Document Query Patterns

Keep track of common query patterns and their performance:

```typescript
// Create a query performance baseline
const queryBaselines = {
    'profiles.current': { hydrateTotal: 50, rowCount: 1 },
    'projects.featured': { hydrateTotal: 150, rowCount: 10 },
    'events.upcoming': { hydrateTotal: 100, rowCount: 5 }
};

// Compare against baseline
async function checkAgainstBaseline(queryName: string) {
    const queries = await __zero.inspector.client.queries();
    const query = queries.find(q => q.name === queryName);
    const baseline = queryBaselines[queryName];

    if (query && baseline) {
        const timeRatio = query.hydrateTotal / baseline.hydrateTotal;
        if (timeRatio > 1.5) {
            console.warn(
                `Query ${queryName} is ${timeRatio}x slower than baseline`
            );
        }
    }
}
```

### 3. Monitor in Production

For production environments, export inspector data to monitoring services:

```typescript
// Export metrics to DataDog/Sentry
async function exportZeroMetrics() {
    if (typeof window === 'undefined') return;

    const inspector = (window as any).__zero?.inspector;
    if (!inspector) return;

    const queries = await inspector.client.queries();

    queries.forEach(q => {
        // Send to your monitoring service
        if (q.hydrateTotal > 1000) {
            // Log slow query
            console.warn('Slow Zero query detected:', {
                name: q.name,
                duration: q.hydrateTotal,
                rowCount: q.rowCount
            });
        }
    });
}
```

## Troubleshooting

### Inspector Not Available

If `__zero.inspector` is undefined:

1. Check that ZeroProvider is properly initialized
2. Verify `VITE_ZERO_CACHE_URL` environment variable is set
3. Ensure zero-cache service is running (`docker ps | grep zero`)
4. Check browser console for Zero initialization errors

### Query Analysis Fails

If `analyze()` throws an error:

1. Verify the query is still active (not removed from client)
2. Check zero-cache logs for errors: `docker logs hello_miami_zero_cache`
3. Ensure PostgreSQL is accessible from zero-cache

### Missing Data in Inspector

If queries show but have no performance data:

1. Wait for queries to complete first hydration
2. Check that queries have actually been executed
3. Verify network connection to zero-cache

## Additional Resources

- [Zero Inspector Docs](https://zero.rocicorp.dev/docs/debug/inspector)
- [Slow Query Debugging](https://zero.rocicorp.dev/docs/debug/slow-queries)
- [Query Optimization Guide](https://zero.rocicorp.dev/docs/debug/query-asts)
- [Zero Discord Community](https://discord.rocicorp.dev)

## Next Steps

After setting up the Inspector:

1. ✅ Browser-based monitoring via `__zero.inspector`
2. ⏭️ [Configure PostgreSQL Query Monitoring](./MONITORING.md#postgresql-monitoring)
3. ⏭️ [Set up Production Alerting](./MONITORING.md#production-monitoring)
4. ⏭️ [Optimize Database Indexes](./DATABASE.md#indexes)
