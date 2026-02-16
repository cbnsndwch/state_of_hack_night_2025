import { useState } from 'react';
import { Check } from 'lucide-react';

import { NeoButton } from '@/components/ui/NeoButton';
import { NeoCard } from '@/components/ui/NeoCard';

import { SkillTagInput } from './SkillTagInput';
import type { ProfileSectionProps } from './types';

/**
 * Specialty options drawn from the Luma "Select all your specialties" question.
 * Displayed as toggle-able chips so users can self-identify broadly.
 */
const SPECIALTY_OPTIONS = [
    'AR/VR',
    'aerospace',
    'chemical/ag/bio',
    'civil/industrial',
    'data/AI',
    'design',
    'firmware',
    'hardware/electrical',
    'mechanical',
    'software',
];

export function ProfileSkillsCard({
    profile,
    onSave,
    saving,
}: ProfileSectionProps) {
    const [skills, setSkills] = useState<string[]>(
        (profile.skills as string[]) ?? []
    );
    const [specialties, setSpecialties] = useState<string[]>(
        (profile.specialties as string[]) ?? []
    );
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const toggleSpecialty = (s: string) => {
        setSpecialties(prev =>
            prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
        );
    };

    const handleSave = async () => {
        setError(null);
        setSuccess(false);
        const result = await onSave({
            skills: skills.length > 0 ? skills : undefined,
            specialties: specialties.length > 0 ? specialties : undefined,
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
                    skills_and_interests
                </h2>

                {/* Specialties — chip selector */}
                <div className="space-y-3">
                    <label className="block text-sm font-sans text-zinc-300">
                        Specialties
                    </label>
                    <p className="text-xs text-zinc-500 -mt-1">
                        Select all that apply — helps us match you with the right
                        people and events
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {SPECIALTY_OPTIONS.map(s => {
                            const active = specialties.includes(s);
                            return (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => toggleSpecialty(s)}
                                    className={`px-3 py-1.5 text-sm font-sans border-2 transition-all ${
                                        active
                                            ? 'bg-primary/20 text-primary border-primary/60'
                                            : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-zinc-500'
                                    }`}
                                >
                                    {active ? '✓ ' : ''}
                                    {s}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Skills — tag input with autocomplete */}
                <div className="space-y-2">
                    <label className="block text-sm font-sans text-zinc-300">
                        Skills & Technologies
                    </label>
                    <SkillTagInput value={skills} onChange={setSkills} />
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
                        {saving ? 'saving...' : 'save_skills'}
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
