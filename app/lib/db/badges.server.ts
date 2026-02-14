/**
 * PostgreSQL data access layer for Badges
 * Type-safe queries using Drizzle ORM.
 */

import { db } from './provider.server';
import { badges, memberBadges } from '@drizzle/schema';
import { eq, and } from 'drizzle-orm';
import type {
    Badge,
    BadgeInsert,
    MemberBadge,
    MemberBadgeInsert
} from '@/types/adapters';

/**
 * Get all badges
 */
export async function getBadges(): Promise<Badge[]> {
    return db.select().from(badges);
}

/**
 * Get a badge by ID
 */
export async function getBadgeById(id: string): Promise<Badge | null> {
    const result = await db.select().from(badges).where(eq(badges.id, id));

    return result[0] || null;
}

/**
 * Get a badge by name
 */
export async function getBadgeByName(name: string): Promise<Badge | null> {
    const result = await db.select().from(badges).where(eq(badges.name, name));

    return result[0] || null;
}

/**
 * Create a new badge
 */
export async function createBadge(data: BadgeInsert): Promise<Badge> {
    const [badge] = await db
        .insert(badges)
        .values({
            name: data.name,
            iconAscii: data.iconAscii,
            criteria: data.criteria,
            createdAt: new Date()
        })
        .returning();

    return badge;
}

/**
 * Delete a badge by ID
 */
export async function deleteBadge(id: string): Promise<boolean> {
    const result = await db.delete(badges).where(eq(badges.id, id));

    return (result.rowCount ?? 0) > 0;
}

/**
 * Count total badges
 */
export async function countBadges(): Promise<number> {
    const result = await db.select({ count: badges.id }).from(badges);

    return result[0] ? 1 : 0;
}

/**
 * Get all badges for a member
 */
export async function getMemberBadges(memberId: string): Promise<Badge[]> {
    const result = await db
        .select({
            id: badges.id,
            name: badges.name,
            iconAscii: badges.iconAscii,
            criteria: badges.criteria,
            createdAt: badges.createdAt
        })
        .from(memberBadges)
        .leftJoin(badges, eq(memberBadges.badgeId, badges.id))
        .where(eq(memberBadges.memberId, memberId));

    return result.filter(
        (b): b is Badge =>
            b.id !== null &&
            b.name !== null &&
            b.iconAscii !== null &&
            b.criteria !== null &&
            b.createdAt !== null
    );
}

/**
 * Check if a member has a specific badge
 */
export async function hasBadge(
    memberId: string,
    badgeId: string
): Promise<boolean> {
    const result = await db
        .select()
        .from(memberBadges)
        .where(
            and(
                eq(memberBadges.memberId, memberId),
                eq(memberBadges.badgeId, badgeId)
            )
        );

    return result.length > 0;
}

/**
 * Award a badge to a member
 */
export async function awardBadge(
    data: MemberBadgeInsert
): Promise<MemberBadge> {
    const memberId = data.memberId;
    const badgeId = data.badgeId;

    // Check if already awarded
    const exists = await hasBadge(memberId, badgeId);
    if (!exists) {
        await db.insert(memberBadges).values({
            memberId,
            badgeId,
            awardedAt: new Date()
        });
    }

    return {
        id: badgeId,
        memberId,
        badgeId,
        awardedAt: new Date()
    };
}

/**
 * Remove a badge from a member
 */
export async function removeBadge(
    memberId: string,
    badgeId: string
): Promise<boolean> {
    const result = await db
        .delete(memberBadges)
        .where(
            and(
                eq(memberBadges.memberId, memberId),
                eq(memberBadges.badgeId, badgeId)
            )
        );

    return (result.rowCount ?? 0) > 0;
}

/**
 * Get all members with a specific badge
 */
export async function getMembersWithBadge(badgeId: string) {
    return db
        .select({
            memberId: memberBadges.memberId,
            awardedAt: memberBadges.awardedAt
        })
        .from(memberBadges)
        .where(eq(memberBadges.badgeId, badgeId));
}

/**
 * Revoke all badges from a member
 */
export async function revokeMemberBadges(memberId: string): Promise<boolean> {
    const result = await db
        .delete(memberBadges)
        .where(eq(memberBadges.memberId, memberId));

    return (result.rowCount ?? 0) > 0;
}

/**
 * Count member badges
 */
export async function countMemberBadges(memberId: string): Promise<number> {
    const result = await db
        .select({ count: memberBadges.memberId })
        .from(memberBadges)
        .where(eq(memberBadges.memberId, memberId));

    return result.length;
}
