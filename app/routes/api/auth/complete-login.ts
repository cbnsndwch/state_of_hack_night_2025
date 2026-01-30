import { data, type ActionFunctionArgs } from 'react-router';
import { createClient } from '@supabase/supabase-js';
import {
    getProfileByLumaEmail,
    updateProfile,
    createProfile
} from '@/lib/db/profiles.server';
import { checkCalendarSubscription } from '@/utils/luma-api.server';
import { isAppAdmin } from '@/utils/app-admins.server';

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

        if (authError || !user || !user.email) {
            return data({ error: 'Invalid token' }, { status: 401 });
        }

        const normalizedEmail = user.email.toLowerCase().trim();
        const userIsAppAdmin = isAppAdmin(normalizedEmail);

        // Find the profile for this email
        let profile = await getProfileByLumaEmail(normalizedEmail);

        if (!profile) {
            // No profile exists - verify with Luma API that user is allowed
            const lumaCheck = await checkCalendarSubscription(normalizedEmail);

            if (!lumaCheck.isSubscribed && !userIsAppAdmin) {
                // User is not in Luma calendar and not an admin
                return data({ error: 'Profile not found' }, { status: 404 });
            }

            // Create a new profile for this user
            profile = await createProfile({
                supabaseUserId: user.id,
                lumaEmail: normalizedEmail,
                verificationStatus: 'verified',
                isAppAdmin: userIsAppAdmin,
                lumaAttendeeId: lumaCheck.person?.api_id ?? null,
                bio: null,
                streakCount: 0
            });
            console.log(
                `Created new profile ${profile._id} for ${normalizedEmail}${userIsAppAdmin ? ' (app admin)' : ''}`
            );

            return data({ success: true, created: true });
        }

        // Profile exists - update it if needed
        const updates: Record<string, unknown> = {};

        if (profile.supabaseUserId !== user.id) {
            updates.supabaseUserId = user.id;
        }
        if (profile.verificationStatus !== 'verified') {
            updates.verificationStatus = 'verified';
        }

        // Ensure app admin status is up to date from env var
        if (userIsAppAdmin && !profile.isAppAdmin) {
            updates.isAppAdmin = true;
        }

        if (Object.keys(updates).length > 0) {
            await updateProfile(profile._id.toString(), updates);
            console.log(
                `Updated profile ${profile._id} for Supabase user ${user.id}`
            );
        }

        return data({ success: true });
    } catch (error) {
        console.error('Error completing login:', error);
        return data({ error: 'Internal server error' }, { status: 500 });
    }
}
