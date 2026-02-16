/**
 * PostgreSQL Schema for Hello Miami Community Platform
 *
 * This schema defines the database structure for the hello_miami platform,
 * migrated from MongoDB to PostgreSQL for use with Zero Sync.
 */

import {
    pgTable,
    text,
    timestamp,
    boolean,
    integer,
    jsonb,
    uuid,
    primaryKey,
    index,
    unique
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// Profiles - User profiles linked to Clerk authentication
// ============================================================================

export const profiles = pgTable(
    'profiles',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        /** Clerk auth user ID - nullable for backward compatibility */
        clerkUserId: text('clerk_user_id'),
        /** Email used in Luma registration */
        lumaEmail: text('luma_email').notNull(),
        /** Verification status */
        verificationStatus: text('verification_status', {
            enum: ['pending', 'verified']
        })
            .notNull()
            .default('pending'),
        /** Whether this user is an app admin (calendar administrator) */
        isAppAdmin: boolean('is_app_admin').notNull().default(false),
        lumaAttendeeId: text('luma_attendee_id'),
        bio: text('bio'),
        /** Skills and areas of expertise */
        skills: jsonb('skills').$type<string[]>().notNull().default([]),
        githubUsername: text('github_username'),
        twitterHandle: text('twitter_handle'),
        websiteUrl: text('website_url'),
        role: text('role'),
        /** LinkedIn profile URL */
        linkedinUrl: text('linkedin_url'),
        seekingFunding: boolean('seeking_funding').notNull().default(false),
        openToMentoring: boolean('open_to_mentoring').notNull().default(false),
        /** Looking for a co-founder */
        lookingForCofounder: boolean('looking_for_cofounder')
            .notNull()
            .default(false),
        /** Wants product feedback from the community */
        wantProductFeedback: boolean('want_product_feedback')
            .notNull()
            .default(false),
        /** Seeking VC / angel / accelerator intros */
        seekingAcceleratorIntros: boolean('seeking_accelerator_intros')
            .notNull()
            .default(false),
        /** Wants to give back to the community */
        wantToGiveBack: boolean('want_to_give_back')
            .notNull()
            .default(false),
        /** Specialties from Luma (e.g., software, hardware, AI, etc.) */
        specialties: jsonb('specialties').$type<string[]>().notNull().default([]),
        /** Preferred community experiences */
        interestedExperiences: jsonb('interested_experiences')
            .$type<string[]>()
            .notNull()
            .default([]),
        streakCount: integer('streak_count').notNull().default(0),
        onboardingDismissed: boolean('onboarding_dismissed')
            .notNull()
            .default(false),
        createdAt: timestamp('created_at').notNull().defaultNow(),
        updatedAt: timestamp('updated_at').notNull().defaultNow()
    },
    table => ({
        clerkUserIdIdx: index('profiles_clerk_user_id_idx').on(
            table.clerkUserId
        ),
        lumaEmailIdx: index('profiles_luma_email_idx').on(table.lumaEmail),
        lumaAttendeeIdIdx: index('profiles_luma_attendee_id_idx').on(
            table.lumaAttendeeId
        ),
        githubUsernameIdx: index('profiles_github_username_idx').on(
            table.githubUsername
        ),
        lumaEmailUnique: unique('profiles_luma_email_unique').on(
            table.lumaEmail
        ),
        clerkUserIdUnique: unique('profiles_clerk_user_id_unique').on(
            table.clerkUserId
        )
    })
);

// ============================================================================
// Projects - Showcase of hacks built by members
// ============================================================================

export const projects = pgTable(
    'projects',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        /** Reference to profiles.id */
        memberId: uuid('member_id')
            .notNull()
            .references(() => profiles.id, { onDelete: 'cascade' }),
        title: text('title').notNull(),
        description: text('description'),
        tags: jsonb('tags').$type<string[]>().notNull().default([]),
        imageUrls: jsonb('image_urls').$type<string[]>().notNull().default([]),
        githubUrl: text('github_url'),
        publicUrl: text('public_url'),
        createdAt: timestamp('created_at').notNull().defaultNow(),
        updatedAt: timestamp('updated_at').notNull().defaultNow()
    },
    table => ({
        memberIdIdx: index('projects_member_id_idx').on(table.memberId)
    })
);

// ============================================================================
// Badges - Definitions for ASCII badges
// ============================================================================

export const badges = pgTable(
    'badges',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        name: text('name').notNull(),
        iconAscii: text('icon_ascii').notNull(),
        criteria: text('criteria').notNull(),
        createdAt: timestamp('created_at').notNull().defaultNow()
    },
    table => ({
        nameUnique: unique('badges_name_unique').on(table.name)
    })
);

// ============================================================================
// MemberBadges - Assignment of badges to members (junction table)
// ============================================================================

