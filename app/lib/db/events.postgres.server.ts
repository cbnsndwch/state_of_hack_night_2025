/**
 * Event Database Functions - PostgreSQL with Drizzle
 *
 * These functions provide type-safe access to event data in PostgreSQL.
 * This replaces the MongoDB-based events.server.ts for the new Postgres/Zero architecture.
 */

import { eq } from 'drizzle-orm';
import { db } from './provider.server';
import { events } from '../../../drizzle/schema';

export interface EventInput {
    lumaEventId: string;
    name: string;
    description?: string | null;
    coverUrl?: string | null;
    url: string;
    startAt: Date;
    endAt?: Date | null;
    timezone: string;
    location?: {
        type: string;
        name: string | null;
        address: string | null;
        lat: number | null;
        lng: number | null;
    } | null;
    stats?: {
        registered: number;
        checkedIn: number;
    };
    isCanceled?: boolean;
}

/**
 * Create or update an event (upsert)
 */
export async function upsertEvent(data: EventInput) {
    const existing = await db
        .select()
        .from(events)
        .where(eq(events.lumaEventId, data.lumaEventId))
        .limit(1);

    if (existing.length > 0) {
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
            .where(eq(events.id, existing[0].id))
            .returning();

        return updated;
    }

    // Create new event
    const [created] = await db
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

    return created;
}

/**
 * Get an event by ID
 */
export async function getEventById(id: string) {
    const result = await db
        .select()
        .from(events)
        .where(eq(events.id, id))
        .limit(1);

    return result[0] || null;
}

/**
 * Get an event by Luma event ID
 */
export async function getEventByLumaId(lumaEventId: string) {
    const result = await db
        .select()
        .from(events)
        .where(eq(events.lumaEventId, lumaEventId))
        .limit(1);

    return result[0] || null;
}

/**
 * Get all events
 */
export async function getAllEvents() {
    return db.select().from(events);
}

/**
 * Delete an event
 */
export async function deleteEvent(id: string) {
    const [deleted] = await db
        .delete(events)
        .where(eq(events.id, id))
        .returning();

    return deleted || null;
}
