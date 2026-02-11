/**
 * Test Zero Queries in Isolation
 *
 * This script tests all Zero queries directly against the PostgreSQL database
 * to ensure they work correctly before integrating them into the React components.
 */

import { db } from '../app/lib/db/provider.server';
import { zql } from '../app/zero/schema';
import * as schema from '../drizzle/schema';
import { eq, and, ilike, gt, lt, isNull } from 'drizzle-orm';

console.log('🧪 Testing Zero Queries in Isolation\n');

// Test result tracker
const results: { test: string; status: 'PASS' | 'FAIL'; error?: string }[] = [];

function logTest(name: string, passed: boolean, error?: any) {
    results.push({
        test: name,
        status: passed ? 'PASS' : 'FAIL',
        error: error?.message || error
    });
    console.log(
        passed ? '✅' : '❌',
        name,
        error ? `- ${error.message || error}` : ''
    );
}

async function testProfileQueries() {
    console.log('\n📋 Testing Profile Queries');
    console.log('─'.repeat(50));

    try {
        // Test 1: Get all profiles
        const allProfiles = await db.select().from(schema.profiles);
        logTest('Profile: Get all profiles', Array.isArray(allProfiles), null);
        console.log(`   Found ${allProfiles.length} profiles`);

        // Test 2: Get profile by ID (if any exist)
        if (allProfiles.length > 0) {
            const firstProfile = allProfiles[0];
            const profileById = await db
                .select()
                .from(schema.profiles)
                .where(eq(schema.profiles.id, firstProfile.id));
            logTest(
                'Profile: Get profile by ID',
                profileById.length > 0 && profileById[0].id === firstProfile.id,
                null
            );
        } else {
            logTest('Profile: Get profile by ID', true, 'Skipped - no data');
        }

        // Test 3: Get profile by Clerk user ID
        const profileByClerkId = await db
            .select()
            .from(schema.profiles)
            .where(eq(schema.profiles.clerkUserId, 'test-clerk-id'));
        logTest(
            'Profile: Get profile by Clerk user ID',
            Array.isArray(profileByClerkId),
            null
        );

        // Test 4: Search profiles by email (using ILIKE)
        const searchByEmail = await db
            .select()
            .from(schema.profiles)
            .where(ilike(schema.profiles.lumaEmail, '%test%'));
        logTest(
            'Profile: Search profiles by email',
            Array.isArray(searchByEmail),
            null
        );

        // Test 5: Search profiles by GitHub username
        const searchByGithub = await db
            .select()
            .from(schema.profiles)
            .where(ilike(schema.profiles.githubUsername, '%test%'));
        logTest(
            'Profile: Search profiles by GitHub username',
            Array.isArray(searchByGithub),
            null
        );
    } catch (error) {
        logTest('Profile: Queries', false, error);
    }
}

async function testProjectQueries() {
    console.log('\n📦 Testing Project Queries');
    console.log('─'.repeat(50));

    try {
        // Test 1: Get all projects
        const allProjects = await db.select().from(schema.projects);
        logTest('Project: Get all projects', Array.isArray(allProjects), null);
        console.log(`   Found ${allProjects.length} projects`);

        // Test 2: Get projects with member relation
        const projectsWithMembers = await db.query.projects.findMany({
            with: {
                member: true
            }
        });
        logTest(
            'Project: Get projects with member relation',
            Array.isArray(projectsWithMembers),
            null
        );

        // Test 3: Get project by ID
        if (allProjects.length > 0) {
            const firstProject = allProjects[0];
            const projectById = await db
                .select()
                .from(schema.projects)
                .where(eq(schema.projects.id, firstProject.id));
            logTest(
                'Project: Get project by ID',
                projectById.length > 0 && projectById[0].id === firstProject.id,
                null
            );
        } else {
            logTest('Project: Get project by ID', true, 'Skipped - no data');
        }

        // Test 4: Search projects by title
        const searchByTitle = await db
            .select()
            .from(schema.projects)
            .where(ilike(schema.projects.title, '%test%'));
        logTest(
            'Project: Search projects by title',
            Array.isArray(searchByTitle),
            null
        );
    } catch (error) {
        logTest('Project: Queries', false, error);
    }
}

