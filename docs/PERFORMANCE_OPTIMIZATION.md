# Performance Optimization Guide

**Last Updated**: February 11, 2026  
**Status**: Active

This document outlines the performance optimization strategies implemented for the Hello Miami community platform using PostgreSQL + Zero Sync.

---

## Table of Contents

1. [Database Optimization](#database-optimization)
2. [Query Performance](#query-performance)
3. [Index Strategy](#index-strategy)
4. [Zero Sync Optimization](#zero-sync-optimization)
5. [Monitoring & Metrics](#monitoring--metrics)
6. [Future Optimizations](#future-optimizations)

---

## Database Optimization

### Current Database Stats

- **Size**: ~10 MB (as of Feb 11, 2026)
- **Tables**: 11 tables
- **Indexes**: 57 indexes across all tables
- **Largest Table**: `profiles` (184 KB with indexes)

### Index Sources (Reconciled)

Indexes come from two places:

- Base schema indexes and unique constraints live in [drizzle/schema.ts](drizzle/schema.ts).
- Performance indexes are added in [drizzle/migrations/0001_add_performance_indexes.sql](drizzle/migrations/0001_add_performance_indexes.sql).

### PostgreSQL Configuration

The database is configured with the following optimizations:

1. **Logical Replication Enabled**
    - `wal_level=logical` for Zero Sync change data capture
    - Enables realtime sync without polling

2. **Connection Pooling Ready**
    - PgBouncer recommended for production
    - Current limit: Default PostgreSQL settings

3. **Health Checks**
    - Docker healthcheck monitors database availability
    - 30s interval, 5s timeout, 3 retries

---

## Query Performance

### Query Patterns Analysis

All queries are defined in `app/zero/queries.ts` and leverage Zero's type-safe query builder.

#### High-Frequency Queries

1. **Profile Lookups** (`profileQueries.byClerkUserId`)
    - Used on every authenticated page load
    - Index: `profiles_clerk_user_id_idx` (B-tree)
    - Performance: O(log n) - excellent for lookups

2. **Project Showcase** (`projectQueries.all`)
    - Used on public showcase page
    - Index: `projects_updated_at_idx` (B-tree DESC)
    - Optimization: Limit results to 50-100 initially, implement pagination

3. **Upcoming Events** (`eventQueries.upcoming`)
    - Used on events page and dashboard
    - Index: `events_upcoming_idx` (partial index WHERE is_canceled = false)
    - Performance: Excellent with partial index

4. **Member Badges** (`badgeQueries.byMemberId`)
    - Used on dashboard and profile pages
    - Indexes: `member_badges_member_id_idx` + join optimization
    - Performance: O(log n) lookup + small result set

#### Search Queries

1. **Profile Search** (`profileQueries.search`)
    - Uses ILIKE for case-insensitive search
    - Indexes:
        - `profiles_luma_email_lower_idx` (functional index on lower(luma_email))
        - `profiles_github_username_lower_idx` (functional index on lower(github_username))
    - Optimization: Consider full-text search for >10k profiles

2. **Project Search** (`projectQueries.search`)
    - Uses ILIKE on title
    - Index: `projects_title_lower_idx` (functional index)
    - Tag search: `projects_tags_gin_idx` (GIN index on JSONB)

---

## Index Strategy

### Index Types Used

#### 1. B-tree Indexes (Default)

Used for equality and range queries on scalar values.

**Examples**:

- `profiles_clerk_user_id_idx` - Fast user lookups
- `events_start_at_idx` - Event date range queries
- `attendance_member_id_idx` - Member attendance history

#### 2. Unique Indexes

Enforce data integrity and provide fast lookups.

**Examples**:

- `profiles_clerk_user_id_unique` - One profile per Clerk user
- `profiles_luma_email_unique` - One profile per email
- `events_luma_event_id_unique` - No duplicate events
- `attendance_member_event_unique` - No duplicate check-ins

#### 3. Composite Indexes

Optimize queries with multiple WHERE conditions.

**Examples**:

- `attendance_status_checked_in_at_idx` - Filters by status and sorts by check-in time
- `demo_slots_event_status_idx` - Event demo slot queries with status filter
- `survey_responses_survey_complete_idx` - Survey completion tracking

#### 4. Partial Indexes

Smaller indexes for common query patterns.

**Examples**:

- `events_upcoming_idx` - Only non-canceled future events
- `profiles_is_app_admin_idx` - Only admin users (small subset)
- `demo_slots_pending_idx` - Only pending demo requests
- `pending_users_unapproved_idx` - Only users awaiting approval

#### 5. Functional Indexes

Enable case-insensitive and transformed value searches.

**Examples**:

- `profiles_luma_email_lower_idx` - Case-insensitive email search
- `profiles_github_username_lower_idx` - Case-insensitive username search
- `projects_title_lower_idx` - Case-insensitive project title search

#### 6. GIN Indexes

Optimize JSONB array/object queries.

**Examples**:

- `profiles_skills_gin_idx` - Search profiles by skills array
- `projects_tags_gin_idx` - Filter projects by tags array

### Index Coverage Analysis

| Query Pattern       | Index                                   | Coverage | Notes                               |
| ------------------- | --------------------------------------- | -------- | ----------------------------------- |
| Profile by Clerk ID | `profiles_clerk_user_id_idx`            | ✅ Full  | Unique constraint                   |
| Projects by member  | `projects_member_id_idx`                | ✅ Full  | Foreign key index                   |
| Upcoming events     | `events_upcoming_idx`                   | ✅ Full  | Partial index optimizes common case |
| Event attendees     | `attendance_luma_event_id_idx`          | ✅ Full  | Covers JOIN lookups                 |
| Recent check-ins    | `attendance_status_checked_in_at_idx`   | ✅ Full  | Composite index                     |
| Badge lookup        | `member_badges_member_id_badge_id_pk`   | ✅ Full  | Primary key covers queries          |
| Survey responses    | `survey_responses_survey_member_unique` | ✅ Full  | Unique prevents duplicates          |
| Demo slot queue     | `demo_slots_pending_idx`                | ✅ Full  | Partial index for pending           |

---

## Zero Sync Optimization

### Client-Side Caching

Zero Sync maintains a local SQLite database on each client, providing:

1. **Instant Reads**: All queries read from local SQLite (no network latency)
2. **Optimistic Updates**: UI updates immediately before server confirmation
3. **Background Sync**: Changes propagate in the background via WebSocket

### Query Optimization Strategies

#### 1. Use Specific Queries

**Good**:

```typescript
// Fetch only the needed profile
const profile = useQuery(profileQueries.byClerkUserId(clerkUserId));
```

**Avoid**:

```typescript
// Don't fetch all profiles just to find one
const profiles = useQuery(profileQueries.all());
const profile = profiles.find(p => p.clerkUserId === clerkUserId);
```

#### 2. Leverage Related Data

**Good**:

```typescript
// Fetch project with author in one query
const project = useQuery(projectQueries.byId(projectId));
// project.member is already loaded
```

**Avoid**:

```typescript
// Don't make separate queries for related data
const project = useQuery(projectQueries.byId(projectId));
const member = useQuery(profileQueries.byId(project.memberId));
```

#### 3. Use Pagination

For large result sets, implement pagination:

```typescript
// Add limit/offset support to queries
export const projectQueries = {
    paginated(page: number, pageSize: number = 20) {
        return zql.projects
            .orderBy('createdAt', 'desc')
            .limit(pageSize)
            .offset(page * pageSize)
            .related('member', q => q.one());
    }
};
```

### Mutation Optimization

1. **Batch Mutations**: Group related changes into single transactions
2. **Optimistic UI**: UI updates immediately using Zero's optimistic updates
3. **Error Handling**: Revert on server rejection

---

## Monitoring & Metrics

### Zero Inspector

Access the Zero Inspector at `http://localhost:4848/inspector` (dev) to monitor:

- Active client connections
- Query performance
- Sync latency
- CVR (Client View Record) size

### PostgreSQL Query Monitoring

#### Enable Query Statistics

```sql
-- Enable pg_stat_statements extension
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- View slow queries
SELECT
    query,
    calls,
    mean_exec_time,
    max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

#### Monitor Index Usage

```sql
-- Check for unused indexes
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY schemaname, tablename, indexname;
```

#### Table Bloat Monitoring

```sql
-- Check table and index sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Application Metrics

Monitor these metrics in production:

1. **Query Latency**: Time from query to result (should be <10ms with Zero)
2. **Sync Lag**: Time between server write and client update (target <100ms)
3. **Connection Count**: Number of active Zero connections
4. **Mutation Success Rate**: Percentage of mutations that succeed

---

## Future Optimizations

As the platform grows, consider these optimizations:

### When Profiles > 10,000

1. **Full-Text Search**

    ```sql
    -- Add tsvector column for full-text search
    ALTER TABLE profiles ADD COLUMN search_vector tsvector;
    CREATE INDEX profiles_search_idx ON profiles USING GIN(search_vector);
    ```

2. **Materialized Views** for analytics/reports
3. **Read Replicas** for dashboard queries

### When Projects > 50,000

1. **Pagination** (implement offset/limit in queries)
2. **Virtual Scrolling** on showcase page
3. **Project Image CDN** (already using Cloudinary)

### When Events > 5,000

1. **Archive Old Events** (move to separate `events_archive` table)
2. **Aggregate Stats** in separate `event_stats` table

### When Database > 1 GB

1. **Partition Large Tables** by date (events, attendance)
2. **Vacuum/Analyze Schedule** (weekly VACUUM ANALYZE)
3. **Connection Pooling** (PgBouncer in transaction mode)

### Zero Cache Scaling

1. **Multiple Zero Cache Instances** behind load balancer
2. **Zero Cache Clustering** for high availability
3. **Redis Cache Layer** for frequently accessed data

---

## Performance Checklist

Use this checklist when adding new queries:

- [ ] Query uses appropriate index (check with EXPLAIN ANALYZE)
- [ ] Related data loaded in single query (avoid N+1)
- [ ] Results limited/paginated for large datasets
- [ ] Case-insensitive search uses functional index
- [ ] JSONB queries use GIN index
- [ ] Unique constraints prevent duplicates
- [ ] Foreign key indexes exist for JOINs

---

## Resources

- [Zero Sync Documentation](https://zerosync.dev/docs)
- [PostgreSQL Performance Tips](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Drizzle ORM Best Practices](https://orm.drizzle.team/docs/best-practices)
- [React Router 7 Data Loading](https://reactrouter.com/en/main/guides/data-loading)

---

## Appendix: Current Index List

### Profiles Table (11 indexes)

- `profiles_pkey` - Primary key (B-tree on id)
- `profiles_clerk_user_id_idx` - B-tree on clerk_user_id
- `profiles_clerk_user_id_unique` - Unique on clerk_user_id
- `profiles_luma_email_idx` - B-tree on luma_email
- `profiles_luma_email_unique` - Unique on luma_email
- `profiles_luma_email_lower_idx` - B-tree on lower(luma_email)
- `profiles_luma_attendee_id_idx` - B-tree on luma_attendee_id
- `profiles_github_username_idx` - B-tree on github_username
- `profiles_github_username_lower_idx` - B-tree on lower(github_username)
- `profiles_verification_status_idx` - B-tree on verification_status
- `profiles_is_app_admin_idx` - Partial B-tree WHERE is_app_admin = true
- `profiles_skills_gin_idx` - GIN on skills (JSONB)
- `profiles_updated_at_idx` - B-tree on updated_at DESC

### Projects Table (5 indexes)

- `projects_pkey` - Primary key (B-tree on id)
- `projects_member_id_idx` - B-tree on member_id
- `projects_title_lower_idx` - B-tree on lower(title)
- `projects_tags_gin_idx` - GIN on tags (JSONB)
- `projects_updated_at_idx` - B-tree on updated_at DESC

### Events Table (6 indexes)

- `events_pkey` - Primary key (B-tree on id)
- `events_luma_event_id_unique` - Unique on luma_event_id
- `events_start_at_idx` - B-tree on start_at
- `events_end_at_idx` - B-tree on end_at DESC
- `events_canceled_start_idx` - B-tree on (is_canceled, start_at)
- `events_upcoming_idx` - Partial B-tree on start_at WHERE is_canceled = false

### Attendance Table (6 indexes)

- `attendance_pkey` - Primary key (B-tree on id)
- `attendance_member_id_idx` - B-tree on member_id
- `attendance_luma_event_id_idx` - B-tree on luma_event_id
- `attendance_member_event_unique` - Unique on (member_id, luma_event_id)
- `attendance_checked_in_at_idx` - B-tree on checked_in_at DESC
- `attendance_status_checked_in_at_idx` - B-tree on (status, checked_in_at DESC)

### Badges Table (2 indexes)

- `badges_pkey` - Primary key (B-tree on id)
- `badges_name_unique` - Unique on name

### Member Badges Table (3 indexes)

- `member_badges_member_id_badge_id_pk` - Primary key on (member_id, badge_id)
- `member_badges_member_id_idx` - B-tree on member_id
- `member_badges_badge_id_idx` - B-tree on badge_id

### Demo Slots Table (6 indexes)

- `demo_slots_pkey` - Primary key (B-tree on id)
- `demo_slots_member_id_idx` - B-tree on member_id
- `demo_slots_event_id_idx` - B-tree on event_id
- `demo_slots_status_idx` - B-tree on status
- `demo_slots_event_status_idx` - B-tree on (event_id, status)
- `demo_slots_pending_idx` - Partial B-tree on (event_id, created_at) WHERE status = 'pending'

### Surveys Table (5 indexes)

- `surveys_pkey` - Primary key (B-tree on id)
- `surveys_slug_unique` - Unique on slug
- `surveys_type_idx` - B-tree on type
- `surveys_is_active_idx` - B-tree on is_active
- `surveys_active_created_idx` - Partial B-tree on created_at DESC WHERE is_active = true

### Survey Responses Table (5 indexes)

- `survey_responses_pkey` - Primary key (B-tree on id)
- `survey_responses_survey_id_idx` - B-tree on survey_id
- `survey_responses_member_id_idx` - B-tree on member_id
- `survey_responses_survey_member_unique` - Unique on (survey_id, member_id)
- `survey_responses_survey_complete_idx` - B-tree on (survey_id, is_complete)

### Pending Users Table (4 indexes)

- `pending_users_pkey` - Primary key (B-tree on id)
- `pending_users_email_unique` - Unique on email
- `pending_users_luma_attendee_id_unique` - Unique on luma_attendee_id
- `pending_users_unapproved_idx` - Partial B-tree on subscribed_at DESC WHERE approved_at IS NULL

### Luma Webhooks Table (2 indexes)

- `luma_webhooks_pkey` - Primary key (B-tree on id)
- `luma_webhooks_type_received_idx` - B-tree on (type, received_at DESC)

**Total**: 57 indexes across 11 tables
