import { useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Navbar } from '@/components/layout/Navbar';
import { NeoCard } from '@/components/ui/NeoCard';
import { AddProjectDialog } from '@/components/projects/AddProjectDialog';
import { ProjectGallery } from '@/components/projects/ProjectGallery';
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';

interface Profile {
    id: string;
    supabaseUserId: string;
    lumaAttendeeId: string | null;
    bio: string | null;
    skills: string[];
    githubUsername: string | null;
    twitterHandle: string | null;
    websiteUrl: string | null;
    role: string | null;
    seekingFunding: boolean;
    openToMentoring: boolean;
    streakCount: number;
    onboardingDismissed: boolean;
    createdAt: string;
}

export default function Dashboard() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [projectCount, setProjectCount] = useState(0);
    const [refreshKey, setRefreshKey] = useState(0);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [addProjectDialogOpen, setAddProjectDialogOpen] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            navigate('/');
        }
    }, [user, loading, navigate]);

    useEffect(() => {
        if (user) {
            // Fetch profile and project count from API
            fetch(`/api/profile?supabaseUserId=${user.id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.profile) {
                        setProfile(data.profile);
                        setProjectCount(data.projectCount);
                        // Show onboarding if not dismissed
                        setShowOnboarding(!data.profile.onboardingDismissed);
                    }
                })
                .catch(err => console.error('Error fetching profile:', err));
        }
    }, [user, refreshKey]);

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
            completed: false, // TODO: Track RSVPs when event system is implemented
            action: {
                label: 'View Events',
                href: 'https://luma.com/hello_miami'
            }
        }
    ];

    const handleDismissOnboarding = async () => {
        if (!user) return;

        try {
            const formData = new FormData();
            formData.append('supabaseUserId', user.id);
            formData.append('dismissed', 'true');

            await fetch('/api/onboarding', {
                method: 'POST',
                body: formData
            });

            setShowOnboarding(false);
        } catch (err) {
            console.error('Error dismissing onboarding:', err);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary selection:text-black">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-12">
                <header className="mb-12">
                    <h1 className="text-4xl font-sans text-primary mb-2">
                        builder_dashboard
                    </h1>
                    <p className="text-zinc-400 font-sans">
                        welcome back,{' '}
                        {user.user_metadata.full_name ||
                            user.email?.split('@')[0]}
                    </p>
                </header>

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
                                    {user.user_metadata.avatar_url ? (
                                        <img
                                            src={user.user_metadata.avatar_url}
                                            alt="profile"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="text-3xl font-bold">
                                            ?
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="text-lg font-sans">
                                        {user.user_metadata.full_name ||
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
                        <NeoCard variant="cyan">
                            <h3 className="text-lg font-sans mb-4">
                                upcoming_events
                            </h3>
                            <p className="text-sm text-zinc-400 mb-4">
                                check into the next hack night to start your
                                streak.
                            </p>
                            <a
                                href="https://luma.com/hello_miami"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full py-2 bg-black border border-white text-center font-sans text-sm hover:invert transition-all"
                            >
                                view on luma
                            </a>
                        </NeoCard>

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
                                    // Trigger refresh of profile data
                                    setRefreshKey(k => k + 1);
                                }}
                            />
                        </NeoCard>
                    </div>
                </div>

                <div className="mt-12">
                    <h2 className="text-2xl font-sans text-primary mb-6">
                        community_builds
                    </h2>
                    <ProjectGallery />
                </div>
            </main>
        </div>
    );
}
