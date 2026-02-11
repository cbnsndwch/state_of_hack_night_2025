/**
 * MongoDB to PostgreSQL Migration Script
 *
 * This script migrates all data from MongoDB to PostgreSQL for the Zero Sync migration.
 * It handles:
 * - Profiles
 * - Projects
 * - Badges & Member Badges
 * - Events
 * - Attendance
 * - Surveys & Survey Responses
 * - Demo Slots
 * - Pending Users
 * - Luma Webhooks
 *
 * Run with: pnpm tsx scripts/migrate-mongo-to-postgres.ts
 */

import { MongoClient, ObjectId } from 'mongodb';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../drizzle/schema';

// Validate environment variables
if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is required');
}

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
}

interface MigrationStats {
    profiles: number;
    projects: number;
    badges: number;
    memberBadges: number;
    events: number;
    attendance: number;
    surveys: number;
    surveyResponses: number;
    demoSlots: number;
    pendingUsers: number;
    lumaWebhooks: number;
}

/**
 * Main migration function
 */
async function migrate() {
    console.log('🚀 Starting MongoDB to PostgreSQL migration...\n');

    const stats: MigrationStats = {
        profiles: 0,
        projects: 0,
        badges: 0,
        memberBadges: 0,
        events: 0,
        attendance: 0,
        surveys: 0,
        surveyResponses: 0,
        demoSlots: 0,
        pendingUsers: 0,
        lumaWebhooks: 0
    };

    // Connect to MongoDB
    console.log('📦 Connecting to MongoDB...');
    const mongoClient = new MongoClient(process.env.MONGODB_URI!);
    await mongoClient.connect();
    const mongodb = mongoClient.db();
    console.log('✅ Connected to MongoDB\n');

    // Connect to PostgreSQL
    console.log('🐘 Connecting to PostgreSQL...');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool, { schema });
    console.log('✅ Connected to PostgreSQL\n');

    try {
        // Map MongoDB ObjectIds to PostgreSQL UUIDs
        const idMap = new Map<string, string>();

        // Helper function to generate UUID and map it
        const mapId = (mongoId: ObjectId | string): string => {
            const mongoIdStr = mongoId.toString();
            if (!idMap.has(mongoIdStr)) {
                idMap.set(mongoIdStr, crypto.randomUUID());
            }
            return idMap.get(mongoIdStr)!;
        };

        // ============================================================================
        // 1. Migrate Profiles
        // ============================================================================
        console.log('👤 Migrating profiles...');
        const mongoProfiles = await mongodb
            .collection('profiles')
            .find()
            .toArray();

        for (const profile of mongoProfiles) {
            const pgId = mapId(profile._id);

            await db.insert(schema.profiles).values({
                id: pgId,
                clerkUserId: profile.clerkUserId || null,
                lumaEmail: profile.lumaEmail,
                verificationStatus: profile.verificationStatus || 'pending',
                isAppAdmin: profile.isAppAdmin || false,
                lumaAttendeeId: profile.lumaAttendeeId || null,
                bio: profile.bio || null,
                skills: profile.skills || [],
                githubUsername: profile.githubUsername || null,
                twitterHandle: profile.twitterHandle || null,
                websiteUrl: profile.websiteUrl || null,
                role: profile.role || null,
                seekingFunding: profile.seekingFunding || false,
                openToMentoring: profile.openToMentoring || false,
                streakCount: profile.streakCount || 0,
                onboardingDismissed: profile.onboardingDismissed || false,
                createdAt: profile.createdAt || new Date(),
                updatedAt: profile.updatedAt || new Date()
            });

            stats.profiles++;
        }
        console.log(`✅ Migrated ${stats.profiles} profiles\n`);

        // ============================================================================
        // 2. Migrate Projects
        // ============================================================================
        console.log('🚀 Migrating projects...');
        const mongoProjects = await mongodb
            .collection('projects')
            .find()
            .toArray();

        for (const project of mongoProjects) {
            const pgId = mapId(project._id);
            const memberPgId = mapId(project.memberId);

            await db.insert(schema.projects).values({
                id: pgId,
                memberId: memberPgId,
                title: project.title,
                description: project.description || null,
                tags: project.tags || [],
                imageUrls: project.imageUrls || [],
                githubUrl: project.githubUrl || null,
                publicUrl: project.publicUrl || null,
                createdAt: project.createdAt || new Date(),
                updatedAt: project.updatedAt || new Date()
            });

            stats.projects++;
        }
        console.log(`✅ Migrated ${stats.projects} projects\n`);

        // ============================================================================
        // 3. Migrate Badges
        // ============================================================================
        console.log('🏅 Migrating badges...');
        const mongoBadges = await mongodb.collection('badges').find().toArray();

        for (const badge of mongoBadges) {
            const pgId = mapId(badge._id);

            await db.insert(schema.badges).values({
                id: pgId,
                name: badge.name,
                iconAscii: badge.iconAscii || badge.icon || '',
                criteria: badge.criteria,
                createdAt: badge.createdAt || new Date()
            });

            stats.badges++;
        }
        console.log(`✅ Migrated ${stats.badges} badges\n`);

        // ============================================================================
        // 4. Migrate Member Badges
        // ============================================================================
        console.log('🎖️  Migrating member badges...');
        const mongoMemberBadges = await mongodb
            .collection('member_badges')
            .find()
            .toArray();

        for (const memberBadge of mongoMemberBadges) {
            const memberPgId = mapId(memberBadge.memberId);
            const badgePgId = mapId(memberBadge.badgeId);

            await db.insert(schema.memberBadges).values({
                memberId: memberPgId,
                badgeId: badgePgId,
                awardedAt: memberBadge.awardedAt || new Date()
            });

            stats.memberBadges++;
        }
        console.log(`✅ Migrated ${stats.memberBadges} member badges\n`);

        // ============================================================================
        // 5. Migrate Events
        // ============================================================================
        console.log('📅 Migrating events...');
        const mongoEvents = await mongodb.collection('events').find().toArray();

        for (const event of mongoEvents) {
            const pgId = mapId(event._id);

            await db.insert(schema.events).values({
                id: pgId,
                lumaEventId: event.lumaEventId,
                name: event.name,
                description: event.description || null,
                coverUrl: event.coverUrl || null,
                url: event.url,
                startAt: event.startAt || new Date(),
                endAt: event.endAt || null,
                timezone: event.timezone || 'America/New_York',
                location: event.location || null,
                stats: event.stats || { registered: 0, checkedIn: 0 },
                isCanceled: event.isCanceled || false,
                lastSyncedAt: event.lastSyncedAt || new Date(),
                createdAt: event.createdAt || new Date(),
                updatedAt: event.updatedAt || new Date()
            });

            stats.events++;
        }
        console.log(`✅ Migrated ${stats.events} events\n`);

        // ============================================================================
        // 6. Migrate Attendance
        // ============================================================================
        console.log('✔️  Migrating attendance records...');
        const mongoAttendance = await mongodb
            .collection('attendance')
            .find()
            .toArray();

        for (const attendance of mongoAttendance) {
            const pgId = mapId(attendance._id);
            const memberPgId = mapId(attendance.memberId);

            await db.insert(schema.attendance).values({
                id: pgId,
                memberId: memberPgId,
                lumaEventId: attendance.lumaEventId,
                status: attendance.status || 'registered',
                checkedInAt: attendance.checkedInAt || null,
                createdAt: attendance.createdAt || new Date()
            });

            stats.attendance++;
        }
        console.log(`✅ Migrated ${stats.attendance} attendance records\n`);

        // ============================================================================
        // 7. Migrate Surveys
        // ============================================================================
        console.log('📋 Migrating surveys...');
        const mongoSurveys = await mongodb
            .collection('surveys')
            .find()
            .toArray();

        for (const survey of mongoSurveys) {
            const pgId = mapId(survey._id);

            await db.insert(schema.surveys).values({
                id: pgId,
                slug: survey.slug,
                title: survey.title,
                description: survey.description,
                type: survey.type as 'onboarding' | 'annual' | 'event',
                isActive: survey.isActive ?? true,
                questions: survey.questions || [],
                createdAt: survey.createdAt || new Date(),
                updatedAt: survey.updatedAt || new Date()
            });

            stats.surveys++;
        }
        console.log(`✅ Migrated ${stats.surveys} surveys\n`);

        // ============================================================================
        // 8. Migrate Survey Responses
        // ============================================================================
        console.log('📝 Migrating survey responses...');
        const mongoSurveyResponses = await mongodb
            .collection('survey_responses')
            .find()
            .toArray();

        for (const response of mongoSurveyResponses) {
            const pgId = mapId(response._id);
            const surveyPgId = mapId(response.surveyId);
            const memberPgId = mapId(response.memberId);

            await db.insert(schema.surveyResponses).values({
                id: pgId,
                surveyId: surveyPgId,
                memberId: memberPgId,
                responses: response.responses || {},
                isComplete: response.isComplete ?? false,
                submittedAt: response.submittedAt || new Date(),
                createdAt: response.createdAt || new Date(),
                updatedAt: response.updatedAt || new Date()
            });

            stats.surveyResponses++;
        }
        console.log(`✅ Migrated ${stats.surveyResponses} survey responses\n`);

        // ============================================================================
        // 9. Migrate Demo Slots
        // ============================================================================
        console.log('🎤 Migrating demo slots...');
        const mongoDemoSlots = await mongodb
            .collection('demo_slots')
            .find()
            .toArray();

        for (const slot of mongoDemoSlots) {
            const pgId = mapId(slot._id);
            const memberPgId = mapId(slot.memberId);
            const eventPgId = mapId(slot.eventId);

            await db.insert(schema.demoSlots).values({
                id: pgId,
                memberId: memberPgId,
                eventId: eventPgId,
                title: slot.title,
                description: slot.description || null,
                requestedTime: slot.requestedTime || null,
                durationMinutes: slot.durationMinutes || 5,
                status: slot.status || 'pending',
                confirmedByOrganizer: slot.confirmedByOrganizer || false,
                createdAt: slot.createdAt || new Date(),
                updatedAt: slot.updatedAt || new Date()
            });

            stats.demoSlots++;
        }
        console.log(`✅ Migrated ${stats.demoSlots} demo slots\n`);

        // ============================================================================
        // 10. Migrate Pending Users
        // ============================================================================
        console.log('⏳ Migrating pending users...');
        const mongoPendingUsers = await mongodb
            .collection('pending_users')
            .find()
            .toArray();

        for (const user of mongoPendingUsers) {
            const pgId = mapId(user._id);

            await db.insert(schema.pendingUsers).values({
                id: pgId,
                email: user.email,
                name: user.name,
                lumaAttendeeId: user.lumaAttendeeId,
                subscribedAt: user.subscribedAt || new Date(),
                approvedAt: user.approvedAt || null,
                createdAt: user.createdAt || new Date(),
                updatedAt: user.updatedAt || new Date()
            });

            stats.pendingUsers++;
        }
        console.log(`✅ Migrated ${stats.pendingUsers} pending users\n`);

        // ============================================================================
        // 11. Migrate Luma Webhooks (for audit/debugging)
        // ============================================================================
        console.log('🔔 Migrating Luma webhooks...');
        const mongoWebhooks = await mongodb
            .collection('luma_webhooks')
            .find()
            .toArray();

        for (const webhook of mongoWebhooks) {
            const pgId = mapId(webhook._id);

            await db.insert(schema.lumaWebhooks).values({
                id: pgId,
                type: webhook.type,
                payload: webhook.payload,
                signature: webhook.signature || null,
                receivedAt: webhook.receivedAt || new Date()
            });

            stats.lumaWebhooks++;
        }
        console.log(`✅ Migrated ${stats.lumaWebhooks} Luma webhooks\n`);

        // ============================================================================
        // Migration Summary
        // ============================================================================
        console.log('\n📊 Migration Summary:');
        console.log('═'.repeat(50));
        Object.entries(stats).forEach(([key, count]) => {
            console.log(`  ${key.padEnd(20)} : ${count}`);
        });
        console.log('═'.repeat(50));
        console.log('\n✅ Migration completed successfully!');
    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        throw error;
    } finally {
        await mongoClient.close();
        await pool.end();
        console.log('\n🔌 Database connections closed');
    }
}

// Run the migration
migrate()
    .then(() => {
        process.exit(0);
    })
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