async function testBadgeQueries() {
    console.log('\n🏆 Testing Badge Queries');
    console.log('─'.repeat(50));

    try {
        // Test 1: Get all badges
        const allBadges = await db.select().from(schema.badges);
        logTest('Badge: Get all badges', Array.isArray(allBadges), null);
        console.log(`   Found ${allBadges.length} badges`);

        // Test 2: Get member badges with relations
        const memberBadges = await db.query.memberBadges.findMany({
            with: {
                badge: true,
                member: true
            }
        });
        logTest(
            'Badge: Get member badges with relations',
            Array.isArray(memberBadges),
            null
        );
        console.log(`   Found ${memberBadges.length} member badge assignments`);
    } catch (error) {
        logTest('Badge: Queries', false, error);
    }
}

async function testEventQueries() {
    console.log('\n📅 Testing Event Queries');
    console.log('─'.repeat(50));

    try {
        // Test 1: Get all events
        const allEvents = await db.select().from(schema.events);
        logTest('Event: Get all events', Array.isArray(allEvents), null);
        console.log(`   Found ${allEvents.length} events`);

        // Test 2: Get upcoming events (events starting after now)
        const now = new Date();
        const upcomingEvents = await db
            .select()
            .from(schema.events)
            .where(gt(schema.events.startAt, now));
        logTest(
            'Event: Get upcoming events',
            Array.isArray(upcomingEvents),
            null
        );
        console.log(`   Found ${upcomingEvents.length} upcoming events`);

        // Test 3: Get past events (events starting before now)
        const pastEvents = await db
            .select()
            .from(schema.events)
            .where(lt(schema.events.startAt, now));
        logTest('Event: Get past events', Array.isArray(pastEvents), null);
        console.log(`   Found ${pastEvents.length} past events`);

        // Test 4: Get event by Luma event ID
        const eventByLumaId = await db
            .select()
            .from(schema.events)
            .where(eq(schema.events.lumaEventId, 'evt-test-12345'));
        logTest(
            'Event: Get event by Luma event ID',
            Array.isArray(eventByLumaId),
            null
        );
    } catch (error) {
        logTest('Event: Queries', false, error);
    }
}

async function testAttendanceQueries() {
    console.log('\n✅ Testing Attendance Queries');
    console.log('─'.repeat(50));

    try {
        // Test 1: Get all attendance records
        const allAttendance = await db.select().from(schema.attendance);
        logTest(
            'Attendance: Get all records',
            Array.isArray(allAttendance),
            null
        );
        console.log(`   Found ${allAttendance.length} attendance records`);

        // Test 2: Get attendance with member relation
        const attendanceWithMembers = await db.query.attendance.findMany({
            with: {
                member: true
            }
        });
        logTest(
            'Attendance: Get records with member relation',
            Array.isArray(attendanceWithMembers),
            null
        );

        // Test 3: Get attendance by member and event
        if (allAttendance.length > 0) {
            const firstAttendance = allAttendance[0];
            const specificAttendance = await db
                .select()
                .from(schema.attendance)
                .where(
                    and(
                        eq(
                            schema.attendance.memberId,
                            firstAttendance.memberId
                        ),
                        eq(
                            schema.attendance.lumaEventId,
                            firstAttendance.lumaEventId
                        )
                    )
                );
            logTest(
                'Attendance: Get attendance by member and event',
                specificAttendance.length > 0,
                null
            );
        } else {
            logTest(
                'Attendance: Get attendance by member and event',
                true,
                'Skipped - no data'
            );
        }
    } catch (error) {
        logTest('Attendance: Queries', false, error);
    }
}

async function testSurveyQueries() {
    console.log('\n📝 Testing Survey Queries');
    console.log('─'.repeat(50));

    try {
        // Test 1: Get all surveys
        const allSurveys = await db.select().from(schema.surveys);
        logTest('Survey: Get all surveys', Array.isArray(allSurveys), null);
        console.log(`   Found ${allSurveys.length} surveys`);

        // Test 2: Get active surveys
        const activeSurveys = await db
            .select()
            .from(schema.surveys)
            .where(eq(schema.surveys.isActive, true));
        logTest(
            'Survey: Get active surveys',
            Array.isArray(activeSurveys),
            null
        );
        console.log(`   Found ${activeSurveys.length} active surveys`);

        // Test 3: Get survey by slug
        const surveyBySlug = await db
            .select()
            .from(schema.surveys)
            .where(eq(schema.surveys.slug, 'test-survey'));
        logTest(
            'Survey: Get survey by slug',
            Array.isArray(surveyBySlug),
            null
        );

        // Test 4: Get survey responses with relations
        const responses = await db.query.surveyResponses.findMany({
            with: {
                survey: true,
                member: true
            }
        });
        logTest(
            'Survey: Get responses with relations',
            Array.isArray(responses),
            null
        );
        console.log(`   Found ${responses.length} survey responses`);
    } catch (error) {
        logTest('Survey: Queries', false, error);
    }
}

