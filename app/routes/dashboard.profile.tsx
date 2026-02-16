import { useEffect, useState } from 'react';
import { useLoaderData, useNavigate } from 'react-router';

import { AppLayout } from '@/components/layout/AppLayout';
import { NeoButton } from '@/components/ui/NeoButton';
import { NeoCard } from '@/components/ui/NeoCard';
import { NeoInput } from '@/components/ui/NeoInput';
import { NeoTextarea } from '@/components/ui/NeoTextarea';
import { useAuth } from '@/hooks/use-auth';
import { useSafeQuery } from '@/hooks/use-safe-query';
import { useUpdateProfile } from '@/hooks/use-zero-mutate';
import {
    createDashboardLoader,
    type DashboardLoaderData
} from '@/lib/create-dashboard-loader.server';
import { profileQueries } from '@/zero/queries';
import { Button } from '@/components/ui/button';

export { DashboardErrorBoundary as ErrorBoundary } from '@/components/layout/DashboardErrorBoundary';

/**
 * Server-side loader: uses createDashboardLoader for auth + profile.
 * Profile data is available immediately on navigation, without waiting for Zero.
 */
export const loader = createDashboardLoader();

type LoaderData = DashboardLoaderData;

export default function ProfileEdit() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const { updateProfile, isLoading: saving } = useUpdateProfile();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Server-side loader data (available immediately on navigation)
    const loaderData = useLoaderData<LoaderData>();
    const serverProfile = loaderData?.profile ?? null;

    // Form state
    const [bio, setBio] = useState('');
    const [lumaAttendeeId, setLumaAttendeeId] = useState('');
    const [skillsInput, setSkillsInput] = useState('');
    const [githubUsername, setGithubUsername] = useState('');
    const [twitterHandle, setTwitterHandle] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [role, setRole] = useState('');
    const [seekingFunding, setSeekingFunding] = useState(false);
    const [openToMentoring, setOpenToMentoring] = useState(false);

    // Use Zero for reactive updates (SSR-safe — disabled until Zero connects)
    const [zeroProfile] = useSafeQuery(
        user?.id ? profileQueries.byClerkUserId(user.id) : null
    );

    // Prefer Zero's reactive data when available, fall back to server-loaded profile
    const profile = zeroProfile ?? serverProfile ?? null;
    const [formInitialized, setFormInitialized] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            navigate('/');
        }
    }, [user, loading, navigate]);

    // Populate form when profile loads (only once, or when Zero provides fresher data)
    useEffect(() => {
        if (profile && !formInitialized) {
            setBio(profile.bio || '');
            setLumaAttendeeId(profile.lumaAttendeeId || '');
            setSkillsInput((profile.skills as string[])?.join(', ') || '');
            setGithubUsername(profile.githubUsername || '');
            setTwitterHandle(profile.twitterHandle || '');
            setWebsiteUrl(profile.websiteUrl || '');
            setRole(profile.role || '');
            setSeekingFunding(profile.seekingFunding || false);
            setOpenToMentoring(profile.openToMentoring || false);
            setFormInitialized(true);
        }
    }, [profile, formInitialized]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !profile) return;

        setError(null);
        setSuccess(false);

        try {
            // Parse skills from comma-separated input
            const skills = skillsInput
                .split(',')
                .map(s => s.trim())
                .filter(s => s.length > 0);

            // Call Zero mutation to update profile
            const result = await updateProfile({
                id: profile.id,
                bio: bio.trim() || undefined,
                lumaAttendeeId: lumaAttendeeId.trim() || undefined,
                skills: skills.length > 0 ? skills : undefined,
                githubUsername: githubUsername.trim() || undefined,
                twitterHandle: twitterHandle.trim() || undefined,
                websiteUrl: websiteUrl.trim() || undefined,
                role: role.trim() || undefined,
                seekingFunding,
                openToMentoring
            });

            if (!result.success) {
                throw new Error(result.error || 'Failed to update profile');
            }

            setSuccess(true);
            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Failed to update profile'
            );
        }
    };

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

    if (!profile) {
        // Server loader returned null — profile genuinely doesn't exist
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
                <div className="text-red-500 font-sans mb-4">
                    Profile not found. Please try refreshing or re-login.
                </div>
                <NeoButton onClick={() => window.location.reload()}>
                    Retry
                </NeoButton>
            </div>
        );
    }

    return (
        <AppLayout isAdmin={!!profile?.isAppAdmin}>
            <main className="max-w-4xl mx-auto bg-black text-white selection:bg-primary selection:text-black min-h-full">
                <header className="mb-8">
                    <Button
                        variant="ghost"
                        className="text-zinc-400 hover:text-white font-sans text-sm mb-4 flex items-center gap-2"
                        onClick={() => navigate('/dashboard')}
                    >
                        <span>←</span> back to dashboard
                    </Button>
                    <h1 className="text-4xl font-sans text-primary mb-2">
                        edit_profile
                    </h1>
                    <p className="text-zinc-400 font-sans">
                        complete your builder profile
                    </p>
                </header>

                <NeoCard>
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Basic Info */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-sans text-primary border-b border-zinc-800 pb-2">
                                basic_info
                            </h2>

                            {/* Luma Integration */}
                            <div className="space-y-2">
                                <label className="block text-sm font-sans text-zinc-300">
                                    Email (from Luma)
                                </label>
                                <NeoInput
                                    value={profile.lumaEmail}
                                    disabled
                                    className="opacity-60"
                                />
                                <p className="text-xs text-zinc-500">
                                    This is your verified Luma email and cannot
                                    be changed
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-sans text-zinc-300">
                                    Luma Attendee ID
                                </label>
                                <NeoInput
                                    disabled
                                    value={lumaAttendeeId}
                                    onChange={(
                                        e: React.ChangeEvent<HTMLInputElement>
                                    ) => setLumaAttendeeId(e.target.value)}
                                    placeholder="att-xxxxxxxxxxxxx"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-sans text-zinc-300">
                                    Bio
                                </label>
                                <NeoTextarea
                                    value={bio}
                                    onChange={e => setBio(e.target.value)}
                                    placeholder="Tell the community about yourself, what you're building, or what you're interested in learning..."
                                    rows={4}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-sans text-zinc-300">
                                    Role / Occupation
                                </label>
                                <NeoInput
                                    value={role}
                                    onChange={(
                                        e: React.ChangeEvent<HTMLInputElement>
                                    ) => setRole(e.target.value)}
                                    placeholder="Software Engineer, Founder, Student, etc."
                                />
                            </div>
                        </div>

                        {/* Skills */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-sans text-primary border-b border-zinc-800 pb-2">
                                skills_and_interests
                            </h2>

                            <div className="space-y-2">
                                <label className="block text-sm font-sans text-zinc-300">
                                    Skills & Technologies
                                </label>
                                <NeoInput
                                    value={skillsInput}
                                    onChange={(
                                        e: React.ChangeEvent<HTMLInputElement>
                                    ) => setSkillsInput(e.target.value)}
                                    placeholder="e.g., python, react, hardware, light mapping, 3d printing, CAD, lovable, v0, etc."
                                />
                                <p className="text-xs text-zinc-500">
                                    Separate skills with commas
                                </p>
                            </div>
                        </div>

                        {/* Social Links */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-sans text-primary border-b border-zinc-800 pb-2">
                                socials
                            </h2>

                            <div className="space-y-2">
                                <label className="block text-sm font-sans text-zinc-300">
                                    GitHub Username
                                </label>
                                <NeoInput
                                    value={githubUsername}
                                    onChange={(
                                        e: React.ChangeEvent<HTMLInputElement>
                                    ) => setGithubUsername(e.target.value)}
                                    placeholder="username"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-sans text-zinc-300">
                                    Twitter/X Handle
                                </label>
                                <NeoInput
                                    value={twitterHandle}
                                    onChange={(
                                        e: React.ChangeEvent<HTMLInputElement>
                                    ) => setTwitterHandle(e.target.value)}
                                    placeholder="@handle"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-sans text-zinc-300">
                                    Website / Portfolio
                                </label>
                                <NeoInput
                                    value={websiteUrl}
                                    onChange={(
                                        e: React.ChangeEvent<HTMLInputElement>
                                    ) => setWebsiteUrl(e.target.value)}
                                    placeholder="https://yoursite.com"
                                    type="url"
                                />
                            </div>
                        </div>

                        {/* Community Preferences */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-sans text-primary border-b border-zinc-800 pb-2">
                                community_preferences
                            </h2>

                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={seekingFunding}
                                    onChange={e =>
                                        setSeekingFunding(e.target.checked)
                                    }
                                    className="mt-1 w-4 h-4 bg-black border-2 border-zinc-400 checked:bg-primary checked:border-primary"
                                />
                                <div>
                                    <div className="text-sm font-sans text-zinc-300">
                                        I'm seeking funding
                                    </div>
                                    <p className="text-xs text-zinc-500">
                                        Make your profile visible to investors
                                        and VCs in the community
                                    </p>
                                </div>
                            </label>

                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={openToMentoring}
                                    onChange={e =>
                                        setOpenToMentoring(e.target.checked)
                                    }
                                    className="mt-1 w-4 h-4 bg-black border-2 border-zinc-400 checked:bg-primary checked:border-primary"
                                />
                                <div>
                                    <div className="text-sm font-sans text-zinc-300">
                                        Open to mentoring
                                    </div>
                                    <p className="text-xs text-zinc-500">
                                        Help others by sharing your knowledge
                                        and experience
                                    </p>
                                </div>
                            </label>
                        </div>

                        {/* Error/Success Messages */}
                        {error && (
                            <div className="p-4 bg-red-900/20 border border-red-500 text-red-300 text-sm font-sans">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="p-4 bg-green-900/20 border border-primary text-primary text-sm font-sans">
                                Profile updated successfully! Redirecting...
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-4 pt-4">
                            <NeoButton
                                type="submit"
                                disabled={saving}
                                className="flex-1"
                            >
                                {saving ? 'saving...' : 'save_profile'}
                            </NeoButton>
                            <NeoButton
                                type="button"
                                variant="secondary"
                                onClick={() => navigate('/dashboard')}
                                disabled={saving}
                            >
                                cancel
                            </NeoButton>
                        </div>
                    </form>
                </NeoCard>
            </main>
        </AppLayout>
    );
}
