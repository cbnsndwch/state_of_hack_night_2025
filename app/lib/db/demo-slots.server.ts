/**
 * Database operations for demo slots (demo presentations at hack nights).
 */

import { ObjectId } from 'mongodb';
import { getMongoDb, CollectionName } from '@/utils/mongodb.server';
import type {
    DemoSlot,
    DemoSlotInsert,
    DemoSlotUpdate,
    DemoSlotWithMember,
    DemoSlotWithEvent
} from '@/types/mongodb';

/**
 * Get all demo slots from the database.
 */
export async function getDemoSlots(options?: {
    /** Filter by event ID */
    eventId?: string;
    /** Filter by member ID */
    memberId?: string;
    /** Filter by status */
    status?: 'pending' | 'confirmed' | 'canceled';
    /** Sort order (1 for ascending, -1 for descending) */
    sortOrder?: 1 | -1;
    /** Limit number of results */
    limit?: number;
}): Promise<DemoSlot[]> {
    const db = await getMongoDb();
    const collection = db.collection<DemoSlot>(CollectionName.DEMO_SLOTS);

    const filter: Record<string, unknown> = {};

    if (options?.eventId) {
        filter.eventId = new ObjectId(options.eventId);
    }
    if (options?.memberId) {
        filter.memberId = new ObjectId(options.memberId);
    }
    if (options?.status) {
        filter.status = options.status;
    }

    const cursor = collection
        .find(filter)
        .sort({ createdAt: options?.sortOrder ?? -1 });

    if (options?.limit) {
        cursor.limit(options.limit);
    }

    return cursor.toArray();
}

/**
 * Get demo slots with member information populated.
 */
export async function getDemoSlotsWithMembers(options?: {
    eventId?: string;
    status?: 'pending' | 'confirmed' | 'canceled';
}): Promise<DemoSlotWithMember[]> {
    const db = await getMongoDb();
    const demoSlotsCollection = db.collection<DemoSlot>(
        CollectionName.DEMO_SLOTS
    );

    const filter: Record<string, unknown> = {};
    if (options?.eventId) {
        filter.eventId = new ObjectId(options.eventId);
    }
    if (options?.status) {
        filter.status = options.status;
    }

    const pipeline = [
        { $match: filter },
        {
            $lookup: {
                from: CollectionName.PROFILES,
                localField: 'memberId',
                foreignField: '_id',
                as: 'memberData'
            }
        },
        { $unwind: '$memberData' },
        {
            $project: {
                _id: 1,
                eventId: 1,
                title: 1,
                description: 1,
                requestedTime: 1,
                durationMinutes: 1,
                status: 1,
                confirmedByOrganizer: 1,
                createdAt: 1,
                updatedAt: 1,
                'member._id': '$memberData._id',
                'member.lumaEmail': '$memberData.lumaEmail',
                'member.githubUsername': '$memberData.githubUsername'
            }
        },
        { $sort: { createdAt: -1 } }
    ];

    const results = await demoSlotsCollection.aggregate(pipeline).toArray();

    return results as unknown as DemoSlotWithMember[];
}

/**
 * Get a demo slot by its ID.
 */
export async function getDemoSlotById(id: string): Promise<DemoSlot | null> {
    const db = await getMongoDb();
    const collection = db.collection<DemoSlot>(CollectionName.DEMO_SLOTS);

    return collection.findOne({ _id: new ObjectId(id) });
}

/**
 * Create a new demo slot.
 */
export async function createDemoSlot(data: DemoSlotInsert): Promise<DemoSlot> {
    const db = await getMongoDb();
    const collection = db.collection<DemoSlot>(CollectionName.DEMO_SLOTS);

    const now = new Date();
    const demoSlot: Omit<DemoSlot, '_id'> = {
        ...data,
        description: data.description ?? null,
        requestedTime: data.requestedTime ?? null,
        durationMinutes: data.durationMinutes ?? 5,
        status: data.status ?? 'pending',
        confirmedByOrganizer: data.confirmedByOrganizer ?? false,
        createdAt: now,
        updatedAt: now
    };

    const result = await collection.insertOne(demoSlot as DemoSlot);

    return {
        ...demoSlot,
        _id: result.insertedId
    } as DemoSlot;
}

/**
 * Update a demo slot.
 */
export async function updateDemoSlot(
    id: string,
    data: DemoSlotUpdate
): Promise<boolean> {
    const db = await getMongoDb();
    const collection = db.collection<DemoSlot>(CollectionName.DEMO_SLOTS);

    const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        {
            $set: {
                ...data,
                updatedAt: new Date()
            }
        }
    );

    return result.modifiedCount > 0;
}

/**
 * Delete a demo slot.
 */
export async function deleteDemoSlot(id: string): Promise<boolean> {
    const db = await getMongoDb();
    const collection = db.collection<DemoSlot>(CollectionName.DEMO_SLOTS);

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    return result.deletedCount > 0;
}

/**
 * Get demo slots for a member with event information.
 */
export async function getMemberDemoSlotsWithEvents(
    memberId: string
): Promise<DemoSlotWithEvent[]> {
    const db = await getMongoDb();
    const demoSlotsCollection = db.collection<DemoSlot>(
        CollectionName.DEMO_SLOTS
    );

    const pipeline = [
        { $match: { memberId: new ObjectId(memberId) } },
        {
            $lookup: {
                from: CollectionName.EVENTS,
                localField: 'eventId',
                foreignField: '_id',
                as: 'eventData'
            }
        },
        { $unwind: '$eventData' },
        {
            $project: {
                _id: 1,
                memberId: 1,
                title: 1,
                description: 1,
                requestedTime: 1,
                durationMinutes: 1,
                status: 1,
                confirmedByOrganizer: 1,
                createdAt: 1,
                updatedAt: 1,
                'event._id': '$eventData._id',
                'event.name': '$eventData.name',
                'event.startAt': '$eventData.startAt',
                'event.endAt': '$eventData.endAt'
            }
        },
        { $sort: { 'event.startAt': -1 } }
    ];

    const results = await demoSlotsCollection.aggregate(pipeline).toArray();

    return results as unknown as DemoSlotWithEvent[];
}
