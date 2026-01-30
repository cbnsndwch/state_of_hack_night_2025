import { ObjectId } from 'mongodb';
import { getMongoDb, CollectionName } from '@/utils/mongodb.server';
import type { Profile, ProfileInsert, ProfileUpdate } from '@/types/mongodb';

/**
 * Get all profiles
 */
export async function getProfiles(): Promise<Profile[]> {
    const db = await getMongoDb();
    return db.collection<Profile>(CollectionName.PROFILES).find().toArray();
}

/**
 * Get a profile by MongoDB _id
 */
export async function getProfileById(id: string): Promise<Profile | null> {
    const db = await getMongoDb();
    return db.collection<Profile>(CollectionName.PROFILES).findOne({
        _id: new ObjectId(id)
    });
}

/**
 * Get a profile by Supabase user ID
 */
export async function getProfileBySupabaseUserId(
    supabaseUserId: string
): Promise<Profile | null> {
    const db = await getMongoDb();
    return db.collection<Profile>(CollectionName.PROFILES).findOne({
        supabaseUserId
    });
}

/**
 * Get a profile by Luma email
 */
export async function getProfileByLumaEmail(
    lumaEmail: string
): Promise<Profile | null> {
    const db = await getMongoDb();
    return db
        .collection<Profile>(CollectionName.PROFILES)
        .findOne({ lumaEmail });
}

/**
 * Create a new profile
 */
export async function createProfile(data: ProfileInsert): Promise<Profile> {
    const db = await getMongoDb();
    const now = new Date();

    const doc = {
        ...data,
        isAppAdmin: data.isAppAdmin ?? false,
        streakCount: data.streakCount ?? 0,
        onboardingDismissed: data.onboardingDismissed ?? false,
        createdAt: now,
        updatedAt: now
    };

    const result = await db
        .collection<Profile>(CollectionName.PROFILES)
        .insertOne(doc as Profile);

    return {
        _id: result.insertedId,
        ...doc
    } as Profile;
}

/**
 * Update a profile by MongoDB _id
 */
export async function updateProfile(
    id: string,
    data: ProfileUpdate
): Promise<Profile | null> {
    const db = await getMongoDb();

    const result = await db
        .collection<Profile>(CollectionName.PROFILES)
        .findOneAndUpdate(
            { _id: new ObjectId(id) },
            {
                $set: {
                    ...data,
                    updatedAt: new Date()
                }
            },
            { returnDocument: 'after' }
        );

    return result;
}

/**
 * Get or create a profile for a Supabase user
 */
export async function getOrCreateProfile(
    supabaseUserId: string,
    lumaEmail: string,
    defaults?: Partial<ProfileInsert>
): Promise<Profile> {
    const existing = await getProfileBySupabaseUserId(supabaseUserId);
    if (existing) {
        return existing;
    }

    return createProfile({
        supabaseUserId,
        lumaEmail,
        verificationStatus: 'verified',
        ...defaults
    });
}