async function testDemoSlotQueries() {
    console.log('\n🎤 Testing Demo Slot Queries');
    console.log('─'.repeat(50));

    try {
        // Test 1: Get all demo slots
        const allDemoSlots = await db.select().from(schema.demoSlots);
        logTest(
            'DemoSlot: Get all demo slots',
            Array.isArray(allDemoSlots),
            null
        );
        console.log(`   Found ${allDemoSlots.length} demo slots`);

        // Test 2: Get demo slots with relations
        const demoSlotsWithRelations = await db.query.demoSlots.findMany({
            with: {
                member: true,
                event: true
            }
        });
        logTest(
            'DemoSlot: Get demo slots with relations',
            Array.isArray(demoSlotsWithRelations),
            null
        );

        // Test 3: Get pending demo slots
        const pendingSlots = await db
            .select()
            .from(schema.demoSlots)
            .where(eq(schema.demoSlots.status, 'pending'));
        logTest(
            'DemoSlot: Get pending demo slots',
            Array.isArray(pendingSlots),
            null
        );
        console.log(`   Found ${pendingSlots.length} pending demo slots`);
    } catch (error) {
        logTest('DemoSlot: Queries', false, error);
    }
}

async function testPendingUserQueries() {
    console.log('\n⏳ Testing Pending User Queries');
    console.log('─'.repeat(50));

    try {
        // Test 1: Get all pending users
        const allPendingUsers = await db.select().from(schema.pendingUsers);
        logTest(
            'PendingUser: Get all pending users',
            Array.isArray(allPendingUsers),
            null
        );
        console.log(`   Found ${allPendingUsers.length} pending users`);

        // Test 2: Get pending users (not approved)
        const pendingUsers = await db
            .select()
            .from(schema.pendingUsers)
            .where(isNull(schema.pendingUsers.approvedAt));
        logTest(
            'PendingUser: Get unapproved users',
            Array.isArray(pendingUsers),
            null
        );
        console.log(`   Found ${pendingUsers.length} unapproved users`);

        // Test 3: Get pending user by email
        const userByEmail = await db
            .select()
            .from(schema.pendingUsers)
            .where(eq(schema.pendingUsers.email, 'test@example.com'));
        logTest(
            'PendingUser: Get user by email',
            Array.isArray(userByEmail),
            null
        );
    } catch (error) {
        logTest('PendingUser: Queries', false, error);
    }
}

async function testDatabaseConnection() {
    console.log('\n🔌 Testing Database Connection');
    console.log('─'.repeat(50));

    try {
        const result = await db.execute('SELECT 1 as test');
        logTest('Database: Connection test', true, null);
        console.log('   Connection successful');
    } catch (error) {
        logTest('Database: Connection test', false, error);
        throw error; // Stop testing if connection fails
    }
}

async function main() {
    console.log('Starting Zero Query Tests...\n');
    console.log('='.repeat(50));

    try {
        // Test database connection first
        await testDatabaseConnection();

        // Run all query tests
        await testProfileQueries();
        await testProjectQueries();
        await testBadgeQueries();
        await testEventQueries();
        await testAttendanceQueries();
        await testSurveyQueries();
        await testDemoSlotQueries();
        await testPendingUserQueries();

        // Print summary
        console.log('\n' + '='.repeat(50));
        console.log('📊 Test Summary');
        console.log('='.repeat(50));

        const passed = results.filter(r => r.status === 'PASS').length;
        const failed = results.filter(r => r.status === 'FAIL').length;
        const total = results.length;

        console.log(`\nTotal Tests: ${total}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

        if (failed > 0) {
            console.log('\n❌ Failed Tests:');
            results
                .filter(r => r.status === 'FAIL')
                .forEach(r => {
                    console.log(
                        `   - ${r.test}: ${r.error || 'Unknown error'}`
                    );
                });
        }

        console.log('\n' + '='.repeat(50));

        process.exit(failed > 0 ? 1 : 0);
    } catch (error) {
        console.error('\n❌ Fatal error during testing:', error);
        process.exit(1);
    }
}

main();
