/**
 * Database operations for events (synced from Luma).
 */

import { ObjectId } from 'mongodb';
import { getMongoDb, CollectionName } from '@/utils/mongodb.server';
import type { Event, EventInsert, EventUpdate } from '@/types/mongodb';

/**
 * Get all events from the database.
 */
export async function getEvents(options?: {
    /** Filter by upcoming events only (startAt >= now) */
    upcomingOnly?: boolean;
    /** Filter by past events only (startAt < now) */
    pastOnly?: boolean;
    /** Sort order (1 for ascending, -1 for descending) */
    sortOrder?: 1 | -1;
    /** Limit number of results */
    limit?: number;
}): Promise<Event[]> {
    const db = await getMongoDb();
    const collection = db.collection<Event>(CollectionName.EVENTS);

    const filter: Record<string, unknown> = {};
    const now = new Date();

    if (options?.upcomingOnly) {
        filter.startAt = { $gte: now };
    }
    if (options?.pastOnly) {
        filter.startAt = { $lt: now };
    }

    const cursor = collection
        .find(filter)
        .sort({ startAt: options?.sortOrder ?? 1 });

    if (options?.limit) {
        cursor.limit(options.limit);
    }

    return cursor.toArray();
}

/**
 * Get an event by its ID.
 */
export async function getEventById(id: string): Promise<Event | null> {
    const db = await getMongoDb();
    const collection = db.collection<Event>(CollectionName.EVENTS);

    return collection.findOne({ _id: new ObjectId(id) });
}

/**
 * Get an event by its Luma event ID.
 */
export async function getEventByLumaId(
    lumaEventId: string
): Promise<Event | null> {
    const db = await getMongoDb();
    const collection = db.collection<Event>(CollectionName.EVENTS);

    return collection.findOne({ lumaEventId });
}

/**
 * Create a new event.
 */
export async function createEvent(data: EventInsert): Promise<Event> {
    const db = await getMongoDb();
    const collection = db.collection<Event>(CollectionName.EVENTS);

    const now = new Date();
    const event: Omit<Event, '_id'> = {
        ...data,
        description: data.description ?? null,
        coverUrl: data.coverUrl ?? null,
        endAt: data.endAt ?? null,
        location: data.location ?? null,
        stats: data.stats ?? { registered: 0, checkedIn: 0 },
        isCanceled: data.isCanceled ?? false,
        lastSyncedAt: data.lastSyncedAt ?? now,
        createdAt: now,
        updatedAt: now
    };

    const result = await collection.insertOne(event as Event);

    return {
        ...event,
        _id: result.insertedId
    } as Event;
}

/**
 * Update an event.
 */
export async function updateEvent(
    id: string,
    data: EventUpdate
): Promise<boolean> {
    const db = await getMongoDb();
    const collection = db.collection<Event>(CollectionName.EVENTS);

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
 * Update an event by its Luma event ID.
 */
export async function updateEventByLumaId(
    lumaEventId: string,
    data: EventUpdate
): Promise<boolean> {
    const db = await getMongoDb();
    const collection = db.collection<Event>(CollectionName.EVENTS);

    const result = await collection.updateOne(
        { lumaEventId },
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
 * Upsert an event (create if not exists, update if exists).
 * Uses Luma event ID as the unique identifier.
 */
export async function upsertEvent(data: EventInsert): Promise<Event> {
    const db = await getMongoDb();
    const collection = db.collection<Event>(CollectionName.EVENTS);

    const now = new Date();
    const event: Omit<Event, '_id'> = {
        ...data,
        description: data.description ?? null,
        coverUrl: data.coverUrl ?? null,
        endAt: data.endAt ?? null,
        location: data.location ?? null,
        stats: data.stats ?? { registered: 0, checkedIn: 0 },
        isCanceled: data.isCanceled ?? false,
        lastSyncedAt: data.lastSyncedAt ?? now,
        createdAt: now,
        updatedAt: now
    };

    const result = await collection.findOneAndUpdate(
        { lumaEventId: data.lumaEventId },
        {
            $set: {
                ...event,
                updatedAt: now
            },
            $setOnInsert: {
                createdAt: now
            }
        },
        {
            upsert: true,
            returnDocument: 'after'
        }
    );

    if (!result) {
        throw new Error('Failed to upsert event');
    }

    return result as Event;
}

/**
 * Delete an event.
 */
export async function deleteEvent(id: string): Promise<boolean> {
    const db = await getMongoDb();
    const collection = db.collection<Event>(CollectionName.EVENTS);

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    return result.deletedCount > 0;
}

/**
 * Delete an event by its Luma event ID.
 */
export async function deleteEventByLumaId(
    lumaEventId: string
): Promise<boolean> {
    const db = await getMongoDb();
    const collection = db.collection<Event>(CollectionName.EVENTS);

    const result = await collection.deleteOne({ lumaEventId });

    return result.deletedCount > 0;
}
