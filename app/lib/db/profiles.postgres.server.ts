/**
 * Profile Database Functions - PostgreSQL with Drizzle
 *
 * These functions provide type-safe access to profile data in PostgreSQL.
 * This replaces the MongoDB-based profiles.server.ts for the new Postgres/Zero architecture.
 */

import { eq } from 'drizzle-orm';
import { db } from './provider.server';
import { profiles } from '../../../drizzle/schema';

export interface ProfileInput {
    clerkUserId: string;
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
}

export interface ProfileUpdate {
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

/**
 * Get a profile by Clerk user ID
 */
export async function getProfileByClerkUserId(clerkUserId: string) {
    const result = await db
        .select()
        .from(profiles)
        .where(eq(profiles.clerkUserId, clerkUserId))
        .limit(1);

    return result[0] || null;
}

/**
 * Get a profile by Luma email
 */
export async function getProfileByLumaEmail(lumaEmail: string) {
    const result = await db
        .select()
        .from(profiles)
        .where(eq(profiles.lumaEmail, lumaEmail.toLowerCase().trim()))
        .limit(1);

    return result[0] || null;
}

/**
 * Get a profile by ID
 */
export async function getProfileById(id: string) {
    const result = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, id))
        .limit(1);

    return result[0] || null;
}

/**
 * Get all profiles
 */
export async function getAllProfiles() {
    return db.select().from(profiles);
}

/**
 * Create a new profile
 */
export async function createProfile(data: ProfileInput) {
    const [profile] = await db
        .insert(profiles)
        .values({
            clerkUserId: data.clerkUserId,
            lumaEmail: data.lumaEmail.toLowerCase().trim(),
            verificationStatus: data.verificationStatus || 'pending',
            isAppAdmin: data.isAppAdmin || false,
            lumaAttendeeId: data.lumaAttendeeId || null,
            bio: data.bio || null,
            skills: data.skills || [],
            githubUsername: data.githubUsername || null,
            twitterHandle: data.twitterHandle || null,
            websiteUrl: data.websiteUrl || null,
            role: data.role || null,
            seekingFunding: data.seekingFunding || false,
            openToMentoring: data.openToMentoring || false
        })
        .returning();

    return profile;
}

/**
 * Update an existing profile
 */
export async function updateProfile(clerkUserId: string, data: ProfileUpdate) {
    const [profile] = await db
        .update(profiles)
        .set({
            ...data,
            updatedAt: new Date()
        })
        .where(eq(profiles.clerkUserId, clerkUserId))
        .returning();

    return profile || null;
}

/**
 * Update profile by ID
 */
export async function updateProfileById(id: string, data: ProfileUpdate) {
    const [profile] = await db
        .update(profiles)
        .set({
            ...data,
            updatedAt: new Date()
        })
        .where(eq(profiles.id, id))
        .returning();

    return profile || null;
}

/**
 * Delete a profile (rarely used - consider soft deletes in production)
 */
export async function deleteProfile(id: string) {
    const [profile] = await db
        .delete(profiles)
        .where(eq(profiles.id, id))
        .returning();

    return profile || null;
}

/**
 * Verify a profile (mark as verified)
 */
export async function verifyProfile(clerkUserId: string) {
    const [profile] = await db
        .update(profiles)
        .set({
            verificationStatus: 'verified',
            updatedAt: new Date()
        })
        .where(eq(profiles.clerkUserId, clerkUserId))
        .returning();

    return profile || null;
}

/**
 * Search profiles by email or username
 * Note: Full text search requires raw SQL with ILIKE.
 * For now, returns verified profiles for pagination.
 */
export async function searchProfiles() {
    return db
        .select()
        .from(profiles)
        .where(eq(profiles.verificationStatus, 'verified'))
        .limit(50);
}
