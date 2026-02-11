# PostgreSQL Monitoring Guide

This guide covers the comprehensive PostgreSQL monitoring system integrated into Hello Miami.

## Overview

The PostgreSQL monitoring system provides real-time insights into database performance, including:

- **Connection Pool Statistics** - Monitor connection usage and pool utilization
- **Slow Query Detection** - Identify and analyze queries with high execution time
- **Active Query Tracking** - See what's currently running on the database
- **Table Statistics** - Monitor table sizes, row counts, and vacuum/analyze status
- **Index Usage** - Detect unused or inefficient indexes
- **Cache Hit Ratio** - Measure how effectively PostgreSQL is using memory
- **Transaction Rate** - Track database throughput

## Setup

### 1. Enable Query Statistics Extension

PostgreSQL's `pg_stat_statements` extension must be enabled to track query statistics:

```bash
# Run the setup script
pnpm tsx scripts/setup-postgres-monitoring.ts
```

This script will:

- Enable the `pg_stat_statements` extension
- Verify monitoring is working
- Display initial performance metrics
- Check for any performance alerts

### 2. Docker Configuration (if using Docker)

The `pg_stat_statements` extension requires the `shared_preload_libraries` setting in PostgreSQL. This is already configured in `docker-compose.yml`, but if you're running PostgreSQL separately, add this to your `postgresql.conf`:

```conf
shared_preload_libraries = 'pg_stat_statements'
pg_stat_statements.track = all
```

Then restart PostgreSQL.

### 3. Access the Monitoring Dashboard

Once setup is complete, access the monitoring dashboard at:

```
http://localhost:5173/admin/monitoring
```

**Note**: Only users with `role: 'admin'` in their profile can access this page.

## Monitoring Dashboard

### System Health Tab

Displays overall system health including:

- Database connectivity
- Zero Cache status
- Authentication service status
- Recent errors and alerts
- Performance metrics

### PostgreSQL Stats Tab

Comprehensive PostgreSQL-specific metrics:

#### Key Metrics Cards

- **Cache Hit Ratio** - Should be > 95% for optimal performance
    - Below 95% indicates insufficient memory or inefficient queries
- **Transaction Rate** - Transactions per second (commits + rollbacks)
    - Helps identify peak load periods
- **Active Connections** - Current connections vs. max pool size
    - High utilization (>80%) may require pool size increase
- **Total Connections** - Overall connection count

#### Connection Pool Statistics

Monitor your connection pool health:

- Total, active, and idle connections
- Maximum connections configured
- Pool utilization percentage

**Alerts**: Triggered when utilization exceeds 80%

#### Slow Queries

Lists queries with mean execution time > 100ms:

- Query text (truncated)
- Number of calls
- Mean, max, and total execution time
- Rows returned

**Alerts**: Triggered when queries exceed 1000ms mean time

#### Active Queries

Real-time view of currently executing queries:

- Process ID (PID)
- Username and database
- Query duration
- State (active, idle, etc.)
- Wait events (if blocked)

**Alerts**: Triggered when queries run for > 5 minutes

#### Table Statistics

Per-table metrics:

- Row count
- Table size (data only)
- Index size
- Total size (table + indexes)
- Last vacuum timestamp
- Last analyze timestamp

Use this to:

- Identify large tables that may need partitioning
- Track growth over time
- Ensure vacuum/analyze are running regularly

#### Index Usage Statistics

Per-index metrics:

- Index size
- Number of scans (how often the index is used)
- Tuples read vs. returned
- Efficiency percentage

**Alerts**: Triggered for indexes with 0 scans (unused indexes)

## API Endpoints

### GET /api/postgres-stats

Returns comprehensive PostgreSQL performance metrics.

**Authentication**: Admin only

**Response**:

```json
{
  "success": true,
  "report": {
    "timestamp": "2026-02-11T10:30:00.000Z",
    "connections": {
      "totalConnections": 12,
      "activeConnections": 3,
      "idleConnections": 9,
      "maxConnections": 200,
      "utilizationPercent": 6.0
    },
    "slowQueries": [...],
    "activeQueries": [...],
    "tableStats": [...],
    "indexStats": [...],
    "cacheHitRatio": 98.5,
    "transactionRate": 45.2
  },
  "alerts": [
    "Low cache hit ratio: 92.3% (should be > 95%)"
  ]
}
```

## Programmatic Usage

You can use the monitoring utilities in your server-side code:

```typescript
import { postgresMonitoring } from '@/utils/postgres-monitoring.server';

// Get connection statistics
const connStats = await postgresMonitoring.getConnectionStats();

// Get slow queries (>100ms mean time, limit 10)
const slowQueries = await postgresMonitoring.getSlowQueries(10, 100);

// Get active queries
const activeQueries = await postgresMonitoring.getActiveQueries();

// Get table statistics
const tableStats = await postgresMonitoring.getTableStats();

// Get index usage
const indexStats = await postgresMonitoring.getIndexStats();

// Get cache hit ratio
const cacheRatio = await postgresMonitoring.getCacheHitRatio();

// Get transaction rate
const txRate = await postgresMonitoring.getTransactionRate();

// Get full performance report
const report = await postgresMonitoring.getPerformanceReport();

// Check for alerts
const alerts = postgresMonitoring.checkPostgresAlerts(report);
```

## Performance Optimization

