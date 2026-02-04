import { getMongoDb, CollectionName } from '@/utils/mongodb.server';
import type {
    PendingUser,
    PendingUserInsert,
    PendingUserUpdate,
    Profile
} from '@/types/mongodb';

/**
 * Get all pending users
 */
export async function getPendingUsers(): Promise<PendingUser[]> {
    const db = await getMongoDb();
    return db
        .collection<PendingUser>(CollectionName.PENDING_USERS)
        .find()
        .toArray();
}

/**
 * Get a pending user by email
 */
export async function getPendingUserByEmail(
    email: string
): Promise<PendingUser | null> {
    const db = await getMongoDb();
    return db
        .collection<PendingUser>(CollectionName.PENDING_USERS)
        .findOne({ email });
}

/**
 * Get a pending user by Luma attendee ID
 */
export async function getPendingUserByLumaAttendeeId(
    lumaAttendeeId: string
): Promise<PendingUser | null> {
    const db = await getMongoDb();
    return db
        .collection<PendingUser>(CollectionName.PENDING_USERS)
        .findOne({ lumaAttendeeId });
}

/**
 * Create a new pending user
 */
export async function createPendingUser(
    data: PendingUserInsert
): Promise<PendingUser> {
    const db = await getMongoDb();
    const now = new Date();

    const doc = {
        ...data,
        subscribedAt: data.subscribedAt ?? now,
        approvedAt: data.approvedAt ?? null,
        createdAt: now,
        updatedAt: now
    };

    const result = await db
        .collection<PendingUser>(CollectionName.PENDING_USERS)
        .insertOne(doc as PendingUser);

    return {
        _id: result.insertedId,
        ...doc
    } as PendingUser;
}

/**
 * Update a pending user by email
 */
export async function updatePendingUser(
    email: string,
    data: PendingUserUpdate
): Promise<PendingUser | null> {
    const db = await getMongoDb();

    const result = await db
        .collection<PendingUser>(CollectionName.PENDING_USERS)
        .findOneAndUpdate(
            { email },
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
 * Delete a pending user by email
 */
export async function deletePendingUser(email: string): Promise<boolean> {
    const db = await getMongoDb();
    const result = await db
        .collection<PendingUser>(CollectionName.PENDING_USERS)
        .deleteOne({ email });
    return result.deletedCount > 0;
}

/**
 * Promote a pending user to a verified profile
 * This moves them from pending_users to profiles collection
 */
export async function promotePendingUserToProfile(
    email: string,
    clerkUserId: string
): Promise<{ success: boolean; profile?: Profile; error?: string }> {
    const db = await getMongoDb();

    // Get the pending user
    const pendingUser = await getPendingUserByEmail(email);
    if (!pendingUser) {
        return { success: false, error: 'Pending user not found' };
    }

    // Start a session for transaction
    const session = db.client.startSession();

    try {
        return await session.withTransaction(async () => {
            // Create the profile
            const profile = {
                clerkUserId,
                lumaEmail: email,
                verificationStatus: 'verified' as const,
                lumaAttendeeId: pendingUser.lumaAttendeeId,
                bio: null,
                streakCount: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const profileResult = await db
                .collection(CollectionName.PROFILES)
                .insertOne(profile, { session });

            // Delete from pending users
            await db
                .collection(CollectionName.PENDING_USERS)
                .deleteOne({ email }, { session });

            return {
                success: true,
                profile: {
                    _id: profileResult.insertedId,
                    ...profile
                }
            };
        });
    } finally {
        await session.endSession();
    }
}
