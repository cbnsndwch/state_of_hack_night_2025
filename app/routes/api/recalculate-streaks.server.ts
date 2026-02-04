/**
 * API route to recalculate streaks for all members.
 * POST /api/recalculate-streaks - Admin-only operation to fix streak counts
 *
 * This is useful for:
 * - Initial data migration
 * - Fixing incorrect streaks after bugs
 * - Maintenance operations
 */

import { data, type ActionFunctionArgs } from 'react-router';
import { getAuth } from '@clerk/react-router/ssr.server';
import { recalculateAllStreaks } from '@/lib/db/streaks.server';
import { getProfileByClerkUserId } from '@/lib/db/profiles.server';

/**
 * GET handler - Not supported
 */
export async function loader() {
    return data({ error: 'Method not allowed' }, { status: 405 });
}

/**
 * POST handler - Recalculate all member streaks
 * Requires authentication and admin privileges
 */
export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== 'POST') {
        return data({ error: 'Method not allowed' }, { status: 405 });
    }

    try {
        // Get authenticated user from Clerk
        const auth = await getAuth({ request } as any);
        const userId = auth.userId;

        if (!userId) {
            return data(
                { error: 'Unauthorized - Please sign in' },
                { status: 401 }
            );
        }

        // Verify user is an admin
        const profile = await getProfileByClerkUserId(userId);
        if (!profile?.isAppAdmin) {
            return data(
                { error: 'Forbidden - Admin access required' },
                { status: 403 }
            );
        }

        // Recalculate all streaks
        console.log('Starting streak recalculation for all members...');
        const updatedCount = await recalculateAllStreaks();
        console.log(
            `Streak recalculation complete. Updated ${updatedCount} profiles.`
        );

        return data({
            success: true,
            message: `Successfully recalculated streaks for ${updatedCount} members`,
            updatedCount
        });
    } catch (error) {
        console.error('Error recalculating streaks:', error);
        return data(
            {
                error: 'Failed to recalculate streaks',
                message:
                    error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
