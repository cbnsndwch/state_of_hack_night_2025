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
            lumaAttendeeId: profile.lumaAttendeeId,
            bio: profile.bio,
            skills: profile.skills || [],
            githubUsername: profile.githubUsername,
            twitterHandle: profile.twitterHandle,
            websiteUrl: profile.websiteUrl,
            role: profile.role,
            seekingFunding: profile.seekingFunding || false,
            openToMentoring: profile.openToMentoring || false,
            streakCount: profile.streakCount,
            onboardingDismissed: profile.onboardingDismissed ?? false,
            isAppAdmin: profile.isAppAdmin || false,
            createdAt: profile.createdAt.toISOString()
        },
        projectCount: projects.length
    });
}
