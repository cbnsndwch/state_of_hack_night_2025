/**
 * Test Zero Queries with Sample Data
 *
 * This script:
 * 1. Inserts sample data into PostgreSQL
 * 2. Tests all Zero queries with actual data
 * 3. Tests relationships and filters
 * 4. Cleans up test data afterward
 */

import { db } from '../app/lib/db/provider.server';
import * as schema from '../drizzle/schema';
import { eq, and, ilike, gt, lt, isNull } from 'drizzle-orm';

console.log('🧪 Testing Zero Queries with Sample Data\n');

// Test result tracker
const results: { test: string; status: 'PASS' | 'FAIL'; error?: string }[] = [];
const testIds: {
    profileId?: string;
    projectId?: string;
    badgeId?: string;
    eventId?: string;
    surveyId?: string;
} = {};

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

async function seedTestData() {
    console.log('📦 Seeding Test Data');
    console.log('─'.repeat(50));

    try {
        // 1. Create a test profile
        const [profile] = await db
            .insert(schema.profiles)
            .values({
                clerkUserId: 'test-clerk-123',
                lumaEmail: 'test@example.com',
                verificationStatus: 'verified',
                isAppAdmin: false,
                githubUsername: 'testuser',
                bio: 'Test user for query testing',
                skills: ['TypeScript', 'React', 'PostgreSQL'],
                streakCount: 5,
                onboardingDismissed: true
            })
            .returning();
        testIds.profileId = profile.id;
        logTest('Seed: Create test profile', !!profile.id, null);

        // 2. Create a test badge
        const [badge] = await db
            .insert(schema.badges)
            .values({
                name: 'Test Badge',
                iconAscii: '🎯',
                criteria: 'Test badge for query testing'
            })
            .returning();
        testIds.badgeId = badge.id;
        logTest('Seed: Create test badge', !!badge.id, null);

        // 3. Assign badge to profile
        await db.insert(schema.memberBadges).values({
            memberId: profile.id,
            badgeId: badge.id
        });
        logTest('Seed: Assign badge to profile', true, null);

        // 4. Create a test project
        const [project] = await db
            .insert(schema.projects)
            .values({
                memberId: profile.id,
                title: 'Test Project',
                description: 'A test project for query testing',
                tags: ['typescript', 'testing', 'postgresql'],
                imageUrls: ['https://example.com/image.jpg'],
                githubUrl: 'https://github.com/test/project',
                publicUrl: 'https://test-project.com'
            })
            .returning();
        testIds.projectId = project.id;
        logTest('Seed: Create test project', !!project.id, null);

        // 5. Create a test event (upcoming)
        const [event] = await db
            .insert(schema.events)
            .values({
                lumaEventId: 'evt-test-12345',
                name: 'Test Hack Night',
                description: 'A test event for query testing',
                url: 'https://lu.ma/test-event',
                startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                timezone: 'America/New_York',
                location: {
                    type: 'physical',
                    name: 'Test Venue',
                    address: '123 Test St, Miami, FL',
                    lat: 25.7617,
                    lng: -80.1918
                },
                stats: {
                    registered: 10,
                    checkedIn: 5
                },
                isCanceled: false
            })
            .returning();
        testIds.eventId = event.id;
        logTest('Seed: Create test event', !!event.id, null);

        // 6. Create attendance record
        await db.insert(schema.attendance).values({
            memberId: profile.id,
            lumaEventId: event.lumaEventId,
            status: 'checked-in',
            checkedInAt: new Date()
        });
        logTest('Seed: Create attendance record', true, null);

        // 7. Create a test survey
        const [survey] = await db
            .insert(schema.surveys)
            .values({
                slug: 'test-survey-2026',
                title: 'Test Survey',
                description: 'A test survey for query testing',
                type: 'onboarding',
                isActive: true,
                questions: [
                    {
                        id: 'q1',
                        text: 'What is your favorite programming language?',
                        type: 'single-choice',
                        required: true,
                        options: ['TypeScript', 'Python', 'Go', 'Rust']
                    },
                    {
                        id: 'q2',
                        text: 'How many years of experience?',
                        type: 'scale',
                        required: true,
                        scale: { min: 0, max: 20 }
                    }
                ]
            })
            .returning();
        testIds.surveyId = survey.id;
        logTest('Seed: Create test survey', !!survey.id, null);

        // 8. Create survey response
        await db.insert(schema.surveyResponses).values({
            surveyId: survey.id,
            memberId: profile.id,
            responses: {
                q1: { type: 'single-choice', value: 'TypeScript' },
                q2: { type: 'scale', value: 5 }
            },
            isComplete: true
        });
        logTest('Seed: Create survey response', true, null);

        // 9. Create demo slot
        await db.insert(schema.demoSlots).values({
            memberId: profile.id,
            eventId: event.id,
            title: 'Test Demo',
            description: 'A test demo for query testing',
            requestedTime: 'anytime',
            durationMinutes: 5,
            status: 'pending',
            confirmedByOrganizer: false
        });
        logTest('Seed: Create demo slot', true, null);

        // 10. Create pending user
        await db.insert(schema.pendingUsers).values({
            email: 'pending@example.com',
            name: 'Pending User',
            lumaAttendeeId: 'luma-test-123',
            subscribedAt: new Date()
        });
        logTest('Seed: Create pending user', true, null);

        console.log('\n✅ Test data seeded successfully\n');
    } catch (error) {
        console.error('❌ Error seeding test data:', error);
        throw error;
    }
}

