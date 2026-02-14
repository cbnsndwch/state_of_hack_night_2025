/**
 * Profile Database Adapter - Postgres Wrapper
 *
 * This module provides a backward-compatible adapter around the new Postgres-based
 * profile functions. It converts between Postgres schemas (with `id` field) and
 * the MongoDB shapes (with `_id` field) for minimal code changes throughout the app.
 *
 * All actual Postgres operations happen in profiles.postgres.server.ts
 */

import type { Profile, ProfileInsert, ProfileUpdate } from '@/types/adapters';
import * as postgresDb from './profiles.postgres.server';

/**
 * Convert Postgres profile to MongoDB-compatible profile shape
 */
export function toMongoProfile(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    postgresProfile: any
): Profile | null {
    if (!postgresProfile) return null;

    return {
        _id: postgresProfile.id,
        clerkUserId: postgresProfile.clerkUserId,
        lumaEmail: postgresProfile.lumaEmail,
        verificationStatus: postgresProfile.verificationStatus,
        isAppAdmin: postgresProfile.isAppAdmin,
        lumaAttendeeId: postgresProfile.lumaAttendeeId,
        bio: postgresProfile.bio,
        skills: postgresProfile.skills,
        githubUsername: postgresProfile.githubUsername,
        twitterHandle: postgresProfile.twitterHandle,
        websiteUrl: postgresProfile.websiteUrl,
        role: postgresProfile.role,
        seekingFunding: postgresProfile.seekingFunding,
        openToMentoring: postgresProfile.openToMentoring,
        streakCount: postgresProfile.streakCount,
        onboardingDismissed: postgresProfile.onboardingDismissed,
        createdAt: postgresProfile.createdAt,
        updatedAt: postgresProfile.updatedAt
    };
}

/**
 * Get all profiles
 */
export async function getProfiles(): Promise<Profile[]> {
    const profiles = await postgresDb.getAllProfiles();
    return profiles.map(toMongoProfile).filter(Boolean) as Profile[];
}

/**
 * Get a profile by UUID id
 */
export async function getProfileById(id: string): Promise<Profile | null> {
    const profile = await postgresDb.getProfileById(id);
    return toMongoProfile(profile);
}

/**
 * Get a profile by Clerk user ID
 */
export async function getProfileByClerkUserId(
    clerkUserId: string
): Promise<Profile | null> {
    const profile = await postgresDb.getProfileByClerkUserId(clerkUserId);
    return toMongoProfile(profile);
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
 * Get a profile by Luma email
 */
export async function getProfileByLumaEmail(
    lumaEmail: string
): Promise<Profile | null> {
    const profile = await postgresDb.getProfileByLumaEmail(lumaEmail);
    return toMongoProfile(profile);
}

/**
 * Create a new profile
 */
export async function createProfile(data: ProfileInsert): Promise<Profile> {
    const postgresProfile = await postgresDb.createProfile({
        clerkUserId: data.clerkUserId!,
        lumaEmail: data.lumaEmail,
        verificationStatus: (data.verificationStatus || 'pending') as
            | 'pending'
            | 'verified',
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
    });

    return toMongoProfile(postgresProfile)!;
}

/**
 * Update a profile by UUID id
 */
export async function updateProfile(
    id: string,
    data: ProfileUpdate
): Promise<Profile | null> {
    const postgresProfile = await postgresDb.updateProfileById(id, {
        bio: data.bio,
        skills: data.skills,
        githubUsername: data.githubUsername,
        twitterHandle: data.twitterHandle,
        websiteUrl: data.websiteUrl,
        role: data.role,
        seekingFunding: data.seekingFunding,
        openToMentoring: data.openToMentoring,
        streakCount: data.streakCount,
        onboardingDismissed: data.onboardingDismissed
    });

    return toMongoProfile(postgresProfile);
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
