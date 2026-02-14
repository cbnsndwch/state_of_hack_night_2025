/**
 * Event Database Adapter - Postgres Wrapper
 *
 * This module provides a backward-compatible adapter around the new Postgres-based
 * event functions. It converts between Postgres schemas (with `id` field) and
 * the MongoDB shapes (with `_id` field) for minimal code changes throughout the app.
 *
 * All actual Postgres operations happen in events.postgres.server.ts
 */

import type { Event, EventInsert, EventUpdate } from '@/types/adapters';
import * as postgresDb from './events.postgres.server';

/**
 * Convert Postgres event to MongoDB-compatible event shape
 */
export function toMongoEvent(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    postgresEvent: any
): Event | null {
    if (!postgresEvent) return null;

    return {
        _id: postgresEvent.id, // For backward compat - Postgres uses UUID id
        lumaEventId: postgresEvent.lumaEventId,
        name: postgresEvent.name,
        description: postgresEvent.description,
        coverUrl: postgresEvent.coverUrl,
        url: postgresEvent.url,
        startAt: postgresEvent.startAt,
        endAt: postgresEvent.endAt,
        timezone: postgresEvent.timezone,
        location: postgresEvent.location,
        stats: postgresEvent.stats,
        isCanceled: postgresEvent.isCanceled,
        lastSyncedAt: postgresEvent.lastSyncedAt,
        createdAt: postgresEvent.createdAt,
        updatedAt: postgresEvent.updatedAt
    };
}

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
    const events = await postgresDb.getAllEvents();

    // Apply filters
    const now = new Date();
    let filtered = events;

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

    return filtered.map(toMongoEvent).filter(Boolean) as Event[];
}

/**
 * Get an event by its UUID id.
 */
export async function getEventById(id: string): Promise<Event | null> {
    const event = await postgresDb.getEventById(id);
    return toMongoEvent(event);
}

/**
 * Get an event by its Luma event ID.
 */
export async function getEventByLumaId(
    lumaEventId: string
): Promise<Event | null> {
    const event = await postgresDb.getEventByLumaId(lumaEventId);
    return toMongoEvent(event);
}

/**
 * Create a new event.
 */
export async function createEvent(data: EventInsert): Promise<Event> {
    const postgresEvent = await postgresDb.upsertEvent({
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
        isCanceled: data.isCanceled || false
    });

    return toMongoEvent(postgresEvent)!;
}

/**
 * Update an event.
 */
export async function updateEvent(
    id: string,
    data: EventUpdate
): Promise<boolean> {
    try {
        const event = await postgresDb.getEventById(id);
        if (!event) return false;

        // For ID-based updates, we need to look up and update
        // This is a simplified version - in production you'd want bulk updates
        await postgresDb.upsertEvent({
            lumaEventId: event.lumaEventId,
            name: data.name ?? event.name,
            description: data.description ?? event.description,
            coverUrl: data.coverUrl ?? event.coverUrl,
            url: data.url ?? event.url,
            startAt: data.startAt ?? event.startAt,
            endAt: data.endAt ?? event.endAt,
            timezone: data.timezone ?? event.timezone,
            location: data.location ?? event.location,
            stats: data.stats ?? event.stats,
            isCanceled: data.isCanceled ?? event.isCanceled
        });

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
        const event = await postgresDb.getEventByLumaId(lumaEventId);
        if (!event) return false;

        await postgresDb.upsertEvent({
            lumaEventId: event.lumaEventId,
            name: data.name ?? event.name,
            description: data.description ?? event.description,
            coverUrl: data.coverUrl ?? event.coverUrl,
            url: data.url ?? event.url,
            startAt: data.startAt ?? event.startAt,
            endAt: data.endAt ?? event.endAt,
            timezone: data.timezone ?? event.timezone,
            location: data.location ?? event.location,
            stats: data.stats ?? event.stats,
            isCanceled: data.isCanceled ?? event.isCanceled
        });

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
    const postgresEvent = await postgresDb.upsertEvent({
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
        isCanceled: data.isCanceled || false
    });

    return toMongoEvent(postgresEvent)!;
}
