import { ObjectId } from 'mongodb';
import { getMongoDb, CollectionName } from '@/utils/mongodb.server';
import type {
    Badge,
    BadgeInsert,
    MemberBadge,
    MemberBadgeInsert
} from '@/types/mongodb';

/**
 * Get all badges
 */
export async function getBadges(): Promise<Badge[]> {
    const db = await getMongoDb();
    return db.collection<Badge>(CollectionName.BADGES).find().toArray();
}

/**
 * Get a badge by MongoDB _id
 */
export async function getBadgeById(id: string): Promise<Badge | null> {
    const db = await getMongoDb();
    return db.collection<Badge>(CollectionName.BADGES).findOne({
        _id: new ObjectId(id)
    });
}

/**
 * Get a badge by name
 */
export async function getBadgeByName(name: string): Promise<Badge | null> {
    const db = await getMongoDb();
    return db.collection<Badge>(CollectionName.BADGES).findOne({ name });
}

/**
 * Create a new badge
 */
export async function createBadge(data: BadgeInsert): Promise<Badge> {
    const db = await getMongoDb();
    const now = new Date();

    const doc = {
        ...data,
        createdAt: now
    };

    const result = await db
        .collection<Badge>(CollectionName.BADGES)
        .insertOne(doc as Badge);

    return {
        _id: result.insertedId,
        ...doc
    } as Badge;
}

/**
 * Get all badges for a member
 */
export async function getMemberBadges(memberId: string): Promise<Badge[]> {
    const db = await getMongoDb();

    const memberBadges = await db
        .collection<MemberBadge>(CollectionName.MEMBER_BADGES)
        .aggregate<Badge>([
            { $match: { memberId: new ObjectId(memberId) } },
            {
                $lookup: {
                    from: CollectionName.BADGES,
                    localField: 'badgeId',
                    foreignField: '_id',
                    as: 'badge'
                }
            },
            { $unwind: '$badge' },
            { $replaceRoot: { newRoot: '$badge' } }
        ])
        .toArray();

    return memberBadges;
}

/**
 * Award a badge to a member
 */
export async function awardBadge(
    data: MemberBadgeInsert
): Promise<MemberBadge> {
    const db = await getMongoDb();
    const now = new Date();

    const doc = {
        ...data,
        awardedAt: now
    };

    const result = await db
        .collection<MemberBadge>(CollectionName.MEMBER_BADGES)
        .insertOne(doc as MemberBadge);

    return {
        _id: result.insertedId,
        ...doc
    } as MemberBadge;
}

/**
 * Check if a member has a badge
 */
export async function hasBadge(
    memberId: string,
    badgeId: string
): Promise<boolean> {
    const db = await getMongoDb();
    const memberBadge = await db
        .collection<MemberBadge>(CollectionName.MEMBER_BADGES)
        .findOne({
            memberId: new ObjectId(memberId),
            badgeId: new ObjectId(badgeId)
        });

    return memberBadge !== null;
}

/**
 * Remove a badge from a member
 */
export async function removeBadge(
    memberId: string,
    badgeId: string
): Promise<boolean> {
    const db = await getMongoDb();
    const result = await db
        .collection<MemberBadge>(CollectionName.MEMBER_BADGES)
        .deleteOne({
            memberId: new ObjectId(memberId),
            badgeId: new ObjectId(badgeId)
        });

    return result.deletedCount === 1;
}
