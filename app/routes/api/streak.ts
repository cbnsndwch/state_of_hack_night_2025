/**
 * API route to get a member's current attendance streak.
 * GET /api/streak?memberId=xxx - Get streak count for a member
 */

import { data, type LoaderFunctionArgs } from 'react-router';
import { getStreakCount } from '@/lib/db/streaks.server';

/**
 * GET handler - Get streak count for a member
 */
export async function loader({ request }: LoaderFunctionArgs) {
    try {
        const url = new URL(request.url);
        const memberId = url.searchParams.get('memberId');

        if (!memberId) {
            return data(
                { error: 'Missing required parameter: memberId' },
                { status: 400 }
            );
        }

        const streakCount = await getStreakCount(memberId);

        return data({
            success: true,
            memberId,
            streakCount
        });
    } catch (error) {
        console.error('Error getting streak count:', error);
        return data(
            {
                error: 'Failed to get streak count',
                message:
                    error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

/**
 * POST handler - Not supported (use GET)
 */
export async function action() {
    return data({ error: 'Method not allowed' }, { status: 405 });
}
