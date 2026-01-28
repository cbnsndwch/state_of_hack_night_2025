import { data, type LoaderFunctionArgs } from 'react-router';
import {
    getProfileBySupabaseUserId,
    getOrCreateProfile
} from '@/lib/db/profiles.server';
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

    // Get or create the profile for this user
    const profile = await getOrCreateProfile(supabaseUserId);

    // Get their projects count
    const projects = await getProjectsByMemberId(profile._id.toString());

    return data({
        profile: {
            id: profile._id.toString(),
            supabaseUserId: profile.supabaseUserId,
            githubUid: profile.githubUid,
            bio: profile.bio,
            streakCount: profile.streakCount,
            createdAt: profile.createdAt.toISOString()
        },
        projectCount: projects.length
    });
}
