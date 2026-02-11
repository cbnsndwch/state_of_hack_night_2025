/**
 * Performance Testing Script
 *
 * This script tests query performance and validates index usage.
 * Run with: pnpm tsx scripts/performance-test.ts
 */

import { db } from '../app/lib/db/provider.server';
import { sql } from 'drizzle-orm';
import * as schema from '../drizzle/schema';

interface QueryTest {
    name: string;
    description: string;
    query: () => Promise<any>;
    expectedRows?: number;
}

interface QueryPlan {
    'QUERY PLAN': string;
}

/**
 * Analyze query execution plan
 */
async function analyzeQuery(queryFn: () => Promise<any>): Promise<string[]> {
    try {
        // Get the query string (this is a simplified version)
        // In practice, you'd need to extract the SQL from Drizzle
        const result = await queryFn();
        return ['Query executed successfully'];
    } catch (error) {
        return [`Error: ${error}`];
    }
}

/**
 * Test suite for common queries
 */
const tests: QueryTest[] = [
    {
        name: 'Profile by Clerk User ID',
        description: 'Most common query - used on every auth page load',
        query: async () => {
            const result = await db.query.profiles.findFirst({
                where: (profiles, { eq }) =>
                    eq(profiles.clerkUserId, 'test-clerk-id')
            });
            return result;
        }
    },
    {
        name: 'All Projects with Members',
        description:
            'Public showcase page - loads all projects with author info',
        query: async () => {
            const result = await db.query.projects.findMany({
                with: {
                    member: true
                },
                orderBy: (projects, { desc }) => [desc(projects.createdAt)],
                limit: 50
            });
            return result;
        }
    },
    {
        name: 'Upcoming Events',
        description: 'Events page - shows non-canceled future events',
        query: async () => {
            const now = new Date();
            const result = await db.query.events.findMany({
                where: (events, { and, eq, gt }) =>
                    and(eq(events.isCanceled, false), gt(events.startAt, now)),
                orderBy: (events, { asc }) => [asc(events.startAt)]
            });
            return result;
        }
    },
    {
        name: 'Member Badges',
        description: 'Dashboard - shows earned badges for a member',
        query: async () => {
            const result = await db.query.memberBadges.findMany({
                where: (memberBadges, { eq }) =>
                    eq(memberBadges.memberId, 'test-member-id'),
                with: {
                    badge: true
                },
                orderBy: (memberBadges, { desc }) => [
                    desc(memberBadges.awardedAt)
                ]
            });
            return result;
        }
    },
    {
        name: 'Attendance History',
        description: 'Profile page - shows check-in history',
        query: async () => {
            const result = await db.query.attendance.findMany({
                where: (attendance, { eq }) =>
                    eq(attendance.memberId, 'test-member-id'),
                orderBy: (attendance, { desc }) => [desc(attendance.createdAt)],
                limit: 20
            });
            return result;
        }
    },
    {
        name: 'Event Attendees',
        description: 'Event details - shows who checked in',
        query: async () => {
            const result = await db.query.attendance.findMany({
                where: (attendance, { and, eq }) =>
                    and(
                        eq(attendance.lumaEventId, 'evt-test-event'),
                        eq(attendance.status, 'checked-in')
                    ),
                with: {
                    member: true
                }
            });
            return result;
        }
    },
    {
        name: 'Pending Demo Slots',
        description: 'Admin view - pending demo requests for an event',
        query: async () => {
            const result = await db.query.demoSlots.findMany({
                where: (demoSlots, { and, eq }) =>
                    and(
                        eq(demoSlots.eventId, 'test-event-id'),
                        eq(demoSlots.status, 'pending')
                    ),
                with: {
                    member: true
                },
                orderBy: (demoSlots, { asc }) => [asc(demoSlots.createdAt)]
            });
            return result;
        }
    },
    {
        name: 'Active Surveys',
        description: 'Dashboard - shows available surveys',
        query: async () => {
            const result = await db.query.surveys.findMany({
                where: (surveys, { eq }) => eq(surveys.isActive, true),
                orderBy: (surveys, { desc }) => [desc(surveys.createdAt)]
            });
            return result;
        }
    },
    {
        name: 'Profile Search (Case-Insensitive)',
        description: 'Member directory - search by email or username',
        query: async () => {
            const result = await db.query.profiles.findMany({
                where: (profiles, { or, ilike }) =>
                    or(
                        ilike(profiles.lumaEmail, '%test%'),
                        ilike(profiles.githubUsername, '%test%')
                    ),
                limit: 20
            });
            return result;
        }
    },
    {
        name: 'Project Search by Title',
        description: 'Showcase search - find projects by title',
        query: async () => {
            const result = await db.query.projects.findMany({
                where: (projects, { ilike }) =>
                    ilike(projects.title, '%search%'),
                with: {
                    member: true
                },
                limit: 20
            });
            return result;
        }
    }
];

/**
 * Check index usage statistics
 */
