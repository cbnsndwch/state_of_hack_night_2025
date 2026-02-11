-- Migration: Add performance indexes for common query patterns
-- Generated: 2026-02-11
-- Purpose: Optimize slow queries identified through Zero Inspector and PostgreSQL monitoring

-- ============================================================================
-- Text Search Indexes (for ILIKE queries)
-- ============================================================================

-- Profiles: Text search on email and username (case-insensitive)
-- Supports profileQueries.search()
CREATE INDEX IF NOT EXISTS "profiles_luma_email_lower_idx" 
    ON "profiles" USING btree (LOWER("luma_email"));

CREATE INDEX IF NOT EXISTS "profiles_github_username_lower_idx" 
    ON "profiles" USING btree (LOWER("github_username"));

-- Projects: Text search on title (case-insensitive)
-- Supports projectQueries.search()
CREATE INDEX IF NOT EXISTS "projects_title_lower_idx" 
    ON "projects" USING btree (LOWER("title"));

-- ============================================================================
-- JSONB Indexes (for filtering by array elements)
-- ============================================================================

-- Projects: Filter by tags (GIN index for JSONB containment)
-- Supports filtering projects by tech stack tags
CREATE INDEX IF NOT EXISTS "projects_tags_gin_idx" 
    ON "projects" USING gin ("tags" jsonb_path_ops);

-- Profiles: Filter by skills (GIN index for JSONB containment)
-- Supports filtering members by skills
CREATE INDEX IF NOT EXISTS "profiles_skills_gin_idx" 
    ON "profiles" USING gin ("skills" jsonb_path_ops);

-- ============================================================================
-- Composite Indexes (for compound queries)
-- ============================================================================

-- Attendance: Filter by member and event together
-- Supports attendanceQueries.memberAtEvent() - already has unique constraint
-- (No additional index needed - unique constraint provides index)

-- Attendance: Filter by status and check-in time for analytics
-- Supports queries like "recent check-ins with status 'checked-in'"
CREATE INDEX IF NOT EXISTS "attendance_status_checked_in_at_idx" 
    ON "attendance" USING btree ("status", "checked_in_at" DESC NULLS LAST);

-- Demo Slots: Filter by event and status together
-- Supports demoSlotQueries.pendingByEventId()
CREATE INDEX IF NOT EXISTS "demo_slots_event_status_idx" 
    ON "demo_slots" USING btree ("event_id", "status");

-- Survey Responses: Filter by survey and completion status
-- Supports queries for incomplete responses per survey
CREATE INDEX IF NOT EXISTS "survey_responses_survey_complete_idx" 
    ON "survey_responses" USING btree ("survey_id", "is_complete");

-- ============================================================================
-- Timestamp Indexes (for time-based queries and ordering)
-- ============================================================================

-- Events: Filter by end time (for past events)
-- Supports eventQueries.past()
CREATE INDEX IF NOT EXISTS "events_end_at_idx" 
    ON "events" USING btree ("end_at" DESC NULLS LAST);

-- Events: Composite index for active/canceled events ordered by start time
-- Supports filtering out canceled events in upcoming queries
CREATE INDEX IF NOT EXISTS "events_canceled_start_idx" 
    ON "events" USING btree ("is_canceled", "start_at" ASC);

-- Attendance: Order by checked-in time for recent activity
-- Supports dashboard "recent check-ins" display
CREATE INDEX IF NOT EXISTS "attendance_checked_in_at_idx" 
    ON "attendance" USING btree ("checked_in_at" DESC NULLS LAST);

-- Projects: Order by updated time for "recently updated" queries
-- Supports finding recently modified projects
CREATE INDEX IF NOT EXISTS "projects_updated_at_idx" 
    ON "projects" USING btree ("updated_at" DESC);

-- Profiles: Order by updated time for "recently active members"
-- Supports member directory sorting
CREATE INDEX IF NOT EXISTS "profiles_updated_at_idx" 
    ON "profiles" USING btree ("updated_at" DESC);

-- ============================================================================
-- Partial Indexes (for filtered queries)
-- ============================================================================

-- Pending Users: Only index unapproved users
-- Supports pendingUserQueries.pending() - only query unapproved users
CREATE INDEX IF NOT EXISTS "pending_users_unapproved_idx" 
    ON "pending_users" USING btree ("subscribed_at" DESC) 
    WHERE "approved_at" IS NULL;

-- Surveys: Only index active surveys
-- Supports surveyQueries.active() - most queries filter by isActive = true
CREATE INDEX IF NOT EXISTS "surveys_active_created_idx" 
    ON "surveys" USING btree ("created_at" DESC) 
    WHERE "is_active" = true;

-- Events: Only index non-canceled events
-- Supports eventQueries.upcoming() - most common query
-- Note: Cannot use NOW() in partial index (not immutable), so we index all non-canceled events
CREATE INDEX IF NOT EXISTS "events_upcoming_idx" 
    ON "events" USING btree ("start_at" ASC) 
    WHERE "is_canceled" = false;

-- Demo Slots: Only index pending slots
-- Supports organizer dashboard showing pending demos
CREATE INDEX IF NOT EXISTS "demo_slots_pending_idx" 
    ON "demo_slots" USING btree ("event_id", "created_at" ASC) 
    WHERE "status" = 'pending';

-- ============================================================================
-- Statistics Indexes (for aggregation queries)
-- ============================================================================

-- Profiles: Support counting by verification status
-- Supports admin queries for user approval stats
CREATE INDEX IF NOT EXISTS "profiles_verification_status_idx" 
    ON "profiles" USING btree ("verification_status");

-- Profiles: Support filtering by admin status
-- Supports queries for listing admins
CREATE INDEX IF NOT EXISTS "profiles_is_app_admin_idx" 
    ON "profiles" USING btree ("is_app_admin") 
    WHERE "is_app_admin" = true;

-- Luma Webhooks: Index by type and received time for debugging/auditing
-- Supports webhook logs and debugging
CREATE INDEX IF NOT EXISTS "luma_webhooks_type_received_idx" 
    ON "luma_webhooks" USING btree ("type", "received_at" DESC);

-- ============================================================================
-- Comments for Future Optimization
-- ============================================================================

-- Additional indexes to consider based on future query patterns:
-- 1. Full-text search index on projects.description if we add full-text search
-- 2. Trigram indexes (pg_trgm) for fuzzy matching on names/titles
-- 3. GiST indexes for location-based queries if we add geo features
-- 4. Covering indexes with INCLUDE clause for specific hot queries

-- Monitor these indexes over time using:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan ASC;
