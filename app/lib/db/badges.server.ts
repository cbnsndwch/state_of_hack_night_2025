/**
 * PostgreSQL adapter for Badges and Badge Assignments
 * Wraps badges.postgres.server.ts and badge-assignment.postgres.server.ts
 * Maintains backward compatibility with existing routes
 */

import * as badgesDb from './badges.postgres.server';
import * as badgeAssignmentDb from './badge-assignment.postgres.server';
import type {
    Badge,
    BadgeInsert,
    MemberBadge,
    MemberBadgeInsert
} from '@/types/adapters';

/**
 * Convert Postgres badge to MongoDB-compatible format
 */
function toMongoBadge(pgBadge: {
    id: string;
    name: string;
    iconAscii: string;
    criteria: string;
    createdAt: Date;
}): Badge {
    return {
        _id: pgBadge.id as unknown as Badge['_id'],
        name: pgBadge.name,
        iconAscii: pgBadge.iconAscii,
        criteria: pgBadge.criteria,
        createdAt: pgBadge.createdAt
    };
}

/**
 * Get all badges - adapter maintains MongoDB interface
 */
export async function getBadges(): Promise<Badge[]> {
    const badges = await badgesDb.getBadges();
    return badges.map(toMongoBadge);
}

/**
 * Get a badge by ID - adapter maintains MongoDB interface
 */
export async function getBadgeById(id: string): Promise<Badge | null> {
    const badge = await badgesDb.getBadgeById(id);
    return badge ? toMongoBadge(badge) : null;
}

/**
 * Get a badge by name - adapter maintains MongoDB interface
 */
export async function getBadgeByName(name: string): Promise<Badge | null> {
    const badge = await badgesDb.getBadgeByName(name);
    return badge ? toMongoBadge(badge) : null;
}

/**
 * Create a new badge - adapter maintains MongoDB interface
 */
export async function createBadge(data: BadgeInsert): Promise<Badge> {
    const created = await badgesDb.createBadge(data);
    return toMongoBadge(created);
}

/**
 * Get all badges for a member - adapter maintains MongoDB interface
 */
export async function getMemberBadges(memberId: string): Promise<Badge[]> {
    const memberBadges = await badgeAssignmentDb.getMemberBadges(memberId);
    return memberBadges.map(
        (mb: {
            id: string;
            name: string;
            iconAscii: string;
            criteria: string;
            createdAt: Date;
        }) => toMongoBadge(mb)
    );
}

/**
 * Award a badge to a member - adapter maintains MongoDB interface
 */
export async function awardBadge(
    data: MemberBadgeInsert
): Promise<MemberBadge> {
    const memberId = data.memberId as string;
    const badgeId = data.badgeId as string;

    await badgeAssignmentDb.awardBadge(memberId, badgeId);

    return {
        _id: badgeId as unknown as BadgeInsert['_id'],
        memberId,
        badgeId,
        awardedAt: new Date()
    };
}

/**
 * Check if a member has a badge - adapter delegates to Postgres
 */
export async function hasBadge(
    memberId: string,
    badgeId: string
): Promise<boolean> {
    return badgeAssignmentDb.hasMemberBadge(memberId, badgeId);
}

/**
 * Remove a badge from a member - adapter delegates to Postgres
 */
export async function removeBadge(
    memberId: string,
    badgeId: string
): Promise<boolean> {
    return badgeAssignmentDb.revokeBadge(memberId as string, badgeId as string);
}
