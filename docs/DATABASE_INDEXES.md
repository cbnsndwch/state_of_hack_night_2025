# Database Indexes Documentation

This document explains the database indexes implemented for optimal query performance in the Hello Miami platform.

## Index Sources (Reconciled)

Indexes are defined in two places:

- Base indexes and unique constraints are defined in [drizzle/schema.ts](drizzle/schema.ts).
- Performance indexes are added by migration in [drizzle/migrations/0001_add_performance_indexes.sql](drizzle/migrations/0001_add_performance_indexes.sql).

## Index Categories

### 1. Text Search Indexes (Case-Insensitive)

These indexes support ILIKE queries for search functionality:

- **`profiles_luma_email_lower_idx`** - Search profiles by email
    - Query: `profileQueries.search()`
    - Pattern: `WHERE LOWER(luma_email) LIKE '%query%'`

- **`profiles_github_username_lower_idx`** - Search profiles by GitHub username
    - Query: `profileQueries.search()`
    - Pattern: `WHERE LOWER(github_username) LIKE '%query%'`

- **`projects_title_lower_idx`** - Search projects by title
    - Query: `projectQueries.search()`
    - Pattern: `WHERE LOWER(title) LIKE '%query%'`

### 2. JSONB Indexes (GIN)

These indexes enable efficient filtering of array elements in JSONB columns:

- **`projects_tags_gin_idx`** - Filter projects by tech stack tags
    - Usage: Find projects using specific technologies
    - Operator: `@>` (containment)

- **`profiles_skills_gin_idx`** - Filter members by skills
    - Usage: Find members with specific skills
    - Operator: `@>` (containment)

### 3. Composite Indexes

These indexes optimize queries with multiple filter conditions:

- **`attendance_status_checked_in_at_idx`** (status, checked_in_at DESC)
    - Usage: Recent check-ins with specific status
    - Query: Dashboard recent activity

- **`demo_slots_event_status_idx`** (event_id, status)
    - Usage: Find pending demos for an event
    - Query: `demoSlotQueries.pendingByEventId()`

- **`survey_responses_survey_complete_idx`** (survey_id, is_complete)
    - Usage: Find incomplete responses for a survey
    - Query: Survey completion analytics

- **`events_canceled_start_idx`** (is_canceled, start_at ASC)
    - Usage: Filter active events ordered by time
    - Query: `eventQueries.upcoming()`

### 4. Timestamp Indexes

These indexes optimize time-based queries and sorting:

- **`events_end_at_idx`** - Filter and sort by event end time
- **`attendance_checked_in_at_idx`** - Sort attendance by check-in time
- **`projects_updated_at_idx`** - Find recently updated projects
- **`profiles_updated_at_idx`** - Find recently active members

### 5. Partial Indexes

These indexes only include rows matching specific conditions, reducing index size:

- **`pending_users_unapproved_idx`**
    - Condition: `WHERE approved_at IS NULL`
    - Usage: List users awaiting approval
    - Benefit: Smaller index size (only unapproved users)

- **`surveys_active_created_idx`**
    - Condition: `WHERE is_active = true`
    - Usage: List active surveys
    - Benefit: Faster queries for active surveys

- **`events_upcoming_idx`**
    - Condition: `WHERE is_canceled = false`
    - Usage: List upcoming non-canceled events
    - Benefit: Optimizes most common event query

- **`demo_slots_pending_idx`**
    - Condition: `WHERE status = 'pending'`
    - Usage: Organizer dashboard for pending demos
    - Benefit: Fast access to pending demo slots

- **`profiles_is_app_admin_idx`**
    - Condition: `WHERE is_app_admin = true`
    - Usage: List admin users
    - Benefit: Very small index (few admins)

### 6. Statistics and Audit Indexes

These indexes support analytics and debugging:

- **`profiles_verification_status_idx`** - Count users by verification status
- **`luma_webhooks_type_received_idx`** - Debug webhooks by type and time

## Index Monitoring

### Check Index Usage

To see which indexes are being used:

```sql
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;
```

### Identify Unused Indexes

Find indexes that have never been used:

```sql
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND indexrelname NOT LIKE '%_pkey'
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Check Index Sizes

View the disk space used by each index:

```sql
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    pg_size_pretty(pg_relation_size(tablename::regclass)) as table_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Analyze Query Performance

Check slow queries that might benefit from indexes:

```sql
-- Requires pg_stat_statements extension
SELECT
    calls,
    total_exec_time,
    mean_exec_time,
    query
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY mean_exec_time DESC
LIMIT 20;
```

## Index Maintenance

### Update Statistics

PostgreSQL uses statistics to choose optimal query plans. Update them regularly:

```sql
-- Update statistics for all tables
ANALYZE;

-- Update statistics for a specific table
ANALYZE profiles;
```

### Reindex

Rebuild indexes to reclaim space and improve performance:

```sql
-- Reindex a specific table
REINDEX TABLE profiles;

-- Reindex a specific index
REINDEX INDEX profiles_luma_email_lower_idx;

-- Reindex entire database (requires exclusive lock)
REINDEX DATABASE hello_miami;
```

## Performance Tips

1. **Monitor Index Usage**: Regularly check `pg_stat_user_indexes` to identify unused indexes
2. **Update Statistics**: Run `ANALYZE` after bulk data changes
3. **Watch Index Size**: Large indexes can slow down writes
4. **Avoid Over-Indexing**: Too many indexes hurt INSERT/UPDATE performance
5. **Use EXPLAIN**: Analyze query plans to verify index usage

### Example: Check if Index is Used

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM profiles
WHERE LOWER(luma_email) LIKE '%example%';
```

Look for "Index Scan" or "Bitmap Index Scan" in the output to confirm index usage.

## Future Optimization Ideas

Consider these indexes based on future query patterns:

1. **Full-Text Search**: GIN index on `to_tsvector(description)` for projects
2. **Trigram Indexes**: Using `pg_trgm` for fuzzy matching on names/titles
3. **Geo Indexes**: GiST indexes if we add location-based queries
4. **Covering Indexes**: INCLUDE clause for frequently accessed columns

## Troubleshooting

### Index Not Being Used

If a query isn't using an expected index:

1. Check if statistics are up-to-date: `ANALYZE table_name;`
2. Verify the query matches the index definition
3. Check if table is too small (PostgreSQL may prefer sequential scan)
4. Use `EXPLAIN ANALYZE` to see the query plan

### Slow Queries Despite Indexes

1. Check for missing `WHERE` clauses
2. Avoid functions on indexed columns (breaks index usage)
3. Consider partial indexes for filtered queries
4. Check if indexes are bloated: `REINDEX`

## Related Documentation

- [PostgreSQL Documentation - Indexes](https://www.postgresql.org/docs/current/indexes.html)
- [Zero Sync Performance Guide](https://zerosync.dev/docs/performance)
- [Database Schema](./DATABASE.md)
- [Zero Sync Migration](./ZERO_SYNC_MIGRATION.md)
