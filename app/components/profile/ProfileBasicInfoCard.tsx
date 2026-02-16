import { useState } from 'react';
import { Check } from 'lucide-react';

import { NeoButton } from '@/components/ui/NeoButton';
import { NeoCard } from '@/components/ui/NeoCard';
import { NeoInput } from '@/components/ui/NeoInput';
import { NeoTextarea } from '@/components/ui/NeoTextarea';

import type { ProfileSectionProps } from './types';

export function ProfileBasicInfoCard({
    profile,
    onSave,
    saving,
}: ProfileSectionProps) {
    const [bio, setBio] = useState(profile.bio || '');
    const [role, setRole] = useState(profile.role || '');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSave = async () => {
        setError(null);
        setSuccess(false);
        const result = await onSave({
            bio: bio.trim() || undefined,
            role: role.trim() || undefined,
        });
        if (result.success) {
            setSuccess(true);
            setTimeout(() => setSuccess(false), 2500);
        } else {
            setError(result.error || 'Failed to save');
        }
    };

    return (
        <NeoCard>
            <div className="space-y-6">
                <h2 className="text-xl font-sans text-primary border-b border-zinc-800 pb-2">
                    basic_info
                </h2>

                {/* Read-only Luma fields */}
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
                        This is your verified Luma email and cannot be changed
                    </p>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-sans text-zinc-300">
                        Luma Attendee ID
                    </label>
                    <NeoInput
                        disabled
                        value={profile.lumaAttendeeId || ''}
                        className="opacity-60"
                    />
                </div>

                {/* Editable fields */}
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
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setRole(e.target.value)
                        }
                        placeholder="Software Engineer, Founder, Student, etc."
                    />
                </div>

                {/* Feedback + save */}
                {error && (
                    <div className="p-3 bg-red-900/20 border border-red-500 text-red-300 text-sm font-sans">
                        {error}
                    </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                    <NeoButton
                        data-testid="btn-save-basic-info"
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="text-sm"
                    >
                        {saving ? 'saving...' : 'save'}
                    </NeoButton>
                    {success && (
                        <span className="flex items-center gap-1.5 text-primary text-sm font-sans animate-in fade-in">
                            <Check className="w-4 h-4" /> saved
                        </span>
                    )}
                </div>
            </div>
        </NeoCard>
    );
}
