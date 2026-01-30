import { data, type ActionFunctionArgs } from 'react-router';
import { getProfileByLumaEmail } from '@/lib/db/profiles.server';
import { checkCalendarSubscription } from '@/utils/luma-api.server';
import { isAppAdmin } from '@/utils/app-admins.server';

export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== 'POST') {
        return data({ error: 'Method not allowed' }, { status: 405 });
    }

    try {
        const formData = await request.formData();
        const email = formData.get('email');

        if (!email || typeof email !== 'string') {
            return data({ error: 'Email is required' }, { status: 400 });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const userIsAppAdmin = isAppAdmin(normalizedEmail);

        // 1. Check if user has an existing profile in our database
        //    (already verified users don't need to hit Luma API)
        const profile = await getProfileByLumaEmail(normalizedEmail);
        if (profile) {
            return data({
                exists: true,
                allowed: true,
                isAppAdmin: profile.isAppAdmin || userIsAppAdmin,
                verificationStatus: profile.verificationStatus
            });
        }

        // 2. App admins are always allowed (even if not in Luma)
        if (userIsAppAdmin) {
            return data({
                exists: true,
                allowed: true,
                isAppAdmin: true,
                verificationStatus: 'verified'
            });
        }

        // 3. Query Luma API as source of truth for new users
        const lumaCheck = await checkCalendarSubscription(normalizedEmail);

        if (lumaCheck.isSubscribed) {
            // User is subscribed to the calendar
            return data({
                exists: true,
                allowed: true,
                isAppAdmin: false,
                verificationStatus: 'pending',
                lumaAttendeeId: lumaCheck.person?.api_id ?? null
            });
        }

        // 4. User not found in Luma
        return data({
            exists: false,
            allowed: false,
            message:
                'This email is not on the guest list. Please subscribe to our Luma calendar first.'
        });
    } catch (error) {
        console.error('Error checking user:', error);
        return data({ error: 'Internal server error' }, { status: 500 });
    }
}
