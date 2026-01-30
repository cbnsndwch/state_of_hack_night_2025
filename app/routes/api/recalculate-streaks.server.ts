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
import { createClient } from '@supabase/supabase-js';
import { recalculateAllStreaks } from '@/lib/db/streaks.server';
import { getProfileBySupabaseUserId } from '@/lib/db/profiles.server';

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
        // Get the JWT from the Authorization header
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return data({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');

        // Initialize Supabase client
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            console.error('Missing Supabase credentials');
            return data(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        // Verify the user
        const {
            data: { user },
            error: authError
        } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return data(
                { error: 'Unauthorized - Please sign in' },
                { status: 401 }
            );
        }

        // Verify user is an admin
        const profile = await getProfileBySupabaseUserId(user.id);
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