async function checkIndexUsage() {
    console.log('\n📊 INDEX USAGE STATISTICS\n');

    const indexStats = await db.execute<{
        schemaname: string;
        tablename: string;
        indexname: string;
        idx_scan: number;
        idx_tup_read: number;
        idx_tup_fetch: number;
    }>(sql`
        SELECT 
            schemaname,
            tablename,
            indexname,
            idx_scan,
            idx_tup_read,
            idx_tup_fetch
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
        ORDER BY idx_scan DESC, tablename, indexname
        LIMIT 20
    `);

    console.log('Top 20 Most Used Indexes:');
    console.log(
        '┌─────────────────────────┬─────────────────────────────────────┬──────────┬──────────────┬─────────────┐'
    );
    console.log(
        '│ Table                   │ Index                               │ Scans    │ Tuples Read  │ Tuples Fetch│'
    );
    console.log(
        '├─────────────────────────┼─────────────────────────────────────┼──────────┼──────────────┼─────────────┤'
    );

    for (const row of indexStats.rows) {
        console.log(
            `│ ${row.tablename.padEnd(23)} │ ${row.indexname.padEnd(35)} │ ${String(row.idx_scan).padStart(8)} │ ${String(row.idx_tup_read).padStart(12)} │ ${String(row.idx_tup_fetch).padStart(11)} │`
        );
    }

    console.log(
        '└─────────────────────────┴─────────────────────────────────────┴──────────┴──────────────┴─────────────┘'
    );

    // Check for unused indexes
    const unusedIndexes = await db.execute<{
        tablename: string;
        indexname: string;
    }>(sql`
        SELECT 
            tablename,
            indexname
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
          AND idx_scan = 0
          AND indexname NOT LIKE '%_pkey'
        ORDER BY tablename, indexname
    `);

    if (unusedIndexes.rows.length > 0) {
        console.log('\n⚠️  UNUSED INDEXES (consider removing if not needed):');
        for (const row of unusedIndexes.rows) {
            console.log(`   - ${row.tablename}.${row.indexname}`);
        }
    } else {
        console.log('\n✅ All non-primary key indexes are being used');
    }
}

/**
 * Check table sizes
 */
async function checkTableSizes() {
    console.log('\n💾 TABLE SIZE ANALYSIS\n');

    const tableSizes = await db.execute<{
        tablename: string;
        total_size: string;
        table_size: string;
        indexes_size: string;
        row_count: string;
    }>(sql`
        SELECT 
            t.tablename,
            pg_size_pretty(pg_total_relation_size(t.schemaname||'.'||t.tablename)) AS total_size,
            pg_size_pretty(pg_relation_size(t.schemaname||'.'||t.tablename)) AS table_size,
            pg_size_pretty(pg_total_relation_size(t.schemaname||'.'||t.tablename) - pg_relation_size(t.schemaname||'.'||t.tablename)) AS indexes_size,
            COALESCE(c.reltuples::bigint, 0)::text AS row_count
        FROM pg_tables t
        LEFT JOIN pg_class c ON c.relname = t.tablename
        WHERE t.schemaname = 'public'
        ORDER BY pg_total_relation_size(t.schemaname||'.'||t.tablename) DESC
    `);

    console.log(
        '┌─────────────────────┬─────────────┬─────────────┬──────────────┬────────────┐'
    );
    console.log(
        '│ Table               │ Total Size  │ Table Size  │ Indexes Size │ Row Count  │'
    );
    console.log(
        '├─────────────────────┼─────────────┼─────────────┼──────────────┼────────────┤'
    );

    for (const row of tableSizes.rows) {
        console.log(
            `│ ${row.tablename.padEnd(19)} │ ${row.total_size.padStart(11)} │ ${row.table_size.padStart(11)} │ ${row.indexes_size.padStart(12)} │ ${row.row_count.padStart(10)} │`
        );
    }

    console.log(
        '└─────────────────────┴─────────────┴─────────────┴──────────────┴────────────┘'
    );
}

/**
 * Test query performance
 */
async function testQueryPerformance() {
    console.log('\n⚡ QUERY PERFORMANCE TESTS\n');

    for (const test of tests) {
        console.log(`\n🔍 ${test.name}`);
        console.log(`   ${test.description}`);

        try {
            const startTime = performance.now();
            const result = await test.query();
            const endTime = performance.now();
            const duration = (endTime - startTime).toFixed(2);

            const resultCount = Array.isArray(result)
                ? result.length
                : result
                  ? 1
                  : 0;

            if (parseFloat(duration) < 10) {
                console.log(
                    `   ✅ Executed in ${duration}ms (${resultCount} rows)`
                );
            } else if (parseFloat(duration) < 100) {
                console.log(
                    `   ⚠️  Executed in ${duration}ms (${resultCount} rows) - Consider optimization`
                );
            } else {
                console.log(
                    `   ❌ Executed in ${duration}ms (${resultCount} rows) - SLOW QUERY`
                );
            }
        } catch (error) {
            console.log(
                `   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }
}

/**
 * Main execution
 */
async function main() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('         HELLO MIAMI PERFORMANCE ANALYSIS');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Date: ${new Date().toISOString()}`);
    console.log('Database: PostgreSQL with Zero Sync');

    try {
        await checkTableSizes();
        await checkIndexUsage();
        await testQueryPerformance();

        console.log(
            '\n═══════════════════════════════════════════════════════════'
        );
        console.log('                   ANALYSIS COMPLETE');
        console.log(
            '═══════════════════════════════════════════════════════════\n'
        );

        console.log('💡 RECOMMENDATIONS:');
        console.log(
            '   1. Run this script regularly to track performance trends'
        );
        console.log(
            '   2. Monitor slow queries (>100ms) and optimize as needed'
        );
        console.log('   3. Remove unused indexes if they stay at 0 scans');
        console.log(
            '   4. Implement pagination for queries returning >100 rows'
        );
        console.log(
            '   5. Use Zero Sync Inspector for client-side performance\n'
        );

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error during performance analysis:', error);
        process.exit(1);
    }
}

// Run if executed directly
if (require.main === module) {
    main();
}

export { main as runPerformanceTest };
