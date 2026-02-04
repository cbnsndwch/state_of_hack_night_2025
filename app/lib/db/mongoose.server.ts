/**
 * Mongoose connection and model initialization
 * Server-side only (.server.ts suffix)
 */

import mongoose from 'mongoose';

// ============================================================================
// Connection Management
// ============================================================================

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'hello_miami';

if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not defined');
}

// Cache the mongoose connection to reuse across hot reloads in development
declare global {
    var __mongoose: {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
    };
}

let cached = global.__mongoose || { conn: null, promise: null };

if (!global.__mongoose) {
    global.__mongoose = cached;
}

/**
 * Get or create the Mongoose connection
 */
export async function connectToDatabase() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            dbName: MONGODB_DB_NAME,
            bufferCommands: false
        };

        cached.promise = mongoose.connect(MONGODB_URI, opts);
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}

// ============================================================================
// Schema Definitions
// ============================================================================

const { Schema } = mongoose;

// Profile Schema
const ProfileSchema = new Schema(
    {
        clerkUserId: {
            type: String,
            required: false,
            unique: true,
            sparse: true
        },
        lumaEmail: { type: String, required: true, unique: true },
        verificationStatus: {
            type: String,
            enum: ['pending', 'verified'],
            default: 'pending'
        },
        isAppAdmin: { type: Boolean, default: false },
        lumaAttendeeId: { type: String, default: null },
        bio: { type: String, default: null },
        skills: { type: [String], default: [] },
        githubUsername: { type: String, default: null },
        twitterHandle: { type: String, default: null },
        websiteUrl: { type: String, default: null },
        role: { type: String, default: null },
        seekingFunding: { type: Boolean, default: false },
        openToMentoring: { type: Boolean, default: false },
        streakCount: { type: Number, default: 0 },
        onboardingDismissed: { type: Boolean, default: false }
    },
    {
        timestamps: true,
        collection: 'profiles'
    }
);

// Create indexes
ProfileSchema.index({ clerkUserId: 1 });
ProfileSchema.index({ lumaEmail: 1 });
ProfileSchema.index({ lumaAttendeeId: 1 });

// Project Schema
const ProjectSchema = new Schema(
    {
        memberId: {
            type: Schema.Types.ObjectId,
            ref: 'Profile',
            required: true
        },
        title: { type: String, required: true },
        description: { type: String, default: null },
        tags: { type: [String], default: [] },
        imageUrls: { type: [String], default: [] },
        githubUrl: { type: String, default: null },
        publicUrl: { type: String, default: null }
    },
    {
        timestamps: true,
        collection: 'projects'
    }
);

ProjectSchema.index({ memberId: 1 });

// Badge Schema
const BadgeSchema = new Schema(
    {
        name: { type: String, required: true, unique: true },
        iconAscii: { type: String, required: true },
        criteria: { type: String, required: true }
    },
    {
        timestamps: true,
        collection: 'badges'
    }
);

// MemberBadge Schema
const MemberBadgeSchema = new Schema(
    {
        memberId: {
            type: Schema.Types.ObjectId,
            ref: 'Profile',
            required: true
        },
        badgeId: { type: Schema.Types.ObjectId, ref: 'Badge', required: true },
        awardedAt: { type: Date, default: Date.now }
    },
    {
        timestamps: false,
        collection: 'member_badges'
    }
);

MemberBadgeSchema.index({ memberId: 1, badgeId: 1 }, { unique: true });

// Attendance Schema
const AttendanceSchema = new Schema(
    {
        memberId: {
            type: Schema.Types.ObjectId,
            ref: 'Profile',
            required: true
        },
        lumaEventId: { type: String, required: true },
        status: {
            type: String,
            enum: ['registered', 'checked-in'],
            required: true
        },
        checkedInAt: { type: Date, default: null }
    },
    {
        timestamps: true,
        collection: 'attendance'
    }
);

AttendanceSchema.index({ memberId: 1, lumaEventId: 1 }, { unique: true });

// PendingUser Schema
const PendingUserSchema = new Schema(
    {
        email: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        lumaAttendeeId: { type: String, required: true },
        subscribedAt: { type: Date, default: Date.now },
        approvedAt: { type: Date, default: null }
    },
    {
        timestamps: true,
        collection: 'pending_users'
    }
);

PendingUserSchema.index({ email: 1 });
PendingUserSchema.index({ lumaAttendeeId: 1 });

// LumaWebhook Schema
const LumaWebhookSchema = new Schema(
    {
        type: { type: String, required: true },
        payload: { type: Schema.Types.Mixed, required: true },
        signature: { type: String },
        receivedAt: { type: Date, default: Date.now }
    },
    {
        timestamps: false,
        collection: 'luma_webhooks'
    }
);

