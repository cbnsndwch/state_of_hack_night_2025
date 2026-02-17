/* eslint-disable @typescript-eslint/no-explicit-any */
import { useNavigate, useLoaderData } from 'react-router';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useSafeQuery } from '@/hooks/use-safe-query';
import { useZeroConnection } from '@/components/providers/zero-provider';
import { mutators } from '@/zero/mutators';

import {
    profileQueries,
    projectQueries,
    badgeQueries,
    surveyResponseQueries,
    attendanceQueries
} from '@/zero/queries';
import { AppLayout } from '@/components/layout/AppLayout';
import { NeoCard } from '@/components/ui/NeoCard';
import { AddProjectDialog } from '@/components/projects/AddProjectDialog';
import { ProjectGallery } from '@/components/projects/ProjectGallery';
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';
import { ImHereButton } from '@/components/events/ImHereButton';
import { UpcomingDemoSlots } from '@/components/events/UpcomingDemoSlots';
import {
    createDashboardLoader,
    type DashboardLoaderData
} from '@/lib/create-dashboard-loader.server';
import { getProjectsByMemberId } from '@/lib/db/projects.server';
import { getMemberBadges } from '@/lib/db/badges.server';
import { getMemberSurveyResponses } from '@/lib/db/survey-responses.server';

export { DashboardErrorBoundary as ErrorBoundary } from '@/components/layout/DashboardErrorBoundary';

/**
 * Server-side loader: fetch profile + projects + badges from Postgres.
 * This provides immediate data during SSR. Zero queries take over for
 * live/reactive updates after hydration.
 */
export const loader = createDashboardLoader(async ({ profile }) => {
    const projects = profile ? await getProjectsByMemberId(profile.id) : [];
    const memberBadges = profile ? await getMemberBadges(profile.id) : [];
    const surveyResponses = profile
        ? await getMemberSurveyResponses(profile.id)
        : [];
    return { projects, memberBadges, surveyResponses };
});

type LoaderData = DashboardLoaderData<{
    projects: Awaited<ReturnType<typeof getProjectsByMemberId>>;
    memberBadges: Awaited<ReturnType<typeof getMemberBadges>>;
    surveyResponses: Awaited<ReturnType<typeof getMemberSurveyResponses>>;
}>;

