/* eslint-disable @typescript-eslint/no-explicit-any */
import { eq, desc, isNull } from 'drizzle-orm';
import { pendingUsers, profiles } from '@drizzle/schema';
import { db } from '@/lib/db/provider.server';
import type {
    PendingUser,
    PendingUserInsert,
    PendingUserUpdate,
    Profile
} from '@/types/adapters';

/**
 * Get all pending users
 */
export async function getPendingUsers(): Promise<PendingUser[]> {
    const users = await db
        .select()
        .from(pendingUsers)
        .where(isNull(pendingUsers.approvedAt))
        .orderBy(desc(pendingUsers.subscribedAt));

    return users.map(u => ({ ...u, _id: u.id }) as any);
}

/**
 * Get a pending user by email
 */
export async function getPendingUserByEmail(
    email: string
): Promise<PendingUser | null> {
    const result = await db
        .select()
        .from(pendingUsers)
        .where(eq(pendingUsers.email, email));

    return result[0] ? ({ ...result[0], _id: result[0].id } as any) : null;
}

/**
 * Get a pending user by Luma attendee ID
 */
export async function getPendingUserByLumaAttendeeId(
    lumaAttendeeId: string
): Promise<PendingUser | null> {
    const result = await db
        .select()
        .from(pendingUsers)
        .where(eq(pendingUsers.lumaAttendeeId, lumaAttendeeId));

    return result[0] ? ({ ...result[0], _id: result[0].id } as any) : null;
}

/**
 * Create a new pending user
 */
export async function createPendingUser(
    data: PendingUserInsert
): Promise<PendingUser> {
    // Check if already exists
    const existing = await getPendingUserByLumaAttendeeId(data.lumaAttendeeId);
    if (existing) {
        return existing;
    }

    const now = new Date();
    const [user] = await db
        .insert(pendingUsers)
        .values({
            email: data.email,
            name: data.name,
            lumaAttendeeId: data.lumaAttendeeId,
            subscribedAt: data.subscribedAt ? new Date(data.subscribedAt) : now,
            createdAt: now,
            updatedAt: now
        })
        .returning();

    return { ...user, _id: user.id } as any;
}

/**
 * Update a pending user by email
 */
export async function updatePendingUser(
    email: string,
    data: PendingUserUpdate
): Promise<PendingUser | null> {
    const values: any = { updatedAt: new Date() };
    if (data.name) values.name = data.name;
    if (data.approvedAt) values.approvedAt = new Date(data.approvedAt);
    if (data.lumaAttendeeId) values.lumaAttendeeId = data.lumaAttendeeId;
    if (data.subscribedAt) values.subscribedAt = new Date(data.subscribedAt);

    const [updated] = await db
        .update(pendingUsers)
        .set(values)
        .where(eq(pendingUsers.email, email))
        .returning();

    return updated ? ({ ...updated, _id: updated.id } as any) : null;
}

/**
 * Delete a pending user by email
 */
export async function deletePendingUser(email: string): Promise<boolean> {
    const result = await db
        .delete(pendingUsers)
        .where(eq(pendingUsers.email, email));

    return (result.rowCount ?? 0) > 0;
}

/**
 * Promote a pending user to a verified profile
 * This moves them from pending_users to profiles table
 */
export async function promotePendingUserToProfile(
    email: string,
    clerkUserId: string
): Promise<{ success: boolean; profile?: Profile; error?: string }> {
    try {
        return await db.transaction(async tx => {
            const result = await tx
                .select()
                .from(pendingUsers)
                .where(eq(pendingUsers.email, email));

            const pendingUser = result[0];

            if (!pendingUser) {
                return { success: false, error: 'Pending user not found' };
            }

            const [profile] = await tx
                .insert(profiles)
                .values({
                    clerkUserId,
                    lumaEmail: email,
                    verificationStatus: 'verified',
                    lumaAttendeeId: pendingUser.lumaAttendeeId,
                    skills: [],
                    seekingFunding: false,
                    isAppAdmin: false
                    // Additional defaults if required by schema
                })
                .returning();

            await tx.delete(pendingUsers).where(eq(pendingUsers.email, email));

            return {
                success: true,
                profile: { ...profile, _id: profile.id } as any
            };
        });
    } catch (e) {
        console.error('Proomotion failed', e);
        return { success: false, error: 'Promotion failed' };
    }
}