// Survey Schema
const SurveySchema = new Schema(
    {
        slug: { type: String, required: true, unique: true },
        title: { type: String, required: true },
        description: { type: String, required: true },
        type: {
            type: String,
            enum: ['onboarding', 'annual', 'event'],
            required: true
        },
        isActive: { type: Boolean, default: true },
        questions: {
            type: [
                {
                    id: { type: String, required: true },
                    text: { type: String, required: true },
                    type: {
                        type: String,
                        enum: [
                            'text',
                            'textarea',
                            'single-choice',
                            'multiple-choice',
                            'scale',
                            'boolean'
                        ],
                        required: true
                    },
                    required: { type: Boolean, default: false },
                    options: { type: [String] },
                    scale: {
                        type: {
                            min: Number,
                            max: Number,
                            minLabel: String,
                            maxLabel: String
                        }
                    },
                    helpText: { type: String }
                }
            ],
            required: true
        }
    },
    {
        timestamps: true,
        collection: 'surveys'
    }
);

// SurveyResponse Schema
const SurveyResponseSchema = new Schema(
    {
        surveyId: {
            type: Schema.Types.ObjectId,
            ref: 'Survey',
            required: true
        },
        memberId: {
            type: Schema.Types.ObjectId,
            ref: 'Profile',
            required: true
        },
        responses: { type: Schema.Types.Mixed, required: true },
        isComplete: { type: Boolean, default: false },
        submittedAt: { type: Date, default: Date.now }
    },
    {
        timestamps: true,
        collection: 'survey_responses'
    }
);

SurveyResponseSchema.index({ surveyId: 1, memberId: 1 }, { unique: true });

// Event Schema
const EventSchema = new Schema(
    {
        lumaEventId: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        description: { type: String, default: null },
        coverUrl: { type: String, default: null },
        url: { type: String, required: true },
        startAt: { type: Date, required: true },
        endAt: { type: Date, default: null },
        timezone: { type: String, required: true },
        location: {
            type: {
                type: { type: String },
                name: { type: String, default: null },
                address: { type: String, default: null },
                lat: { type: Number, default: null },
                lng: { type: Number, default: null }
            },
            default: null
        },
        stats: {
            type: {
                registered: { type: Number, default: 0 },
                checkedIn: { type: Number, default: 0 }
            },
            default: { registered: 0, checkedIn: 0 }
        },
        isCanceled: { type: Boolean, default: false },
        lastSyncedAt: { type: Date, default: Date.now }
    },
    {
        timestamps: true,
        collection: 'events'
    }
);

EventSchema.index({ lumaEventId: 1 });
EventSchema.index({ startAt: 1 });

// DemoSlot Schema
const DemoSlotSchema = new Schema(
    {
        memberId: {
            type: Schema.Types.ObjectId,
            ref: 'Profile',
            required: true
        },
        eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
        title: { type: String, required: true },
        description: { type: String, default: null },
        requestedTime: { type: String, default: null },
        durationMinutes: { type: Number, default: 5 },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'canceled'],
            default: 'pending'
        },
        confirmedByOrganizer: { type: Boolean, default: false }
    },
    {
        timestamps: true,
        collection: 'demo_slots'
    }
);

DemoSlotSchema.index({ eventId: 1, memberId: 1 });

// ============================================================================
// Model Registration
// ============================================================================

// Helper to get or create model (prevents OverwriteModelError in development)
function getModel<T>(name: string, schema: mongoose.Schema) {
    if (mongoose.models[name]) {
        return mongoose.models[name] as mongoose.Model<T>;
    }
    return mongoose.model<T>(name, schema);
}

// Export models
export const ProfileModel = getModel('Profile', ProfileSchema);
export const ProjectModel = getModel('Project', ProjectSchema);
export const BadgeModel = getModel('Badge', BadgeSchema);
export const MemberBadgeModel = getModel('MemberBadge', MemberBadgeSchema);
export const AttendanceModel = getModel('Attendance', AttendanceSchema);
export const PendingUserModel = getModel('PendingUser', PendingUserSchema);
export const LumaWebhookModel = getModel('LumaWebhook', LumaWebhookSchema);
export const SurveyModel = getModel('Survey', SurveySchema);
export const SurveyResponseModel = getModel(
    'SurveyResponse',
    SurveyResponseSchema
);
export const EventModel = getModel('Event', EventSchema);
export const DemoSlotModel = getModel('DemoSlot', DemoSlotSchema);
