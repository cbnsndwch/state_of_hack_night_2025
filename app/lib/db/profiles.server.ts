/**
 * Profile Database Functions - PostgreSQL with Drizzle
 *
 * These functions provide type-safe access to profile data in PostgreSQL.
 */

import { eq } from 'drizzle-orm';
import { db } from './provider.server';
import { profiles } from '../../../drizzle/schema';
import type { Profile, ProfileInsert, ProfileUpdate } from '@/types/adapters';

/**
 * Get a profile by Clerk user ID
 */
export async function getProfileByClerkUserId(
    clerkUserId: string
): Promise<Profile | null> {
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
export async function getProfileByLumaEmail(
    lumaEmail: string
): Promise<Profile | null> {
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
export async function getProfileById(id: string): Promise<Profile | null> {
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
export async function getProfiles(): Promise<Profile[]> {
    return db.select().from(profiles);
}

/**
 * Get a profile by Supabase user ID (deprecated - for migration only)
 * @deprecated Use getProfileByClerkUserId instead
 */
export async function getProfileBySupabaseUserId(): Promise<Profile | null> {
    // Postgres doesn't have supabaseUserId, return null
    return null;
}

/**
 * Create a new profile
 */
export async function createProfile(data: ProfileInsert): Promise<Profile> {
    const [profile] = await db
        .insert(profiles)
        .values({
            clerkUserId: data.clerkUserId!,
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
 * Update a profile by UUID id
 */
export async function updateProfile(
    id: string,
    data: ProfileUpdate
): Promise<Profile | null> {
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
 * Get or create a profile for a Clerk user
 */
export async function getOrCreateProfile(
    clerkUserId: string,
    lumaEmail: string,
    defaults?: Partial<ProfileInsert>
): Promise<Profile> {
    const existing = await getProfileByClerkUserId(clerkUserId);
    if (existing) {
        return existing;
    }

    return createProfile({
        clerkUserId,
        lumaEmail,
        verificationStatus: 'verified',
        ...defaults
    });
}

/**
 * Delete a profile (rarely used - consider soft deletes in production)
 */
export async function deleteProfile(id: string): Promise<Profile | null> {
    const [profile] = await db
        .delete(profiles)
        .where(eq(profiles.id, id))
        .returning();

    return profile || null;
}

/**
 * Verify a profile (mark as verified)
 */
export async function verifyProfile(
    clerkUserId: string
): Promise<Profile | null> {
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
export async function searchProfiles(): Promise<Profile[]> {
    return db
        .select()
        .from(profiles)
        .where(eq(profiles.verificationStatus, 'verified'))
        .limit(50);
}
