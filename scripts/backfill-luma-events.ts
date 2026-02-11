/**
 * Backfill Script: Seed Events from Luma API into PostgreSQL
 *
 * This script fetches all upcoming events from the Luma API and seeds them into
 * the PostgreSQL database. Run this after setting up Postgres to populate initial event data.
 *
 * Usage:
 *   pnpm tsx scripts/backfill-luma-events.ts
 *
 * Prerequisites:
 *   - DATABASE_URL environment variable must be set
 *   - LUMA_CALENDAR_ID and LUMA_API_KEY must be set
 *   - Postgres database must be initialized with migrations
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import * as schema from '../drizzle/schema';

// Luma API request helper
async function lumaRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const response = await fetch(`https://api.luma.so/api${endpoint}`, {
        headers: {
            Authorization: `Bearer ${process.env.LUMA_API_KEY}`,
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    });

    if (!response.ok) {
        throw new Error(
            `Luma API error: ${response.status} ${response.statusText}`
        );
    }

    return response.json();
}

// Fetch all upcoming events from Luma
async function fetchAllUpcomingEventsFromLuma(): Promise<Array<{
    api_id: string;
    name: string;
    description?: string;
    cover_url?: string;
    url: string;
    start_at: string;
    end_at?: string;
    timezone: string;
    geo_address_info?: {
        type?: string;
        place_name?: string;
        address?: string;
        latitude?: number;
        longitude?: number;
    };
    guest_count?: number;
    approval_count?: number;
    is_canceled?: boolean;
}>> {
    const calendarId = process.env.LUMA_CALENDAR_ID;
    if (!calendarId) {
        throw new Error('LUMA_CALENDAR_ID is not set');
    }

    const allEvents = [];
    let pagination_token = undefined;
    let pageCount = 0;

    while (true) {
        pageCount++;
        const queryParams = new URLSearchParams({
            calendar_id: calendarId
        });
        if (pagination_token) {
            queryParams.append('pagination_token', pagination_token);
        }

        const response = await lumaRequest<{
            entries: Array<{
                api_id: string;
                name: string;
                description?: string;
                cover_url?: string;
                url: string;
                start_at: string;
                end_at?: string;
                timezone: string;
                geo_address_info?: {
                    type?: string;
                    place_name?: string;
                    address?: string;
                    latitude?: number;
                    longitude?: number;
                };
                guest_count?: number;
                approval_count?: number;
                is_canceled?: boolean;
            }>;
            pagination_token?: string;
        }>(`/v1/calendar/events/${calendarId}?${queryParams}`);

        allEvents.push(...response.entries);

        if (!response.pagination_token) {
            break;
        }
        pagination_token = response.pagination_token;
    }

    return allEvents;
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
});

const db = drizzle(pool, { schema });

interface EventInput {
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
 * Convert Luma event to database format
 */
function convertLumaEventToDbEvent(lumaEvent: Awaited<ReturnType<typeof fetchAllUpcomingEventsFromLuma>>[number]): EventInput {
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
 * Upsert an event into the database
 */
async function upsertEvent(data: EventInput) {
    const existing = await db
        .select()
        .from(schema.events)
        .where(eq(schema.events.lumaEventId, data.lumaEventId))
        .limit(1);

    if (existing.length > 0) {
        // Update existing event
        const [updated] = await db
            .update(schema.events)
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
            .where(eq(schema.events.id, existing[0].id))
            .returning();

        return { created: false, event: updated };
    }

    // Create new event
    const [created] = await db
        .insert(schema.events)
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

    return { created: true, event: created };
}

/**
 * Main backfill function
 */
async function backfillLumaEvents() {
    console.log('🚀 Starting Luma events backfill...');

    try {
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL environment variable is not set');
        }

        if (!process.env.LUMA_CALENDAR_ID || !process.env.LUMA_API_KEY) {
            throw new Error(
                'LUMA_CALENDAR_ID and LUMA_API_KEY environment variables are required'
            );
        }

        // Fetch all upcoming events from Luma
        console.log('\n📅 Fetching events from Luma API...');
        const lumaEvents = await fetchAllUpcomingEventsFromLuma();
        console.log(`✓ Retrieved ${lumaEvents.length} events from Luma`);

        // Upsert each event
        console.log('\n💾 Upserting events to PostgreSQL...');
        let created = 0;
        let updated = 0;
        const errors: string[] = [];

        for (const lumaEvent of lumaEvents) {
            try {
                const dbEvent = convertLumaEventToDbEvent(lumaEvent);
                const result = await upsertEvent(dbEvent);

                if (result.created) {
                    created++;
                    console.log(`  ✓ Created: ${lumaEvent.name}`);
                } else {
                    updated++;
                    console.log(`  ✓ Updated: ${lumaEvent.name}`);
                }
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                const msg = `Failed to sync event ${lumaEvent.name}: ${errorMsg}`;
                errors.push(msg);
                console.error(`  ✗ ${msg}`);
            }
        }

        // Summary
        console.log('\n📊 Backfill Summary:');
        console.log(`  Created: ${created}`);
        console.log(`  Updated: ${updated}`);
        console.log(`  Errors: ${errors.length}`);

        if (errors.length > 0) {
            console.log('\nErrors encountered:');
            errors.forEach(err => console.log(`  - ${err}`));
        }

        console.log('\n✨ Backfill complete!');

        return {
            success: errors.length === 0,
            created,
            updated,
            errors
        };
    } catch (error) {
        console.error('\n❌ Backfill failed:', error);
        return {
            success: false,
            created: 0,
            updated: 0,
            errors: [error instanceof Error ? error.message : String(error)]
        };
    } finally {
        await pool.end();
    }
}

// Run the backfill
backfillLumaEvents().then(result => {
    process.exit(result.success ? 0 : 1);
});
