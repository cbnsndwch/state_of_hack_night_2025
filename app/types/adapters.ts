/**
 * Adapter interface types for Hello Miami community data.
 * These types represent the data layer after Postgres migration.
 */

// ============================================================================
// Profile - Links to Clerk auth users
// ============================================================================

export interface Profile {
    id: string;
    /** Clerk auth user ID - may be null before first login */
    clerkUserId: string | null;
    /** Email used in Luma registration */
    lumaEmail: string;
    /** Verification status */
    verificationStatus: 'pending' | 'verified';
    /** Whether this user is an app admin (calendar administrator) */
    isAppAdmin: boolean;
    lumaAttendeeId: string | null;
    bio: string | null;
    /** Skills and areas of expertise (e.g., ["Python", "React", "Hardware"]) */
    skills: string[];
    /** GitHub username */
    githubUsername: string | null;
    /** Twitter/X handle */
    twitterHandle: string | null;
    /** Personal or portfolio website */
    websiteUrl: string | null;
    /** LinkedIn profile URL */
    linkedinUrl: string | null;
    /** Current role/occupation */
    role: string | null;
    /** Whether seeking funding for projects */
    seekingFunding: boolean;
    /** Whether interested in mentoring others */
    openToMentoring: boolean;
    /** Looking for a co-founder */
    lookingForCofounder: boolean;
    /** Wants product feedback from the community */
    wantProductFeedback: boolean;
    /** Seeking VC / angel / accelerator intros */
    seekingAcceleratorIntros: boolean;
    /** Wants to give back to the community */
    wantToGiveBack: boolean;
    /** Specialties (e.g., software, hardware, AI) */
    specialties: string[];
    /** Preferred community experiences */
    interestedExperiences: string[];
    streakCount: number;
    /** Whether user has dismissed the onboarding checklist */
    onboardingDismissed: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface ProfileInsert {
    clerkUserId: string | null;
    lumaEmail: string;
    verificationStatus?: 'pending' | 'verified';
    isAppAdmin?: boolean;
    lumaAttendeeId?: string | null;
    bio?: string | null;
    skills?: string[];
    githubUsername?: string | null;
    twitterHandle?: string | null;
    websiteUrl?: string | null;
    linkedinUrl?: string | null;
    role?: string | null;
    seekingFunding?: boolean;
    openToMentoring?: boolean;
    lookingForCofounder?: boolean;
    wantProductFeedback?: boolean;
    seekingAcceleratorIntros?: boolean;
    wantToGiveBack?: boolean;
    specialties?: string[];
    interestedExperiences?: string[];
    streakCount?: number;
    onboardingDismissed?: boolean;
}

export interface ProfileUpdate {
    lumaEmail?: string;
    verificationStatus?: 'pending' | 'verified';
    isAppAdmin?: boolean;
    lumaAttendeeId?: string | null;
    clerkUserId?: string | null;
    bio?: string | null;
    skills?: string[];
    githubUsername?: string | null;
    twitterHandle?: string | null;
    websiteUrl?: string | null;
    linkedinUrl?: string | null;
    role?: string | null;
    seekingFunding?: boolean;
    openToMentoring?: boolean;
    lookingForCofounder?: boolean;
    wantProductFeedback?: boolean;
    seekingAcceleratorIntros?: boolean;
    wantToGiveBack?: boolean;
    specialties?: string[];
    interestedExperiences?: string[];
    streakCount?: number;
    onboardingDismissed?: boolean;
}

// ============================================================================
// Project - Showcase of hacks built by members
// ============================================================================

export interface Project {
    id: string;
    /** Reference to Profile.id */
    memberId: string;
    title: string;
    description: string | null;
    tags: string[];
    imageUrls: string[];
    githubUrl: string | null;
    publicUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface ProjectInsert {
    memberId: string;
    title: string;
    description?: string | null;
    tags?: string[];
    imageUrls?: string[];
    githubUrl?: string | null;
    publicUrl?: string | null;
}

export interface ProjectUpdate {
    title?: string;
    description?: string | null;
    tags?: string[];
    imageUrls?: string[];
    githubUrl?: string | null;
    publicUrl?: string | null;
}

// ============================================================================
// Badge - Definitions for ASCII badges
// ============================================================================

export interface Badge {
    id: string;
    name: string;
    iconAscii: string;
    criteria: string;
    createdAt: Date;
}

export interface BadgeInsert {
    name: string;
    iconAscii: string;
    criteria: string;
}

// ============================================================================
// MemberBadge - Assignment of badges to members
// ============================================================================

export interface MemberBadge {
    id: string;
    /** Reference to Profile.id */
    memberId: string;
    /** Reference to Badge.id */
    badgeId: string;
    awardedAt: Date;
}

export interface MemberBadgeInsert {
    memberId: string;
    badgeId: string;
}

// ============================================================================
// Attendance - Tracks event participation
// ============================================================================

export type AttendanceStatus = 'registered' | 'checked-in';

export interface Attendance {
    id: string;
    /** Reference to Profile.id */
    memberId: string;
    lumaEventId: string;
    status: AttendanceStatus;
    checkedInAt: Date | null;
    createdAt: Date;
}

export interface AttendanceInsert {
    memberId: string;
    lumaEventId: string;
    status: AttendanceStatus;
    checkedInAt?: Date | null;
}

export interface AttendanceUpdate {
    status?: AttendanceStatus;
    checkedInAt?: Date | null;
}

// ============================================================================
// PendingUser - Users who subscribed to calendar but not yet approved
// ============================================================================

export interface PendingUser {
    id: string;
    /** Email from Luma subscription */
    email: string;
    /** Name from Luma subscription */
    name: string;
    /** Luma attendee ID */
    lumaAttendeeId: string;
    /** When they subscribed to the calendar */
    subscribedAt: Date;
    /** When they were approved (null if not approved) */
    approvedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface PendingUserInsert {
    email: string;
    name: string;
    lumaAttendeeId: string;
    subscribedAt?: Date;
    approvedAt?: Date | null;
}

export interface PendingUserUpdate {
    name?: string;
    lumaAttendeeId?: string;
    subscribedAt?: Date;
    approvedAt?: Date | null;
}

// ============================================================================
// LumaWebhook - Raw webhook data for audit/debugging
// ============================================================================

export interface LumaWebhook {
    id: string;
    /** Webhook type (e.g., 'calendar.person.subscribed') */
    type: string;
    /** Raw webhook payload */
    payload: Record<string, unknown>;
    /** Webhook signature (if provided) */
    signature?: string;
    /** When webhook was received */
    receivedAt: Date;
}

export interface LumaWebhookInsert {
    type: string;
    payload: Record<string, unknown>;
    signature?: string;
}

// ============================================================================
// Aggregated types for API responses (with populated references)
// ============================================================================

export interface ProjectWithMember extends Omit<Project, 'memberId'> {
    member: Pick<Profile, 'id' | 'clerkUserId' | 'bio' | 'lumaEmail'>;
}

export interface ProfileWithBadges extends Profile {
    badges: Badge[];
}

// ============================================================================
// Survey - Survey definitions and questions
// ============================================================================

export type SurveyType = 'onboarding' | 'annual' | 'event';

export type SurveyQuestionType =
    | 'text'
    | 'textarea'
    | 'single-choice'
    | 'multiple-choice'
    | 'scale'
    | 'boolean';

export interface SurveyQuestion {
    /** Unique question ID within the survey */
    id: string;
    /** Question text */
    text: string;
    /** Question type */
    type: SurveyQuestionType;
    /** Whether question is required */
    required: boolean;
    /** Options for choice questions */
    options?: string[];
    /** Min/max for scale questions */
    scale?: {
        min: number;
        max: number;
        minLabel?: string;
        maxLabel?: string;
    };
    /** Help text or description */
    helpText?: string;
}

export interface Survey {
    id: string;
    /** Survey identifier (e.g., "onboarding-2026", "annual-2026") */
    slug: string;
    title: string;
    description: string;
    /** Survey type */
    type: SurveyType;
    /** Whether survey is currently active */
    isActive: boolean;
    /** Survey questions configuration */
    questions: SurveyQuestion[];
    createdAt: Date;
    updatedAt: Date;
}

export interface SurveyInsert {
    slug: string;
    title: string;
    description: string;
    type: SurveyType;
    isActive?: boolean;
    questions: SurveyQuestion[];
}

export interface SurveyUpdate {
    slug?: string;
    title?: string;
    description?: string;
    type?: SurveyType;
    isActive?: boolean;
    questions?: SurveyQuestion[];
}

// ============================================================================
// SurveyResponse - Member responses to surveys
// ============================================================================

export type SurveyAnswer =
    | { type: 'text'; value: string }
    | { type: 'textarea'; value: string }
    | { type: 'single-choice'; value: string }
    | { type: 'multiple-choice'; value: string[] }
    | { type: 'scale'; value: number }
    | { type: 'boolean'; value: boolean };

export interface SurveyResponse {
    id: string;
    /** Reference to Survey.id */
    surveyId: string;
    /** Reference to Profile.id */
    memberId: string;
    /** Responses keyed by question ID */
    responses: Record<string, SurveyAnswer>;
    /** Whether response is complete */
    isComplete: boolean;
    submittedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface SurveyResponseInsert {
    surveyId: string;
    memberId: string;
    responses?: Record<string, SurveyAnswer>;
    isComplete?: boolean;
    submittedAt?: Date;
}

export interface SurveyResponseUpdate {
    responses?: Record<string, SurveyAnswer>;
    isComplete?: boolean;
    submittedAt?: Date;
}

// ============================================================================
// Aggregated survey types
// ============================================================================

export interface SurveyWithResponseCount extends Survey {
    responseCount: number;
}

export interface SurveyResponseWithProfile extends Omit<
    SurveyResponse,
    'memberId'
> {
    member: Pick<Profile, 'id' | 'lumaEmail' | 'githubUsername'>;
}

// ============================================================================
// Event - Synced events from Luma calendar
// ============================================================================

export interface Event {
    id: string;
    /** Luma event API ID (e.g., "evt-xxxxxxxxxxxxx") */
    lumaEventId: string;
    /** Event name/title */
    name: string;
    /** Event description (can contain markdown/HTML) */
    description: string | null;
    /** Event cover image URL */
    coverUrl: string | null;
    /** Event URL on lu.ma */
    url: string;
    /** Start time (ISO 8601 datetime) */
    startAt: Date;
    /** End time (ISO 8601 datetime) */
    endAt: Date | null;
    /** Timezone identifier (e.g., "America/New_York") */
    timezone: string;
    /** Event location */
    location: {
        /** Location type (e.g., "in_person", "online", "tbd") */
        type: string;
        /** Venue name */
        name: string | null;
        /** Full address */
        address: string | null;
        /** Latitude */
        lat: number | null;
        /** Longitude */
        lng: number | null;
    } | null;
    /** Registration counts */
    stats: {
        /** Number of registered guests */
        registered: number;
        /** Number of checked-in guests */
        checkedIn: number;
    };
    /** Whether event is canceled */
    isCanceled: boolean;
    /** Last time this event was synced from Luma */
    lastSyncedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface EventInsert {
    lumaEventId: string;
    name: string;
    description?: string | null;
    coverUrl?: string | null;
    url: string;
    startAt: Date;
    endAt?: Date | null;
    timezone: string;
    location?: {
        type: string;
        name: string | null;
        address: string | null;
        lat: number | null;
        lng: number | null;
    } | null;
    stats?: {
        registered: number;
        checkedIn: number;
    };
    isCanceled?: boolean;
    lastSyncedAt?: Date;
}

export interface EventUpdate {
    name?: string;
    description?: string | null;
    coverUrl?: string | null;
    url?: string;
    startAt?: Date;
    endAt?: Date | null;
    timezone?: string;
    location?: {
        type: string;
        name: string | null;
        address: string | null;
        lat: number | null;
        lng: number | null;
    } | null;
    stats?: {
        registered: number;
        checkedIn: number;
    };
    isCanceled?: boolean;
    lastSyncedAt?: Date;
}

// ============================================================================
// DemoSlot - Demo presentations scheduled for hack nights
// ============================================================================

export interface DemoSlot {
    id: string;
    /** Reference to Profile.id of the presenter */
    memberId: string;
    /** Reference to Event.id for the hack night */
    eventId: string;
    /** Demo title/topic */
    title: string;
    /** Demo description */
    description: string | null;
    /** Requested start time within event (e.g., "8:30 PM") */
    requestedTime: string | null;
    /** Duration in minutes (default: 5) */
    durationMinutes: number;
    /** Current status of demo slot */
    status: 'pending' | 'confirmed' | 'canceled';
    /** Whether organizer has approved this slot */
    confirmedByOrganizer: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface DemoSlotInsert {
    memberId: string;
    eventId: string;
    title: string;
    description?: string | null;
    requestedTime?: string | null;
    durationMinutes?: number;
    status?: 'pending' | 'confirmed' | 'canceled';
    confirmedByOrganizer?: boolean;
}

export interface DemoSlotUpdate {
    title?: string;
    description?: string | null;
    requestedTime?: string | null;
    durationMinutes?: number;
    status?: 'pending' | 'confirmed' | 'canceled';
    confirmedByOrganizer?: boolean;
}

// ============================================================================
// Aggregated demo slot types
// ============================================================================

export interface DemoSlotWithMember extends Omit<DemoSlot, 'memberId'> {
    member: Pick<Profile, 'id' | 'lumaEmail' | 'githubUsername'>;
}

export interface DemoSlotWithEvent extends Omit<DemoSlot, 'eventId'> {
    event: Pick<Event, 'id' | 'name' | 'startAt' | 'endAt'>;
}