### Slow Query Optimization

When you identify slow queries:

1. **Analyze the query plan**:

    ```sql
    EXPLAIN ANALYZE <your query>;
    ```

2. **Check for missing indexes**:
    - Look at the query plan for Sequential Scans on large tables
    - Add indexes on frequently queried columns

3. **Review table statistics**:
    - Run ANALYZE on tables if statistics are stale
    - Consider increasing `default_statistics_target` for better planning

### Cache Hit Ratio Improvement

If cache hit ratio is < 95%:

1. **Increase PostgreSQL memory**:

    ```conf
    shared_buffers = 256MB      # Increase based on available RAM
    effective_cache_size = 1GB  # Set to ~50-75% of total RAM
    ```

2. **Review query patterns**:
    - Reduce full table scans
    - Use appropriate indexes
    - Consider materialized views for complex aggregations

### Index Management

#### Remove Unused Indexes

Unused indexes (0 scans) waste disk space and slow down writes:

```sql
-- Drop unused index (be careful!)
DROP INDEX index_name;
```

**Warning**: Always verify an index is truly unused before dropping it. Check monitoring over several days/weeks.

#### Create Missing Indexes

For commonly filtered columns:

```sql
-- Single column index
CREATE INDEX idx_profiles_email ON profiles(email);

-- Multi-column index (order matters!)
CREATE INDEX idx_projects_featured_created ON projects(featured, created_at DESC);

-- Partial index (for specific conditions)
CREATE INDEX idx_events_upcoming ON events(start_date)
WHERE start_date > CURRENT_DATE;
```

### Connection Pool Tuning

If connection utilization is consistently high (>80%):

1. **Increase pool size** in `app/lib/db/provider.server.ts`:

    ```typescript
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 30, // Increase from 20
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000
    });
    ```

2. **Use connection pooling in production**:
    - Consider PgBouncer for transaction pooling
    - Configure `pool_mode = transaction` for better utilization

## Alert Thresholds

The monitoring system triggers alerts for:

| Metric                 | Threshold   | Action                                             |
| ---------------------- | ----------- | -------------------------------------------------- |
| Cache Hit Ratio        | < 95%       | Increase shared_buffers or optimize queries        |
| Connection Utilization | > 80%       | Increase pool size or investigate connection leaks |
| Query Mean Time        | > 1000ms    | Optimize query or add indexes                      |
| Active Query Duration  | > 5 minutes | Investigate long-running queries                   |
| Unused Indexes         | 0 scans     | Consider removing unused indexes                   |

## Monitoring Best Practices

1. **Regular Review**: Check monitoring dashboard daily
2. **Trend Analysis**: Track metrics over time to identify patterns
3. **Proactive Optimization**: Address slow queries before they become critical
4. **Index Maintenance**: Review index usage weekly, remove unused indexes quarterly
5. **Vacuum/Analyze**: Ensure autovacuum is running; manual VACUUM ANALYZE for large batch operations
6. **Connection Management**: Monitor for connection leaks; ensure proper cleanup

## Troubleshooting

### Extension Not Available

**Error**: `pg_stat_statements extension not available`

**Solution**:

1. Ensure the extension library is installed:

    ```bash
    # On Ubuntu/Debian
    sudo apt-get install postgresql-contrib
    ```

2. Add to `postgresql.conf`:

    ```conf
    shared_preload_libraries = 'pg_stat_statements'
    ```

3. Restart PostgreSQL and re-run setup:
    ```bash
    pnpm tsx scripts/setup-postgres-monitoring.ts
    ```

### Permission Denied

**Error**: `permission denied to create extension "pg_stat_statements"`

**Solution**:
Grant SUPERUSER privileges (development only):

```sql
ALTER USER your_username WITH SUPERUSER;
```

For production, the database administrator should enable the extension.

### High Memory Usage

If PostgreSQL is consuming too much memory:

1. Review `shared_buffers` setting (typically 25% of RAM)
2. Check for memory leaks in application code
3. Review connection pool size
4. Monitor for runaway queries

### Slow Dashboard Load

If the monitoring dashboard is slow:

1. The dashboard refreshes every 30 seconds automatically
2. Table/index statistics can be slow on very large databases
3. Consider caching results or reducing refresh frequency
4. Run ANALYZE on system tables periodically

## Production Considerations

### Security

- Monitoring endpoints are admin-only by default
- Do NOT expose monitoring APIs publicly
- Consider VPN or IP whitelist for monitoring access
- Rotate admin passwords regularly

### Performance Impact

- `pg_stat_statements` has minimal overhead (<1%)
- Dashboard queries are optimized for quick execution
- Consider reducing monitoring frequency in very high-traffic scenarios

### Scaling

For multi-instance deployments:

- Each application server should have its own connection pool
- Monitor connection usage across all instances
- Consider read replicas for reporting queries
- Use PgBouncer for connection pooling at scale

## Additional Resources

- [PostgreSQL Statistics Collector](https://www.postgresql.org/docs/current/monitoring-stats.html)
- [pg_stat_statements Documentation](https://www.postgresql.org/docs/current/pgstatstatements.html)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Drizzle ORM Docs](https://orm.drizzle.team/)

## Support

For issues or questions:

- Check the troubleshooting section above
- Review PostgreSQL logs: `docker-compose logs postgres`
- Open an issue on GitHub
- Contact the development team