export default function Dashboard() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const [addProjectDialogOpen, setAddProjectDialogOpen] = useState(false);
    const { zero } = useZeroConnection();

    // Server-side loader data (available immediately on navigation)
    const loaderData = useLoaderData<LoaderData>();

    // Zero queries for live/reactive data (activate after hydration)
    const [zeroProfile] = useSafeQuery(
        user?.id ? profileQueries.byClerkUserId(user.id) : null
    );

    // Resolve profile early so downstream Zero queries can activate even if
    // zeroProfile hasn't synced yet (using the loader-provided profile ID).
    const profile = zeroProfile ?? loaderData?.profile ?? null;

    const [zeroProjects, zeroProjectsStatus] = useSafeQuery(
        profile?.id ? projectQueries.byMemberId(profile.id) : null
    );
    const [zeroMemberBadges, zeroBadgesStatus] = useSafeQuery(
        profile?.id ? badgeQueries.byMemberId(profile.id) : null
    );
    const [zeroSurveyResponses, zeroSurveyStatus] = useSafeQuery(
        profile?.id
            ? surveyResponseQueries.byMemberId(profile.id)
            : null
    );
    const [rsvps] = useSafeQuery(
        profile?.id ? attendanceQueries.hasRsvps(profile.id) : null
    );

    // Prefer Zero's reactive data once the query has fully synced
    // ('complete'). Before that, Zero returns [] for collection queries
    // — which the ?? operator treats as truthy, silently hiding loader data.
    const projects =
        (zeroProjectsStatus?.type === 'complete' ? zeroProjects : null) ??
        loaderData?.projects ??
        null;
    const memberBadges =
        (zeroBadgesStatus?.type === 'complete' ? zeroMemberBadges : null) ??
        loaderData?.memberBadges ??
        null;
    const surveyResponses =
        (zeroSurveyStatus?.type === 'complete'
            ? zeroSurveyResponses
            : null) ??
        loaderData?.surveyResponses ??
        null;

    // Redirect to home if not authenticated
    useEffect(() => {
        if (!loading && !user) {
            navigate('/');
        }
    }, [user, loading, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="font-sans text-primary animate-pulse">
                    loading...
                </div>
            </div>
        );
    }

    if (!user) return null;

    // Compute derived values
    const projectCount = projects?.length || 0;
    // Zero memberBadges have .badge relation; server data has badge fields directly
    const badges = (() => {
        if (!memberBadges || memberBadges.length === 0) return [];
        // Check if this is Zero data (has .badge relation) or server data
        const first = memberBadges[0];
        if ('badge' in first && first.badge) {
            // Zero query result with .badge relation
            return memberBadges
                .map((mb: any) => mb.badge)
                .filter((b: unknown): b is NonNullable<typeof b> => b != null);
        }
        // Server data — badges are flat objects from getMemberBadges join
        return memberBadges as any[];
    })();
    const completedSurveys =
        surveyResponses?.map((sr: any) => ({
            id: sr.id,
            surveyId: sr.surveyId,
            surveySlug: sr.survey?.slug || sr.surveySlug || '',
            surveyTitle: sr.survey?.title || sr.surveyTitle || '',
            surveyDescription:
                sr.survey?.description || sr.surveyDescription || '',
            submittedAt: sr.submittedAt
                ? new Date(sr.submittedAt).toISOString()
                : new Date().toISOString()
        })) || [];
    const showOnboarding = profile && !profile.onboardingDismissed;

    // Define onboarding checklist items
    const onboardingItems = [
        {
            id: 'profile-complete',
            label: 'Complete your profile',
            description: 'Add a bio and link your Luma Attendee ID',
            completed: !!(profile?.bio && profile?.lumaAttendeeId),
            action: {
                label: 'Edit Profile',
                href: '/dashboard/profile'
            }
        },
        {
            id: 'first-project',
            label: 'Share your first project',
            description: "Show the community what you're building",
            completed: projectCount > 0,
            action: {
                label: 'Add Project',
                onClick: () => setAddProjectDialogOpen(true)
            }
        },
        {
            id: 'rsvp-event',
            label: 'RSVP to your next hack night',
            description:
                'Join us at The DOCK (Tuesdays) or Moonlighter (Thursdays)',
            completed: (rsvps?.length || 0) > 1,
            action: {
                label: 'View Events',
                href: 'https://luma.com/hello_miami'
            }
        }
    ];

    const handleDismissOnboarding = async () => {
        if (!profile || !zero) return;

        try {
            zero.mutate(
                mutators.profiles.update({
                    id: profile.id,
                    onboardingDismissed: true
                })
            );
        } catch (err) {
            console.error('Error dismissing onboarding:', err);
        }
    };

    return (
        <AppLayout isAdmin={!!profile?.isAppAdmin}>
            <main className="max-w-7xl mx-auto bg-black text-white selection:bg-primary selection:text-black min-h-full">
                {/* Luma Attendee ID Prompt - Shows if not linked */}
                {profile && !profile.lumaAttendeeId && (
                    <div className="mb-8">
                        <div className="bg-yellow-900/20 border-2 border-yellow-500 p-6 neo-shadow-yellow">
                            <div className="flex items-start gap-4">
                                <div className="text-3xl">⚠️</div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-sans text-yellow-400 mb-2">
                                        link_your_luma_account
                                    </h3>
                                    <p className="text-sm text-zinc-300 mb-4">
                                        Connect your Luma Attendee ID to enable
                                        automated check-ins and attendance
                                        tracking. This helps us recognize your
                                        participation at hack nights.
                                    </p>
                                    <a
                                        href="/dashboard/profile"
                                        className="inline-block px-4 py-2 bg-yellow-500 text-black border-2 border-yellow-500 font-sans text-sm hover:bg-yellow-400 transition-colors neo-shadow"
                                    >
                                        add_luma_id
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Onboarding Checklist */}
                {showOnboarding && (
                    <div className="mb-8">
                        <OnboardingChecklist
                            items={onboardingItems}
                            onDismiss={handleDismissOnboarding}
                        />
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Profile Stats */}
                    <NeoCard className="md:col-span-2">
                        <h2 className="text-xl font-sans text-primary mb-6">
                            profile
                        </h2>
                        <div className="space-y-6">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center">
                                    <div className="text-3xl font-bold">
                                        {user.email?.charAt(0).toUpperCase()}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-lg font-sans">
                                        {user.email?.split('@')[0] ||
                                            'anonymous builder'}
                                    </div>
                                    <div className="text-zinc-500 font-sans text-sm">
                                        {user.email}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-zinc-900/50 border border-zinc-800">
                                    <div className="text-xs font-sans text-zinc-500 mb-1">
                                        attendance streak
                                    </div>
                                    <div className="text-2xl font-sans text-primary">
                                        {profile?.streakCount || 0} weeks
                                    </div>
                                </div>
                                <div className="p-4 bg-zinc-900/50 border border-zinc-800">
                                    <div className="text-xs font-sans text-zinc-500 mb-1">
                                        total hacks
                                    </div>
                                    <div className="text-2xl font-sans text-primary">
                                        {projectCount}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </NeoCard>

                    {/* Quick Links / Actions */}
                    <div className="space-y-6">
                        <ImHereButton
                            lumaAttendeeId={profile?.lumaAttendeeId}
                        />

                        <UpcomingDemoSlots />

                        <NeoCard variant="magenta">
                            <h3 className="text-lg font-sans mb-4">
                                ships_gallery
                            </h3>
                            <p className="text-sm text-zinc-400 mb-4">
                                show the community what you've been building.
                            </p>
                            <AddProjectDialog
                                memberId={profile?.id ?? ''}
                                open={addProjectDialogOpen}
                                onOpenChange={setAddProjectDialogOpen}
                                onProjectAdded={() => {
                                    // Zero will automatically sync the new project
                                }}
                            />
                        </NeoCard>
                    </div>
                </div>

                {/* Badges Section */}
                {badges.length > 0 && (
                    <div className="mt-12">
                        <h2 className="text-2xl font-sans text-primary mb-6">
                            badges_earned
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {badges.map(badge => (
                                <NeoCard key={badge.id} className="p-6">
                                    <div className="text-center mb-3">
                                        <div
                                            className="text-4xl mb-2 font-mono"
                                            style={{
                                                whiteSpace: 'pre-wrap',
                                                lineHeight: 1.2
                                            }}
                                        >
                                            {badge.iconAscii}
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-sans text-primary mb-2 text-center">
                                        {badge.name}
                                    </h3>
                                    <p className="text-sm text-zinc-400 text-center">
                                        {badge.criteria}
                                    </p>
                                </NeoCard>
                            ))}
                        </div>
                    </div>
                )}

                {/* Completed Surveys Section */}
                {completedSurveys.length > 0 && (
                    <div className="mt-12">
                        <h2 className="text-2xl font-sans text-primary mb-6">
                            survey_insights
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {completedSurveys.map(survey => (
                                <NeoCard key={survey.id} className="p-6">
                                    <h3 className="text-lg font-sans text-primary mb-2">
                                        {survey.surveyTitle}
                                    </h3>
                                    <p className="text-sm text-zinc-400 mb-4 line-clamp-2">
                                        {survey.surveyDescription}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-zinc-500">
                                            Completed:{' '}
                                            {new Date(
                                                survey.submittedAt
                                            ).toLocaleDateString()}
                                        </span>
                                        <a
                                            href={`/dashboard/survey/${survey.surveySlug}/results?clerkUserId=${user.id}`}
                                            className="px-4 py-2 bg-primary text-black border-2 border-black font-sans text-sm hover:translate-x-px hover:translate-y-px transition-transform"
                                        >
                                            view_results
                                        </a>
                                    </div>
                                </NeoCard>
                            ))}
                        </div>
                    </div>
                )}

                <ProjectGallery />
            </main>
        </AppLayout>
    );
}
