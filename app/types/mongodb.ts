import type { ObjectId } from 'mongodb';

/**
 * MongoDB document types for Hello Miami community data.
 * These replace the Supabase database types.
 */

// ============================================================================
// Profile - Links to Supabase auth.users
// ============================================================================

export interface Profile {
    _id: ObjectId;
    /** Supabase auth user ID - may be null before first login */
    supabaseUserId: string | null;
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
    /** Current role/occupation */
    role: string | null;
    /** Whether seeking funding for projects */
    seekingFunding: boolean;
    /** Whether interested in mentoring others */
    openToMentoring: boolean;
    streakCount: number;
    /** Whether user has dismissed the onboarding checklist */
    onboardingDismissed: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface ProfileInsert {
    supabaseUserId: string | null;
    lumaEmail: string;
    verificationStatus?: 'pending' | 'verified';
    isAppAdmin?: boolean;
    lumaAttendeeId?: string | null;
    bio?: string | null;
    skills?: string[];
    githubUsername?: string | null;
    twitterHandle?: string | null;
    websiteUrl?: string | null;
    role?: string | null;
    seekingFunding?: boolean;
    openToMentoring?: boolean;
    streakCount?: number;
    onboardingDismissed?: boolean;
}

export interface ProfileUpdate {
    lumaEmail?: string;
    verificationStatus?: 'pending' | 'verified';
    isAppAdmin?: boolean;
    lumaAttendeeId?: string | null;
    supabaseUserId?: string | null;
    bio?: string | null;
    skills?: string[];
    githubUsername?: string | null;
    twitterHandle?: string | null;
    websiteUrl?: string | null;
    role?: string | null;
    seekingFunding?: boolean;
    openToMentoring?: boolean;
    streakCount?: number;
    onboardingDismissed?: boolean;
}

// ============================================================================
// Project - Showcase of hacks built by members
// ============================================================================

export interface Project {
    _id: ObjectId;
    /** Reference to Profile._id */
    memberId: ObjectId;
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
    memberId: ObjectId;
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
    _id: ObjectId;
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
    _id: ObjectId;
    /** Reference to Profile._id */
    memberId: ObjectId;
    /** Reference to Badge._id */
    badgeId: ObjectId;
    awardedAt: Date;
}

export interface MemberBadgeInsert {
    memberId: ObjectId;
    badgeId: ObjectId;
}

// ============================================================================
// Attendance - Tracks event participation
// ============================================================================

export type AttendanceStatus = 'registered' | 'checked-in';

export interface Attendance {
    _id: ObjectId;
    /** Reference to Profile._id */
    memberId: ObjectId;
    lumaEventId: string;
    status: AttendanceStatus;
    checkedInAt: Date | null;
    createdAt: Date;
}

export interface AttendanceInsert {
    memberId: ObjectId;
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
    _id: ObjectId;
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
    approvedAt?: Date | null;
}

// ============================================================================
// LumaWebhook - Raw webhook data for audit/debugging
// ============================================================================

export interface LumaWebhook {
    _id: ObjectId;
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
    member: Pick<Profile, '_id' | 'supabaseUserId' | 'bio' | 'lumaEmail'>;
}

export interface ProfileWithBadges extends Profile {
    badges: Badge[];
}