export const memberBadges = pgTable(
    'member_badges',
    {
        memberId: uuid('member_id')
            .notNull()
            .references(() => profiles.id, { onDelete: 'cascade' }),
        badgeId: uuid('badge_id')
            .notNull()
            .references(() => badges.id, { onDelete: 'cascade' }),
        awardedAt: timestamp('awarded_at').notNull().defaultNow()
    },
    table => ({
        pk: primaryKey({ columns: [table.memberId, table.badgeId] }),
        memberIdIdx: index('member_badges_member_id_idx').on(table.memberId),
        badgeIdIdx: index('member_badges_badge_id_idx').on(table.badgeId)
    })
);

// ============================================================================
// Events - Synced events from Luma calendar
// ============================================================================

export const events = pgTable(
    'events',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        /** Luma event API ID (e.g., "evt-xxxxxxxxxxxxx") */
        lumaEventId: text('luma_event_id').notNull(),
        name: text('name').notNull(),
        description: text('description'),
        coverUrl: text('cover_url'),
        url: text('url').notNull(),
        startAt: timestamp('start_at').notNull(),
        endAt: timestamp('end_at'),
        timezone: text('timezone').notNull(),
        /** Event location stored as JSONB */
        location: jsonb('location').$type<{
            type: string;
            name: string | null;
            address: string | null;
            lat: number | null;
            lng: number | null;
        } | null>(),
        /** Registration statistics */
        stats: jsonb('stats')
            .$type<{
                registered: number;
                checkedIn: number;
            }>()
            .notNull()
            .default({ registered: 0, checkedIn: 0 }),
        isCanceled: boolean('is_canceled').notNull().default(false),
        lastSyncedAt: timestamp('last_synced_at').notNull().defaultNow(),
        createdAt: timestamp('created_at').notNull().defaultNow(),
        updatedAt: timestamp('updated_at').notNull().defaultNow()
    },
    table => ({
        lumaEventIdUnique: unique('events_luma_event_id_unique').on(
            table.lumaEventId
        ),
        startAtIdx: index('events_start_at_idx').on(table.startAt)
    })
);

// ============================================================================
// Attendance - Tracks event participation
// ============================================================================

export const attendance = pgTable(
    'attendance',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        /** Reference to profiles.id */
        memberId: uuid('member_id')
            .notNull()
            .references(() => profiles.id, { onDelete: 'cascade' }),
        /** Luma event ID (stored directly, not a foreign key to events table) */
        lumaEventId: text('luma_event_id').notNull(),
        status: text('status', {
            enum: ['registered', 'checked-in']
        })
            .notNull()
            .default('registered'),
        checkedInAt: timestamp('checked_in_at'),
        createdAt: timestamp('created_at').notNull().defaultNow()
    },
    table => ({
        memberIdIdx: index('attendance_member_id_idx').on(table.memberId),
        lumaEventIdIdx: index('attendance_luma_event_id_idx').on(
            table.lumaEventId
        ),
        memberEventUnique: unique('attendance_member_event_unique').on(
            table.memberId,
            table.lumaEventId
        )
    })
);

// ============================================================================
// PendingUsers - Users who subscribed to calendar but not yet approved
// ============================================================================

export const pendingUsers = pgTable(
    'pending_users',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        email: text('email').notNull(),
        name: text('name').notNull(),
        lumaAttendeeId: text('luma_attendee_id').notNull(),
        subscribedAt: timestamp('subscribed_at').notNull().defaultNow(),
        approvedAt: timestamp('approved_at'),
        createdAt: timestamp('created_at').notNull().defaultNow(),
        updatedAt: timestamp('updated_at').notNull().defaultNow()
    },
    table => ({
        emailUnique: unique('pending_users_email_unique').on(table.email),
        lumaAttendeeIdUnique: unique(
            'pending_users_luma_attendee_id_unique'
        ).on(table.lumaAttendeeId)
    })
);

// ============================================================================
// LumaWebhooks - Raw webhook data for audit/debugging
// ============================================================================

export const lumaWebhooks = pgTable('luma_webhooks', {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Webhook type (e.g., 'calendar.person.subscribed') */
    type: text('type').notNull(),
    /** Raw webhook payload */
    payload: jsonb('payload').notNull(),
    /** Webhook signature (if provided) */
    signature: text('signature'),
    receivedAt: timestamp('received_at').notNull().defaultNow()
});

// ============================================================================
// Surveys - Survey definitions and questions
// ============================================================================

export const surveys = pgTable(
    'surveys',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        /** Survey identifier (e.g., "onboarding-2026", "annual-2026") */
        slug: text('slug').notNull(),
        title: text('title').notNull(),
        description: text('description').notNull(),
        type: text('type', {
            enum: ['onboarding', 'annual', 'event']
        }).notNull(),
        isActive: boolean('is_active').notNull().default(true),
        /** Survey questions configuration stored as JSONB */
        questions: jsonb('questions')
            .$type<
                Array<{
                    id: string;
                    text: string;
                    type:
                        | 'text'
                        | 'textarea'
                        | 'single-choice'
                        | 'multiple-choice'
                        | 'scale'
                        | 'boolean';
                    required: boolean;
                    options?: string[];
                    scale?: {
                        min: number;
                        max: number;
                        minLabel?: string;
                        maxLabel?: string;
                    };
                    helpText?: string;
                }>
            >()
            .notNull(),
        createdAt: timestamp('created_at').notNull().defaultNow(),
        updatedAt: timestamp('updated_at').notNull().defaultNow()
    },
    table => ({
        slugUnique: unique('surveys_slug_unique').on(table.slug),
        typeIdx: index('surveys_type_idx').on(table.type),
        isActiveIdx: index('surveys_is_active_idx').on(table.isActive)
    })
);

