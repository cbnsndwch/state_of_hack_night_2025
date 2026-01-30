import { data, type ActionFunctionArgs } from 'react-router';
import {
    getProfileBySupabaseUserId,
    updateProfile
} from '@/lib/db/profiles.server';

export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== 'POST') {
        return data({ error: 'Method not allowed' }, { status: 405 });
    }

    const formData = await request.formData();
    const supabaseUserId = formData.get('supabaseUserId') as string;
    const dismissed = formData.get('dismissed') === 'true';

    if (!supabaseUserId) {
        return data({ error: 'Missing supabaseUserId' }, { status: 400 });
    }

    // Get the profile for this user
    const profile = await getProfileBySupabaseUserId(supabaseUserId);

    if (!profile) {
        return data({ error: 'Profile not found' }, { status: 404 });
    }

    // Update the onboarding status
    await updateProfile(profile._id.toString(), {
        onboardingDismissed: dismissed
    });

    return data({ success: true });
}
