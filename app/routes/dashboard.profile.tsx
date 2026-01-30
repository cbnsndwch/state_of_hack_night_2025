import { useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Navbar } from '@/components/layout/Navbar';
import { NeoCard } from '@/components/ui/NeoCard';
import { NeoButton } from '@/components/ui/NeoButton';
import { NeoInput } from '@/components/ui/NeoInput';
import { NeoTextarea } from '@/components/ui/NeoTextarea';

interface ProfileData {
    id: string;
    supabaseUserId: string;
    lumaEmail: string;
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
}

export default function ProfileEdit() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

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

    useEffect(() => {
        if (!loading && !user) {
            navigate('/');
        }
    }, [user, loading, navigate]);

    useEffect(() => {
        if (user) {
            fetch(`/api/profile?supabaseUserId=${user.id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.profile) {
                        setProfile(data.profile);
                        // Populate form with existing data
                        setBio(data.profile.bio || '');
                        setLumaAttendeeId(data.profile.lumaAttendeeId || '');
                        setSkillsInput(data.profile.skills?.join(', ') || '');
                        setGithubUsername(data.profile.githubUsername || '');
                        setTwitterHandle(data.profile.twitterHandle || '');
                        setWebsiteUrl(data.profile.websiteUrl || '');
                        setRole(data.profile.role || '');
                        setSeekingFunding(data.profile.seekingFunding || false);
                        setOpenToMentoring(
                            data.profile.openToMentoring || false
                        );
                    }
                })
                .catch(err => console.error('Error fetching profile:', err));
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !profile) return;

        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            // Parse skills from comma-separated input
            const skills = skillsInput
                .split(',')
                .map(s => s.trim())
                .filter(s => s.length > 0);

            const formData = new FormData();
            formData.append('profileId', profile.id);
            formData.append('bio', bio);
            formData.append('lumaAttendeeId', lumaAttendeeId);
            formData.append('skills', JSON.stringify(skills));
            formData.append('githubUsername', githubUsername);
            formData.append('twitterHandle', twitterHandle);
            formData.append('websiteUrl', websiteUrl);
            formData.append('role', role);
            formData.append('seekingFunding', seekingFunding.toString());
            formData.append('openToMentoring', openToMentoring.toString());

            const response = await fetch('/api/profile-update', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update profile');
            }

            setSuccess(true);
            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Failed to update profile'
            );
        } finally {
            setSaving(false);
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

    if (!user || !profile) return null;

    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary selection:text-black">
            <Navbar />
            <main className="max-w-4xl mx-auto px-4 py-12">
                <header className="mb-8">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-zinc-400 hover:text-white font-sans text-sm mb-4 flex items-center gap-2"
                    >
                        <span>←</span> back to dashboard
                    </button>
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
                                <NeoTextarea
                                    value={bio}
                                    onChange={(
                                        e: React.ChangeEvent<HTMLTextAreaElement>
                                    ) => setBio(e.target.value)}
                                    placeholder="Tell the community about yourself, what you're building, or what you're interested in learning..."
                                    rows={4}
                                />
                            </div>
                        </div>

                        {/* Skills */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-sans text-primary border-b border-zinc-800 pb-2">
                                skills_&_interests
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
                                    placeholder="e.g., Python, React, Hardware, CAD design"
                                />
                                <p className="text-xs text-zinc-500">
                                    Separate skills with commas
                                </p>
                            </div>
                        </div>

                        {/* Social Links */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-sans text-primary border-b border-zinc-800 pb-2">
                                social_links
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

                        {/* Luma Integration */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-sans text-primary border-b border-zinc-800 pb-2">
                                luma_integration
                            </h2>

                            <div className="space-y-2">
                                <label className="block text-sm font-sans text-zinc-300">
                                    Luma Attendee ID
                                </label>
                                <NeoInput
                                    value={lumaAttendeeId}
                                    onChange={(
                                        e: React.ChangeEvent<HTMLInputElement>
                                    ) => setLumaAttendeeId(e.target.value)}
                                    placeholder="att-xxxxxxxxxxxxx"
                                />
                                <p className="text-xs text-zinc-500">
                                    Link your Luma account for automated
                                    check-ins and attendance tracking
                                </p>
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
        </div>
    );
}