// ============================================================================
// SurveyResponses - Member responses to surveys
// ============================================================================

export const surveyResponses = pgTable(
    'survey_responses',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        /** Reference to surveys.id */
        surveyId: uuid('survey_id')
            .notNull()
            .references(() => surveys.id, { onDelete: 'cascade' }),
        /** Reference to profiles.id */
        memberId: uuid('member_id')
            .notNull()
            .references(() => profiles.id, { onDelete: 'cascade' }),
        /** Responses keyed by question ID, stored as JSONB */
        responses: jsonb('responses')
            .$type<
                Record<
                    string,
                    | { type: 'text'; value: string }
                    | { type: 'textarea'; value: string }
                    | { type: 'single-choice'; value: string }
                    | { type: 'multiple-choice'; value: string[] }
                    | { type: 'scale'; value: number }
                    | { type: 'boolean'; value: boolean }
                >
            >()
            .notNull()
            .default({}),
        isComplete: boolean('is_complete').notNull().default(false),
        submittedAt: timestamp('submitted_at').notNull().defaultNow(),
        createdAt: timestamp('created_at').notNull().defaultNow(),
        updatedAt: timestamp('updated_at').notNull().defaultNow()
    },
    table => ({
        surveyIdIdx: index('survey_responses_survey_id_idx').on(table.surveyId),
        memberIdIdx: index('survey_responses_member_id_idx').on(table.memberId),
        surveyMemberUnique: unique('survey_responses_survey_member_unique').on(
            table.surveyId,
            table.memberId
        )
    })
);

// ============================================================================
// DemoSlots - Demo presentations scheduled for hack nights
// ============================================================================

export const demoSlots = pgTable(
    'demo_slots',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        /** Reference to profiles.id of the presenter */
        memberId: uuid('member_id')
            .notNull()
            .references(() => profiles.id, { onDelete: 'cascade' }),
        /** Reference to events.id for the hack night */
        eventId: uuid('event_id')
            .notNull()
            .references(() => events.id, { onDelete: 'cascade' }),
        title: text('title').notNull(),
        description: text('description'),
        requestedTime: text('requested_time'),
        durationMinutes: integer('duration_minutes').notNull().default(5),
        status: text('status', {
            enum: ['pending', 'confirmed', 'canceled']
        })
            .notNull()
            .default('pending'),
        confirmedByOrganizer: boolean('confirmed_by_organizer')
            .notNull()
            .default(false),
        createdAt: timestamp('created_at').notNull().defaultNow(),
        updatedAt: timestamp('updated_at').notNull().defaultNow()
    },
    table => ({
        memberIdIdx: index('demo_slots_member_id_idx').on(table.memberId),
        eventIdIdx: index('demo_slots_event_id_idx').on(table.eventId),
        statusIdx: index('demo_slots_status_idx').on(table.status)
    })
);

// ============================================================================
// Relations (for Drizzle ORM query capabilities)
// ============================================================================

export const profilesRelations = relations(profiles, ({ many }) => ({
    projects: many(projects),
    memberBadges: many(memberBadges),
    attendance: many(attendance),
    surveyResponses: many(surveyResponses),
    demoSlots: many(demoSlots)
}));

export const projectsRelations = relations(projects, ({ one }) => ({
    member: one(profiles, {
        fields: [projects.memberId],
        references: [profiles.id]
    })
}));

export const badgesRelations = relations(badges, ({ many }) => ({
    memberBadges: many(memberBadges)
}));

export const memberBadgesRelations = relations(memberBadges, ({ one }) => ({
    member: one(profiles, {
        fields: [memberBadges.memberId],
        references: [profiles.id]
    }),
    badge: one(badges, {
        fields: [memberBadges.badgeId],
        references: [badges.id]
    })
}));

export const eventsRelations = relations(events, ({ many }) => ({
    demoSlots: many(demoSlots)
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
    member: one(profiles, {
        fields: [attendance.memberId],
        references: [profiles.id]
    })
}));

export const surveysRelations = relations(surveys, ({ many }) => ({
    responses: many(surveyResponses)
}));

export const surveyResponsesRelations = relations(
    surveyResponses,
    ({ one }) => ({
        survey: one(surveys, {
            fields: [surveyResponses.surveyId],
            references: [surveys.id]
        }),
        member: one(profiles, {
            fields: [surveyResponses.memberId],
            references: [profiles.id]
        })
    })
);

export const demoSlotsRelations = relations(demoSlots, ({ one }) => ({
    member: one(profiles, {
        fields: [demoSlots.memberId],
        references: [profiles.id]
    }),
    event: one(events, {
        fields: [demoSlots.eventId],
        references: [events.id]
    })
}));
