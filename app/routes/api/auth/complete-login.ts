import { data, type ActionFunctionArgs } from 'react-router';
import { getAuth } from '@clerk/react-router/server';
import { checkCalendarSubscription } from '@/utils/luma-api.server';
import { isAppAdmin } from '@/utils/app-admins.server';

// Default export for React Router route
export default function CompleteLoginRoute() {
    return null;
}

export async function action(args: ActionFunctionArgs) {
    // Import server modules only inside the action function
    const {
        getProfileByLumaEmail,
        getProfileByClerkUserId,
        createProfile,
        verifyProfile
    } = await import('@/lib/db/profiles.postgres.server');

    const { request } = args;

    if (request.method !== 'POST') {
        return data({ error: 'Method not allowed' }, { status: 405 });
    }

    try {
        // Get authenticated user from Clerk
        const auth = await getAuth(args);
        const userId = auth.userId;

        if (!userId) {
            return data({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user details from Clerk
        const clerkResponse = await fetch(
            `https://api.clerk.com/v1/users/${userId}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`
                }
            }
        );

        if (!clerkResponse.ok) {
            return data({ error: 'Failed to fetch user' }, { status: 500 });
        }

        const clerkUser = await clerkResponse.json();
        const primaryEmail =
            clerkUser.email_addresses?.find(
                (email: { id: string }) =>
                    email.id === clerkUser.primary_email_address_id
            )?.email_address || clerkUser.email_addresses?.[0]?.email_address;

        if (!primaryEmail) {
            return data({ error: 'No email found' }, { status: 400 });
        }

        const normalizedEmail = primaryEmail.toLowerCase().trim();
        const userIsAppAdmin = isAppAdmin(normalizedEmail);

        // Check if profile exists by clerkUserId first
        let profile = await getProfileByClerkUserId(userId);

        if (!profile) {
            // Try to find by email (for existing users migrating from Supabase)
            profile = await getProfileByLumaEmail(normalizedEmail);
        }

        if (!profile) {
            // No profile exists - verify with Luma API that user is allowed
            const lumaCheck = await checkCalendarSubscription(normalizedEmail);

            if (!lumaCheck.isSubscribed && !userIsAppAdmin) {
                // User is not in Luma calendar and not an admin
                return data({ error: 'Profile not found' }, { status: 404 });
            }

            // Create a new profile for this user
            profile = await createProfile({
                clerkUserId: userId,
                lumaEmail: normalizedEmail,
                verificationStatus: 'verified',
                isAppAdmin: userIsAppAdmin,
                lumaAttendeeId: lumaCheck.person?.api_id ?? null,
                bio: null
            });
            console.log(
                `Created new profile ${profile.id} for ${normalizedEmail}${userIsAppAdmin ? ' (app admin)' : ''}`
            );

            return data({ success: true, created: true });
        }

        // Profile exists - update it if needed, especially for verification
        if (profile.verificationStatus !== 'verified') {
            await verifyProfile(userId);
            console.log(
                `Verified profile ${profile.id} for Clerk user ${userId}`
            );
        }

        return data({ success: true });
    } catch (error) {
        console.error('Error completing login:', error);
        return data({ error: 'Internal server error' }, { status: 500 });
    }
}
