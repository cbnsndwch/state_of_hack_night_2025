import { useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { useQuery } from '@rocicorp/zero/react';
import { useAuth } from '@/hooks/use-auth';
import { useDismissOnboarding } from '@/hooks/use-zero-mutate';
import {
    profileQueries,
    projectQueries,
    badgeQueries,
    surveyResponseQueries,
    attendanceQueries
} from '@/zero/queries';
import { AppLayout } from '@/components/layout/AppLayout';
import { NeoCard } from '@/components/ui/NeoCard';
import { LiveIndicator } from '@/components/connection-status';
import { AddProjectDialog } from '@/components/projects/AddProjectDialog';
import { ProjectGallery } from '@/components/projects/ProjectGallery';
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';
import { DemoSlotBookingDialog } from '@/components/events/DemoSlotBookingDialog';
import { DemoSlotsList } from '@/components/events/DemoSlotsList';
import { ImHereButton } from '@/components/events/ImHereButton';
import { CheckInHistory } from '@/components/events/CheckInHistory';

export default function Dashboard() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const { dismissOnboarding } = useDismissOnboarding();
    const [addProjectDialogOpen, setAddProjectDialogOpen] = useState(false);

    // Use Zero queries for reactive data
    const [profile] = useQuery(
        user?.id ? profileQueries.byClerkUserId(user.id) : null
    );
    const [projects] = useQuery(
        profile?.id ? projectQueries.byMemberId(profile.id) : null
    );
    const [memberBadges] = useQuery(
        profile?.id ? badgeQueries.byMemberId(profile.id) : null
    );
    const [surveyResponses] = useQuery(
        profile?.id ? surveyResponseQueries.byMemberId(profile.id) : null
    );
    const [rsvps] = useQuery(
        profile?.id ? attendanceQueries.hasRsvps(profile.id) : null
    );

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

    // Compute derived values from Zero queries
    const projectCount = projects?.length || 0;
    const badges =
        memberBadges
            ?.map(mb => mb.badge)
            .filter((b): b is NonNullable<typeof b> => b != null) || [];
    const completedSurveys =
        surveyResponses?.map(sr => ({
            id: sr.id,
            surveyId: sr.surveyId,
            surveySlug: sr.survey?.slug || '',
            surveyTitle: sr.survey?.title || '',
            surveyDescription: sr.survey?.description || '',
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
            label: 'RSVP to a hack night',
            description:
                'Join us at The DOCK (Tuesdays) or Moonlighter (Thursdays)',
            completed: (rsvps?.length || 0) > 0,
            action: {
                label: 'View Events',
                href: 'https://luma.com/hello_miami'
            }
        }
    ];

    const handleDismissOnboarding = async () => {
        if (!profile) return;

        try {
            // Use Zero mutation to dismiss onboarding
            await dismissOnboarding(profile.id);
            // Note: No need to manually update state - Zero will sync automatically
        } catch (err) {
            console.error('Error dismissing onboarding:', err);
        }
    };

    return (
        <AppLayout isAdmin={!!profile?.isAppAdmin}>
            <main className="max-w-7xl mx-auto px-4 py-12 bg-black text-white selection:bg-primary selection:text-black min-h-full">
                <header className="mb-12">
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-4xl font-sans text-primary">
                            builder_dashboard
                        </h1>
                        <LiveIndicator />
                    </div>
                    <p className="text-zinc-400 font-sans">
                        welcome back, {user.email?.split('@')[0]}
                    </p>
                </header>

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
                        {/* Admin Panel - Shows only for admins */}
                        {profile?.isAppAdmin && (
                            <NeoCard variant="yellow">
                                <h3 className="text-lg font-sans mb-4">
                                    admin_panel
                                </h3>
                                <p className="text-sm text-zinc-400 mb-4">
                                    View survey insights and manage community
                                    data.
                                </p>
                                <div className="space-y-2">
                                    <a
                                        href={`/admin/surveys?userId=${user.id}`}
                                        className="block w-full py-2 bg-primary text-black border border-primary text-center font-sans text-sm hover:bg-primary/80 transition-all"
                                    >
                                        survey insights
                                    </a>
                                    <a
                                        href={`/admin/demo-slots?userId=${user.id}`}
                                        className="block w-full py-2 bg-primary text-black border border-primary text-center font-sans text-sm hover:bg-primary/80 transition-all"
                                    >
                                        manage demo slots
                                    </a>
                                </div>
                            </NeoCard>
                        )}

                        <ImHereButton
                            lumaAttendeeId={profile?.lumaAttendeeId}
                        />

                        <NeoCard variant="magenta">
                            <h3 className="text-lg font-sans mb-4">
                                ships_gallery
                            </h3>
                            <p className="text-sm text-zinc-400 mb-4">
                                show the community what you've been building.
                            </p>
                            <AddProjectDialog
                                open={addProjectDialogOpen}
                                onOpenChange={setAddProjectDialogOpen}
                                onProjectAdded={() => {
                                    // Zero will automatically sync the new project
                                }}
                            />
                        </NeoCard>

                        <NeoCard variant="cyan">
                            <h3 className="text-lg font-sans mb-4">
                                demo_night
                            </h3>
                            <p className="text-sm text-zinc-400 mb-4">
                                reserve a time slot to present your project at
                                an upcoming hack night.
                            </p>
                            <DemoSlotBookingDialog
                                onDemoBooked={() => {
                                    // Zero will automatically sync the new demo slot
                                }}
                            />
                        </NeoCard>
                    </div>
                </div>

                {/* Demo Slots Section */}
                <div className="mt-12">
                    <h2 className="text-2xl font-sans text-primary mb-6">
                        my_demo_slots
                    </h2>
                    <DemoSlotsList memberId={profile?.id} />
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

                {/* Check-In History Section */}
                <div className="mt-12">
                    <h2 className="text-2xl font-sans text-primary mb-6">
                        check-in_history
                    </h2>
                    <CheckInHistory />
                </div>

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

                <div className="mt-12">
                    <h2 className="text-2xl font-sans text-primary mb-6">
                        community_builds
                    </h2>
                    <ProjectGallery />
                </div>
            </main>
        </AppLayout>
    );
}
