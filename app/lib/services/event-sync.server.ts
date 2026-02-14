/**
 * Service for syncing events from Luma API to PostgreSQL.
 */

import {
    fetchAllUpcomingEvents,
    type LumaEvent
} from '@/utils/luma-api.server';
import { upsertEvent } from '@/lib/db/events.server';
import type { EventInput } from '@/lib/db/events.server';

/**
 * Convert a Luma API event to our database event format.
 */
function convertLumaEventToDbEvent(lumaEvent: LumaEvent): EventInput {
    return {
        lumaEventId: lumaEvent.api_id,
        name: lumaEvent.name,
        description: lumaEvent.description ?? null,
        coverUrl: lumaEvent.cover_url ?? null,
        url: lumaEvent.url,
        startAt: new Date(lumaEvent.start_at),
        endAt: lumaEvent.end_at ? new Date(lumaEvent.end_at) : null,
        timezone: lumaEvent.timezone,
        location: lumaEvent.geo_address_info
            ? {
                  type: lumaEvent.geo_address_info.type ?? 'in_person',
                  name: lumaEvent.geo_address_info.place_name ?? null,
                  address: lumaEvent.geo_address_info.address ?? null,
                  lat: lumaEvent.geo_address_info.latitude ?? null,
                  lng: lumaEvent.geo_address_info.longitude ?? null
              }
            : null,
        stats: {
            registered: lumaEvent.guest_count ?? 0,
            checkedIn: lumaEvent.approval_count ?? 0
        },
        isCanceled: lumaEvent.is_canceled ?? false
    };
}

/**
 * Sync upcoming events from Luma to the database.
 * This will create new events or update existing ones based on lumaEventId.
 *
 * @returns Object with sync statistics
 */
export async function syncUpcomingEvents(): Promise<{
    success: boolean;
    synced: number;
    errors: string[];
}> {
    const errors: string[] = [];
    let synced = 0;

    try {
        // Fetch all upcoming events from Luma
        const lumaEvents = await fetchAllUpcomingEvents();

        // Upsert each event into the database
        for (const lumaEvent of lumaEvents) {
            try {
                const dbEvent = convertLumaEventToDbEvent(lumaEvent);
                await upsertEvent(dbEvent);
                synced++;
            } catch (error) {
                const errorMessage = `Failed to sync event ${lumaEvent.api_id}: ${error instanceof Error ? error.message : String(error)}`;
                errors.push(errorMessage);
                console.error(errorMessage);
            }
        }

        return {
            success: errors.length === 0,
            synced,
            errors
        };
    } catch (error) {
        const errorMessage = `Failed to fetch events from Luma: ${error instanceof Error ? error.message : String(error)}`;
        errors.push(errorMessage);
        console.error(errorMessage);

        return {
            success: false,
            synced,
            errors
        };
    }
}

/**
 * Sync a single event from Luma by its API ID.
 *
 * @param lumaEventId - The Luma event API ID
 * @returns Success status
 */
export async function syncSingleEvent(lumaEventId: string): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        // Note: This would require implementing a "get single event" function
        // in luma-api.server.ts using the endpoint GET /v1/event/get
        // For now, we'll sync all events and filter
        const lumaEvents = await fetchAllUpcomingEvents();
        const lumaEvent = lumaEvents.find(
            (e: LumaEvent) => e.api_id === lumaEventId
        );

        if (!lumaEvent) {
            return {
                success: false,
                error: `Event ${lumaEventId} not found in upcoming events`
            };
        }

        const dbEvent = convertLumaEventToDbEvent(lumaEvent);
        await upsertEvent(dbEvent);

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}
