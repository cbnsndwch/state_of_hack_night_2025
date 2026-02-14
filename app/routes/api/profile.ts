import { data, type LoaderFunctionArgs } from 'react-router';

import { getProfileByClerkUserId } from '@/lib/db/profiles.server';
import { getProjectsByMemberId } from '@/lib/db/projects.server';
import { getMemberCompletedSurveysWithDetails } from '@/lib/db/survey-responses.server';
import { getMemberBadges } from '@/lib/db/badges.server';

export async function loader({ request }: LoaderFunctionArgs) {
    const url = new URL(request.url);
    const clerkUserId = url.searchParams.get('clerkUserId');

    if (!clerkUserId) {
        return data(
            { error: 'Missing clerkUserId parameter' },
            { status: 400 }
        );
    }

    // Get the profile for this user (don't create if it doesn't exist)
    const profile = await getProfileByClerkUserId(clerkUserId);

    if (!profile) {
        return data({ error: 'Profile not found' }, { status: 404 });
    }

    // Get their projects count
    const projects = await getProjectsByMemberId(profile.id.toString());

    // Get completed surveys with details
    const completedSurveys = await getMemberCompletedSurveysWithDetails(
        profile.id.toString()
    );

    // Get member badges
    const badges = await getMemberBadges(profile.id.toString());

    return data({
        profile: {
            id: profile.id.toString(),
            clerkUserId: profile.clerkUserId,
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
        projectCount: projects.length,
        completedSurveys: completedSurveys.map(s => ({
            id: s.id.toString(),
            surveyId: s.surveyId.toString(),
            surveySlug: s.surveySlug,
            surveyTitle: s.surveyTitle,
            surveyDescription: s.surveyDescription,
            submittedAt: s.submittedAt.toISOString()
        })),
        badges: badges.map(b => ({
            id: b.id.toString(),
            name: b.name,
            iconAscii: b.iconAscii,
            criteria: b.criteria,
            createdAt: b.createdAt.toISOString()
        }))
    });
}
