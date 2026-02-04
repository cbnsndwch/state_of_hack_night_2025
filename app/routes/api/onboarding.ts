import { data, type ActionFunctionArgs } from 'react-router';
import {
    getProfileByClerkUserId,
    updateProfile
} from '@/lib/db/profiles.server';

export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== 'POST') {
        return data({ error: 'Method not allowed' }, { status: 405 });
    }

    const formData = await request.formData();
    const clerkUserId = formData.get('clerkUserId') as string;
    const dismissed = formData.get('dismissed') === 'true';

    if (!clerkUserId) {
        return data({ error: 'Missing clerkUserId' }, { status: 400 });
    }

    // Get the profile for this user
    const profile = await getProfileByClerkUserId(clerkUserId);

    if (!profile) {
        return data({ error: 'Profile not found' }, { status: 404 });
    }

    // Update the onboarding status
    await updateProfile(profile._id.toString(), {
        onboardingDismissed: dismissed
    });

    return data({ success: true });
}