async function testQueriesWithData() {
    console.log('🔍 Testing Queries with Data');
    console.log('─'.repeat(50));

    try {
        // Profile queries
        console.log('\n📋 Profile Queries:');
        const profileById = await db
            .select()
            .from(schema.profiles)
            .where(eq(schema.profiles.id, testIds.profileId!));
        logTest(
            '  Get profile by ID',
            profileById.length === 1 && profileById[0].id === testIds.profileId,
            null
        );

        const profileByClerkId = await db
            .select()
            .from(schema.profiles)
            .where(eq(schema.profiles.clerkUserId, 'test-clerk-123'));
        logTest(
            '  Get profile by Clerk ID',
            profileByClerkId.length === 1 &&
                profileByClerkId[0].clerkUserId === 'test-clerk-123',
            null
        );

        const searchProfiles = await db
            .select()
            .from(schema.profiles)
            .where(ilike(schema.profiles.lumaEmail, '%test%'));
        logTest('  Search profiles by email', searchProfiles.length >= 1, null);

        // Project queries with relations
        console.log('\n📦 Project Queries:');
        const projectWithMember = await db.query.projects.findFirst({
            where: eq(schema.projects.id, testIds.projectId!),
            with: {
                member: true
            }
        });
        logTest(
            '  Get project with member relation',
            projectWithMember?.id === testIds.projectId &&
                projectWithMember?.member?.id === testIds.profileId,
            null
        );

        const projectsByMember = await db.query.projects.findMany({
            where: eq(schema.projects.memberId, testIds.profileId!),
            with: {
                member: true
            }
        });
        logTest(
            '  Get projects by member ID',
            projectsByMember.length >= 1 &&
                projectsByMember[0].memberId === testIds.profileId,
            null
        );

        // Badge queries with relations
        console.log('\n🏆 Badge Queries:');
        const memberBadges = await db.query.memberBadges.findMany({
            where: eq(schema.memberBadges.memberId, testIds.profileId!),
            with: {
                badge: true,
                member: true
            }
        });
        logTest(
            '  Get member badges with relations',
            memberBadges.length >= 1 &&
                memberBadges[0].badge !== null &&
                memberBadges[0].member !== null,
            null
        );

        // Event queries
        console.log('\n📅 Event Queries:');
        const upcomingEvents = await db
            .select()
            .from(schema.events)
            .where(gt(schema.events.startAt, new Date()));
        logTest('  Get upcoming events', upcomingEvents.length >= 1, null);

        const eventByLumaId = await db
            .select()
            .from(schema.events)
            .where(eq(schema.events.lumaEventId, 'evt-test-12345'));
        logTest(
            '  Get event by Luma ID',
            eventByLumaId.length === 1 &&
                eventByLumaId[0].lumaEventId === 'evt-test-12345',
            null
        );

        // Attendance queries with relations
        console.log('\n✅ Attendance Queries:');
        const attendanceWithMember = await db.query.attendance.findMany({
            where: eq(schema.attendance.memberId, testIds.profileId!),
            with: {
                member: true
            }
        });
        logTest(
            '  Get attendance with member relation',
            attendanceWithMember.length >= 1 &&
                attendanceWithMember[0].member !== null,
            null
        );

        const specificAttendance = await db
            .select()
            .from(schema.attendance)
            .where(
                and(
                    eq(schema.attendance.memberId, testIds.profileId!),
                    eq(schema.attendance.lumaEventId, 'evt-test-12345')
                )
            );
        logTest(
            '  Get attendance by member and event',
            specificAttendance.length === 1,
            null
        );

        // Survey queries
        console.log('\n📝 Survey Queries:');
        const activeSurveys = await db
            .select()
            .from(schema.surveys)
            .where(eq(schema.surveys.isActive, true));
        logTest('  Get active surveys', activeSurveys.length >= 1, null);

        const surveyBySlug = await db
            .select()
            .from(schema.surveys)
            .where(eq(schema.surveys.slug, 'test-survey-2026'));
        logTest(
            '  Get survey by slug',
            surveyBySlug.length === 1 &&
                surveyBySlug[0].slug === 'test-survey-2026',
            null
        );

        const responseWithRelations = await db.query.surveyResponses.findMany({
            where: eq(schema.surveyResponses.memberId, testIds.profileId!),
            with: {
                survey: true,
                member: true
            }
        });
        logTest(
            '  Get survey responses with relations',
            responseWithRelations.length >= 1 &&
                responseWithRelations[0].survey !== null &&
                responseWithRelations[0].member !== null,
            null
        );

        // Demo slot queries
        console.log('\n🎤 Demo Slot Queries:');
        const demoSlotsWithRelations = await db.query.demoSlots.findMany({
            where: eq(schema.demoSlots.memberId, testIds.profileId!),
            with: {
                member: true,
                event: true
            }
        });
        logTest(
            '  Get demo slots with relations',
            demoSlotsWithRelations.length >= 1 &&
                demoSlotsWithRelations[0].member !== null &&
                demoSlotsWithRelations[0].event !== null,
            null
        );

        const pendingSlots = await db
            .select()
            .from(schema.demoSlots)
            .where(eq(schema.demoSlots.status, 'pending'));
        logTest('  Get pending demo slots', pendingSlots.length >= 1, null);

        // Pending user queries
        console.log('\n⏳ Pending User Queries:');
        const pendingUsers = await db
            .select()
            .from(schema.pendingUsers)
            .where(isNull(schema.pendingUsers.approvedAt));
        logTest('  Get unapproved users', pendingUsers.length >= 1, null);

        const userByEmail = await db
            .select()
            .from(schema.pendingUsers)
            .where(eq(schema.pendingUsers.email, 'pending@example.com'));
        logTest(
            '  Get pending user by email',
            userByEmail.length === 1 &&
                userByEmail[0].email === 'pending@example.com',
            null
        );
    } catch (error) {
        console.error('❌ Error testing queries:', error);
        throw error;
    }
}

