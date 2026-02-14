/**
 * API route for fetching events.
 * GET /api/events?upcoming=true&limit=10
 */

import type { LoaderFunctionArgs } from 'react-router';
import { getEvents } from '@/lib/db/events.server';

export async function loader({ request }: LoaderFunctionArgs) {
    try {
        const url = new URL(request.url);
        const upcoming = url.searchParams.get('upcoming') === 'true';
        const past = url.searchParams.get('past') === 'true';
        const limit = url.searchParams.get('limit');

        const events = await getEvents({
            upcomingOnly: upcoming,
            pastOnly: past,
            sortOrder: 1, // Ascending order (earliest first)
            limit: limit ? parseInt(limit, 10) : undefined
        });

        // Convert ObjectId to string for JSON serialization
        const serializedEvents = events.map(event => ({
            id: event.id.toString(),
            lumaEventId: event.lumaEventId,
            name: event.name,
            description: event.description,
            coverUrl: event.coverUrl,
            url: event.url,
            startAt: event.startAt.toISOString(),
            endAt: event.endAt ? event.endAt.toISOString() : null,
            timezone: event.timezone,
            location: event.location,
            stats: event.stats,
            isCanceled: event.isCanceled,
            lastSyncedAt: event.lastSyncedAt.toISOString(),
            createdAt: event.createdAt.toISOString(),
            updatedAt: event.updatedAt.toISOString()
        }));

        return Response.json({ events: serializedEvents });
    } catch (error) {
        console.error('Error fetching events:', error);
        return Response.json(
            { error: 'Failed to fetch events' },
            { status: 500 }
        );
    }
}
