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
    /** Supabase auth user ID */
    supabaseUserId: string;
    githubUid: string | null;
    lumaAttendeeId: string | null;
    bio: string | null;
    streakCount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface ProfileInsert {
    supabaseUserId: string;
    githubUid?: string | null;
    lumaAttendeeId?: string | null;
    bio?: string | null;
    streakCount?: number;
}

export interface ProfileUpdate {
    githubUid?: string | null;
    lumaAttendeeId?: string | null;
    bio?: string | null;
    streakCount?: number;
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
// Aggregated types for API responses (with populated references)
// ============================================================================

export interface ProjectWithMember extends Omit<Project, 'memberId'> {
    member: Pick<Profile, '_id' | 'supabaseUserId' | 'bio' | 'githubUid'>;
}

export interface ProfileWithBadges extends Profile {
    badges: Badge[];
}
