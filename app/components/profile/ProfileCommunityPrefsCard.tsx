import { useState } from 'react';
import { Check } from 'lucide-react';

import { NeoButton } from '@/components/ui/NeoButton';
import { NeoCard } from '@/components/ui/NeoCard';
import { cn } from '@/utils/cn';

import type { ProfileSectionProps } from './types';

// ─── Toggle preferences ─────────────────────────────────────────────────────
// These map to boolean columns on the profile. Each describes a way the member
// wants the community to serve them (or vice versa).

interface TogglePref {
    key: string;
    label: string;
    description: string;
}

const TOGGLE_PREFS: TogglePref[] = [
    {
        key: 'openToMentoring',
        label: 'Open to mentoring',
        description:
            'Help others by sharing your knowledge and experience',
    },
    {
        key: 'seekingFunding',
        label: "I'm seeking funding",
        description:
            'Make your profile visible to investors and VCs in the community',
    },
    {
        key: 'lookingForCofounder',
        label: 'Looking for a co-founder',
        description:
            'Let other builders know you are looking for someone to build with',
    },
    {
        key: 'wantProductFeedback',
        label: 'I want product feedback',
        description:
            'Get constructive feedback on your projects from fellow builders',
    },
    {
        key: 'seekingAcceleratorIntros',
        label: 'Seeking VC / accelerator intros',
        description:
            'Get introduced to investors, angels, or accelerator programs',
    },
    {
        key: 'wantToGiveBack',
        label: 'I want to give back',
        description:
            'Volunteer to host workshops, mentor newcomers, or organize events',
    },
];

// ─── Experience interests ────────────────────────────────────────────────────
// Drawn from the Luma signup question "Select top 3 experience that interest
// you the most". We keep the union of both question variations.

const EXPERIENCE_OPTIONS = [
    'hack nights',
    'hackathon',
    'demo nights',
    'workshops led by guest experts',
    'dinners with local engineers',
    'text invites to exclusive technical events in Miami',
    'expert panels',
    'explorations/workshops with new tech',
    'lab_nights with local engineers',
    'lab_nights with special guests',
    'quarterly project showcase',
    'skills workshops and trainings',
    'technical conference',
];

export function ProfileCommunityPrefsCard({
    profile,
    onSave,
    saving,
}: ProfileSectionProps) {
    // Boolean toggles
    const [toggles, setToggles] = useState<Record<string, boolean>>(() => {
        const init: Record<string, boolean> = {};
        for (const pref of TOGGLE_PREFS) {
            init[pref.key] = !!((profile as unknown) as Record<string, unknown>)[pref.key];
        }
        return init;
    });

    // Experience interests (multi-select)
    const [experiences, setExperiences] = useState<string[]>(
        (profile.interestedExperiences as string[]) ?? []
    );

    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const flipToggle = (key: string) =>
        setToggles(prev => ({ ...prev, [key]: !prev[key] }));

    const toggleExperience = (exp: string) => {
        setExperiences(prev =>
            prev.includes(exp) ? prev.filter(e => e !== exp) : [...prev, exp]
        );
    };

    const handleSave = async () => {
        setError(null);
        setSuccess(false);

        const result = await onSave({
            ...toggles,
            interestedExperiences:
                experiences.length > 0 ? experiences : undefined,
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
                <div>
                    <h2 className="text-xl font-sans text-primary border-b border-zinc-800 pb-2">
                        community_preferences
                    </h2>
                    <p className="text-xs text-zinc-500 mt-2">
                        Tell us how you want the Hello Miami community to work
                        for you. These help us match you with the right people
                        and opportunities.
                    </p>
                </div>

                {/* Toggle preferences */}
                <div className="space-y-3">
                    {TOGGLE_PREFS.map(pref => {
                        const active = toggles[pref.key];
                        return (
                            <label
                                key={pref.key}
                                className={cn(
                                    'flex items-start gap-3 p-3 cursor-pointer border-2 transition-all',
                                    active
                                        ? 'border-primary/50 bg-primary/5'
                                        : 'border-zinc-800 hover:border-zinc-700'
                                )}
                            >
                                <div className="pt-0.5">
                                    <div
                                        className={cn(
                                            'w-5 h-5 border-2 flex items-center justify-center transition-all',
                                            active
                                                ? 'bg-primary border-primary'
                                                : 'border-zinc-500 bg-black'
                                        )}
                                    >
                                        {active && (
                                            <Check className="w-3.5 h-3.5 text-black" />
                                        )}
                                    </div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={active}
                                    onChange={() => flipToggle(pref.key)}
                                    className="sr-only"
                                />
                                <div>
                                    <div className="text-sm font-sans text-zinc-200">
                                        {pref.label}
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-0.5">
                                        {pref.description}
                                    </p>
                                </div>
                            </label>
                        );
                    })}
                </div>

                {/* Experience interests */}
                <div className="space-y-3">
                    <label className="block text-sm font-sans text-zinc-300">
                        What experiences interest you most?
                    </label>
                    <p className="text-xs text-zinc-500 -mt-1">
                        Select all that apply — helps us plan events you'll
                        actually want to attend
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {EXPERIENCE_OPTIONS.map(exp => {
                            const active = experiences.includes(exp);
                            return (
                                <button
                                    key={exp}
                                    type="button"
                                    onClick={() => toggleExperience(exp)}
                                    className={cn(
                                        'px-3 py-1.5 text-sm font-sans border-2 transition-all',
                                        active
                                            ? 'bg-primary/20 text-primary border-primary/60'
                                            : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-zinc-500'
                                    )}
                                >
                                    {active ? '✓ ' : ''}
                                    {exp}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Feedback + save */}
                {error && (
                    <div className="p-3 bg-red-900/20 border border-red-500 text-red-300 text-sm font-sans">
                        {error}
                    </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                    <NeoButton
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="text-sm"
                    >
                        {saving ? 'saving...' : 'save_preferences'}
                    </NeoButton>
                    {success && (
                        <span className="flex items-center gap-1.5 text-primary text-sm font-sans">
                            <Check className="w-4 h-4" /> saved
                        </span>
                    )}
                </div>
            </div>
        </NeoCard>
    );
}
