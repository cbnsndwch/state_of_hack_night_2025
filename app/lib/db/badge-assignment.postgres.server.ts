/**
 * PostgreSQL data access layer for Badge Assignments
 * Manages the junction table between members and badges.
 * Type-safe queries using Drizzle ORM.
 */

import { db } from './provider.server';
import { memberBadges, badges } from '@drizzle/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Get all badges for a member
 */
export async function getMemberBadges(memberId: string) {
    return db
        .select({
            id: badges.id,
            name: badges.name,
            iconAscii: badges.iconAscii,
            criteria: badges.criteria,
            awardedAt: memberBadges.awardedAt,
            createdAt: badges.createdAt
        })
        .from(memberBadges)
        .leftJoin(badges, eq(memberBadges.badgeId, badges.id))
        .where(eq(memberBadges.memberId, memberId));
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
 * Check if a member has a specific badge
 */
export async function hasMemberBadge(
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
export async function awardBadge(memberId: string, badgeId: string) {
    // Check if already awarded
    const exists = await hasMemberBadge(memberId, badgeId);
    if (exists) {
        return false;
    }

    await db.insert(memberBadges).values({
        memberId,
        badgeId,
        awardedAt: new Date()
    });

    return true;
}

/**
 * Revoke a badge from a member
 */
export async function revokeBadge(
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
export async function countMemberBadges(memberId: string) {
    const result = await db
        .select({ count: memberBadges.memberId })
        .from(memberBadges)
        .where(eq(memberBadges.memberId, memberId));

    return result.length;
}
