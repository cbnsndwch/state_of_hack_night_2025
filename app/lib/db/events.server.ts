/**
 * Event Database Functions - PostgreSQL with Drizzle
 *
 * These functions provide type-safe access to event data in PostgreSQL.
 */

import { eq } from 'drizzle-orm';
import { db } from './provider.server';
import { events } from '../../../drizzle/schema';
import type { Event, EventInsert, EventUpdate } from '@/types/adapters';

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
    const allEvents = await db.select().from(events);

    // Apply filters
    const now = new Date();
    let filtered = allEvents;

    if (options?.upcomingOnly) {
        filtered = filtered.filter(e => e.startAt >= now);
    }
    if (options?.pastOnly) {
        filtered = filtered.filter(e => e.startAt < now);
    }

    // Apply sort
    const sortOrder = options?.sortOrder ?? 1;
    filtered.sort((a, b) => {
        const diff = a.startAt.getTime() - b.startAt.getTime();
        return sortOrder === 1 ? diff : -diff;
    });

    // Apply limit
    if (options?.limit) {
        filtered = filtered.slice(0, options.limit);
    }

    return filtered;
}

/**
 * Get an event by its UUID id.
 */
export async function getEventById(id: string): Promise<Event | null> {
    const result = await db
        .select()
        .from(events)
        .where(eq(events.id, id))
        .limit(1);

    return result[0] || null;
}

/**
 * Get an event by its Luma event ID.
 */
export async function getEventByLumaId(
    lumaEventId: string
): Promise<Event | null> {
    const result = await db
        .select()
        .from(events)
        .where(eq(events.lumaEventId, lumaEventId))
        .limit(1);

    return result[0] || null;
}

/**
 * Create a new event.
 */
export async function createEvent(data: EventInsert): Promise<Event> {
    const [event] = await db
        .insert(events)
        .values({
            lumaEventId: data.lumaEventId,
            name: data.name,
            description: data.description || null,
            coverUrl: data.coverUrl || null,
            url: data.url,
            startAt: data.startAt,
            endAt: data.endAt || null,
            timezone: data.timezone,
            location: data.location || null,
            stats: data.stats || { registered: 0, checkedIn: 0 },
            isCanceled: data.isCanceled || false,
            lastSyncedAt: new Date()
        })
        .returning();

    return event;
}

/**
 * Update an event.
 */
export async function updateEvent(
    id: string,
    data: EventUpdate
): Promise<boolean> {
    try {
        const event = await getEventById(id);
        if (!event) return false;

        await db
            .update(events)
            .set({
                name: data.name ?? event.name,
                description: data.description ?? event.description,
                coverUrl: data.coverUrl ?? event.coverUrl,
                url: data.url ?? event.url,
                startAt: data.startAt ?? event.startAt,
                endAt: data.endAt ?? event.endAt,
                timezone: data.timezone ?? event.timezone,
                location: data.location ?? event.location,
                stats: data.stats ?? event.stats,
                isCanceled: data.isCanceled ?? event.isCanceled,
                lastSyncedAt: new Date(),
                updatedAt: new Date()
            })
            .where(eq(events.id, id));

        return true;
    } catch (error) {
        console.error('Error updating event:', error);
        return false;
    }
}

/**
 * Update an event by its Luma event ID.
 */
export async function updateEventByLumaId(
    lumaEventId: string,
    data: EventUpdate
): Promise<boolean> {
    try {
        const event = await getEventByLumaId(lumaEventId);
        if (!event) return false;

        await db
            .update(events)
            .set({
                name: data.name ?? event.name,
                description: data.description ?? event.description,
                coverUrl: data.coverUrl ?? event.coverUrl,
                url: data.url ?? event.url,
                startAt: data.startAt ?? event.startAt,
                endAt: data.endAt ?? event.endAt,
                timezone: data.timezone ?? event.timezone,
                location: data.location ?? event.location,
                stats: data.stats ?? event.stats,
                isCanceled: data.isCanceled ?? event.isCanceled,
                lastSyncedAt: new Date(),
                updatedAt: new Date()
            })
            .where(eq(events.id, event.id));

        return true;
    } catch (error) {
        console.error('Error updating event by Luma ID:', error);
        return false;
    }
}

/**
 * Upsert an event (create if not exists, update if exists).
 * Uses Luma event ID as the unique identifier.
 */
export async function upsertEvent(data: EventInsert): Promise<Event> {
    const existing = await getEventByLumaId(data.lumaEventId);

    if (existing) {
        // Update existing event
        const [updated] = await db
            .update(events)
            .set({
                name: data.name,
                description: data.description || null,
                coverUrl: data.coverUrl || null,
                url: data.url,
                startAt: data.startAt,
                endAt: data.endAt || null,
                timezone: data.timezone,
                location: data.location || null,
                stats: data.stats || { registered: 0, checkedIn: 0 },
                isCanceled: data.isCanceled || false,
                lastSyncedAt: new Date(),
                updatedAt: new Date()
            })
            .where(eq(events.id, existing.id))
            .returning();

        return updated;
    }

    // Create new event
    return createEvent(data);
}

/**
 * Delete an event
 */
export async function deleteEvent(id: string): Promise<Event | null> {
    const [deleted] = await db
        .delete(events)
        .where(eq(events.id, id))
        .returning();

    return deleted || null;
}
