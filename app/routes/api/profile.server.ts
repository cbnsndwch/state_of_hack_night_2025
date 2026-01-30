import { data, type LoaderFunctionArgs } from 'react-router';
import { getProfileBySupabaseUserId } from '@/lib/db/profiles.server';
import { getProjectsByMemberId } from '@/lib/db/projects.server';

export async function loader({ request }: LoaderFunctionArgs) {
    const url = new URL(request.url);
    const supabaseUserId = url.searchParams.get('supabaseUserId');

    if (!supabaseUserId) {
        return data(
            { error: 'Missing supabaseUserId parameter' },
            { status: 400 }
        );
    }

    // Get the profile for this user (don't create if it doesn't exist)
    const profile = await getProfileBySupabaseUserId(supabaseUserId);

    if (!profile) {
        return data({ error: 'Profile not found' }, { status: 404 });
    }

    // Get their projects count
    const projects = await getProjectsByMemberId(profile._id.toString());

    return data({
        profile: {
            id: profile._id.toString(),
            supabaseUserId: profile.supabaseUserId,
            lumaEmail: profile.lumaEmail,
            verificationStatus: profile.verificationStatus,
            bio: profile.bio,
            streakCount: profile.streakCount,
            createdAt: profile.createdAt.toISOString()
        },
        projectCount: projects.length
    });
}
