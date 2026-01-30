/**
 * API endpoint to sync events from Luma to MongoDB.
 *
 * This endpoint can be called manually or triggered by a cron job.
 *
 * POST /api/sync-events
 */

import { data, type ActionFunctionArgs } from 'react-router';
import { syncUpcomingEvents } from '@/lib/services/event-sync.server';

export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== 'POST') {
        return data({ error: 'Method not allowed' }, { status: 405 });
    }

    try {
        const result = await syncUpcomingEvents();

        if (result.success) {
            return data({
                success: true,
                message: `Successfully synced ${result.synced} events`,
                synced: result.synced
            });
        } else {
            return data(
                {
                    success: false,
                    message: `Synced ${result.synced} events with ${result.errors.length} errors`,
                    synced: result.synced,
                    errors: result.errors
                },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Error syncing events:', error);
        return data(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// Allow GET requests to return info about the endpoint
export async function loader() {
    return data({
        endpoint: '/api/sync-events',
        method: 'POST',
        description: 'Syncs upcoming events from Luma API to the database',
        usage: 'Send a POST request to this endpoint to trigger a sync'
    });
}