async function cleanupTestData() {
    console.log('\n🧹 Cleaning Up Test Data');
    console.log('─'.repeat(50));

    try {
        // Delete in reverse order of dependencies
        await db
            .delete(schema.demoSlots)
            .where(eq(schema.demoSlots.memberId, testIds.profileId!));
        await db
            .delete(schema.surveyResponses)
            .where(eq(schema.surveyResponses.memberId, testIds.profileId!));
        await db
            .delete(schema.surveys)
            .where(eq(schema.surveys.id, testIds.surveyId!));
        await db
            .delete(schema.attendance)
            .where(eq(schema.attendance.memberId, testIds.profileId!));
        await db
            .delete(schema.events)
            .where(eq(schema.events.id, testIds.eventId!));
        await db
            .delete(schema.projects)
            .where(eq(schema.projects.id, testIds.projectId!));
        await db
            .delete(schema.memberBadges)
            .where(eq(schema.memberBadges.memberId, testIds.profileId!));
        await db
            .delete(schema.badges)
            .where(eq(schema.badges.id, testIds.badgeId!));
        await db
            .delete(schema.profiles)
            .where(eq(schema.profiles.id, testIds.profileId!));
        await db
            .delete(schema.pendingUsers)
            .where(eq(schema.pendingUsers.email, 'pending@example.com'));

        logTest('Cleanup: Delete all test data', true, null);
        console.log('✅ Test data cleaned up successfully\n');
    } catch (error) {
        console.error('❌ Error cleaning up test data:', error);
        throw error;
    }
}

async function main() {
    console.log('Starting Zero Query Tests with Sample Data...\n');
    console.log('='.repeat(50));

    try {
        // Seed test data
        await seedTestData();

        // Test queries with data
        await testQueriesWithData();

        // Cleanup
        await cleanupTestData();

        // Print summary
        console.log('='.repeat(50));
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
        // Try to cleanup even if tests failed
        try {
            if (testIds.profileId) {
                await cleanupTestData();
            }
        } catch (cleanupError) {
            console.error('❌ Error during cleanup:', cleanupError);
        }
        process.exit(1);
    }
}

main();
