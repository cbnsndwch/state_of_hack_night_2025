import { useCallback, useState } from 'react';
import { Check, ExternalLink, Loader2 } from 'lucide-react';

import { NeoButton } from '@/components/ui/NeoButton';
import { NeoCard } from '@/components/ui/NeoCard';
import { cn } from '@/utils/cn';

import type { ProfileSectionProps } from './types';

/** Lightweight debounce helper */
function useDebouncedCallback<T extends (...args: never[]) => void>(
    fn: T,
    delay: number
): T {
    const timer = { current: null as ReturnType<typeof setTimeout> | null };
    return useCallback(
        ((...args: Parameters<T>) => {
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => fn(...args), delay);
        }) as T,
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [fn, delay]
    );
}

interface SocialFieldConfig {
    key: string;
    label: string;
    prefix: string;
    placeholder: string;
    validate: (value: string) => string | null;
    buildUrl: (value: string) => string;
}

const SOCIAL_FIELDS: SocialFieldConfig[] = [
    {
        key: 'githubUsername',
        label: 'GitHub',
        prefix: 'github.com/',
        placeholder: 'username',
        validate: (v: string) => {
            if (!v) return null;
            if (/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(v))
                return null;
            return 'Invalid GitHub username format';
        },
        buildUrl: (v: string) => `https://github.com/${v}`
    },
    {
        key: 'twitterHandle',
        label: 'Twitter / X',
        prefix: 'x.com/',
        placeholder: 'handle',
        validate: (v: string) => {
            if (!v) return null;
            const cleaned = v.replace(/^@/, '');
            if (/^[a-zA-Z0-9_]{1,15}$/.test(cleaned)) return null;
            return 'Invalid Twitter handle format';
        },
        buildUrl: (v: string) => `https://x.com/${v.replace(/^@/, '')}`
    },
    {
        key: 'linkedinUrl',
        label: 'LinkedIn',
        prefix: 'linkedin.com/in/',
        placeholder: 'profile-slug',
        validate: (v: string) => {
            if (!v) return null;
            // Accept full URL or just the slug
            if (v.startsWith('http')) {
                try {
                    const url = new URL(v);
                    if (url.hostname.includes('linkedin.com')) return null;
                } catch {
                    // fall through
                }
                return 'Enter a valid LinkedIn profile URL or slug';
            }
            if (/^[a-zA-Z0-9-]{3,100}$/.test(v)) return null;
            return 'Invalid LinkedIn profile slug';
        },
        buildUrl: (v: string) => {
            if (v.startsWith('http')) return v;
            return `https://linkedin.com/in/${v}`;
        }
    },
    {
        key: 'websiteUrl',
        label: 'Website / Portfolio',
        prefix: '',
        placeholder: 'https://yoursite.com',
        validate: (v: string) => {
            if (!v) return null;
            try {
                new URL(v.startsWith('http') ? v : `https://${v}`);
                return null;
            } catch {
                return 'Enter a valid URL';
            }
        },
        buildUrl: (v: string) => (v.startsWith('http') ? v : `https://${v}`)
    }
];

type VerifyStatus = 'idle' | 'checking' | 'valid' | 'invalid';

export function ProfileSocialsCard({
    profile,
    onSave,
    saving
}: ProfileSectionProps) {
    const [fields, setFields] = useState<Record<string, string>>({
        githubUsername: profile.githubUsername || '',
        twitterHandle: (profile.twitterHandle || '').replace(/^@/, ''),
        linkedinUrl: profile.linkedinUrl || '',
        websiteUrl: profile.websiteUrl || ''
    });
    const [validationErrors, setValidationErrors] = useState<
        Record<string, string | null>
    >({});
    const [verifyStatus, setVerifyStatus] = useState<
        Record<string, VerifyStatus>
    >({});
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const setField = (key: string, value: string) => {
        // Strip @ from twitter handle on input
        const cleaned =
            key === 'twitterHandle' ? value.replace(/^@/, '') : value;
        setFields(prev => ({ ...prev, [key]: cleaned }));
        // Clear verification on change
        setVerifyStatus(prev => ({ ...prev, [key]: 'idle' }));
    };

    // Debounced validation
    const validateField = useDebouncedCallback((key: string, value: string) => {
        const config = SOCIAL_FIELDS.find(f => f.key === key);
        if (!config) return;
        const err = config.validate(value);
        setValidationErrors(prev => ({ ...prev, [key]: err }));
    }, 400);

    const handleFieldChange = (key: string, value: string) => {
        setField(key, value);
        validateField(key as never, value as never);
    };

    /** Lightweight existence check — tries to fetch the URL and checks for non-404 */
    const verifyLink = async (key: string) => {
        const config = SOCIAL_FIELDS.find(f => f.key === key);
        const value = fields[key];
        if (!config || !value) return;

        // Don't verify if there's a validation error
        const err = config.validate(value);
        if (err) return;

        setVerifyStatus(prev => ({ ...prev, [key]: 'checking' }));

        try {
            const url = config.buildUrl(value);
            const resp = await fetch(
                `/api/verify-link?url=${encodeURIComponent(url)}`,
                { method: 'GET' }
            );
            const data = await resp.json();
            setVerifyStatus(prev => ({
                ...prev,
                [key]: data.exists ? 'valid' : 'invalid'
            }));
        } catch {
            // Network error — don't block the user, just mark as idle
            setVerifyStatus(prev => ({ ...prev, [key]: 'idle' }));
        }
    };

    const handleSave = async () => {
        setError(null);
        setSuccess(false);

        // Run all validations first
        const errors: Record<string, string | null> = {};
        for (const config of SOCIAL_FIELDS) {
            const err = config.validate(fields[config.key]);
            errors[config.key] = err;
        }
        setValidationErrors(errors);

        const hasErrors = Object.values(errors).some(e => e !== null);
        if (hasErrors) {
            setError('Please fix the validation errors above');
            return;
        }

        const result = await onSave({
            githubUsername: fields.githubUsername.trim() || undefined,
            twitterHandle: fields.twitterHandle.trim() || undefined,
            linkedinUrl: fields.linkedinUrl.trim() || undefined,
            websiteUrl: fields.websiteUrl.trim() || undefined
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
                    socials
                </h2>

                {SOCIAL_FIELDS.map(config => {
                    const value = fields[config.key];
                    const fieldError = validationErrors[config.key];
                    const status = verifyStatus[config.key] ?? 'idle';

                    return (
                        <div key={config.key} className="space-y-2">
                            <label className="block text-sm font-sans text-zinc-300">
                                {config.label}
                            </label>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 flex items-center bg-black border-2 border-zinc-700 focus-within:border-primary transition-colors">
                                    {config.prefix && (
                                        <span className="pl-3 pr-1 text-sm text-zinc-500 font-sans select-none whitespace-nowrap">
                                            {config.prefix}
                                        </span>
                                    )}
                                    <input
                                        type="text"
                                        value={value}
                                        onChange={e =>
                                            handleFieldChange(
                                                config.key,
                                                e.target.value
                                            )
                                        }
                                        onBlur={() => {
                                            if (value) verifyLink(config.key);
                                        }}
                                        placeholder={config.placeholder}
                                        className={cn(
                                            'flex-1 px-2 py-3 bg-transparent text-white font-sans text-sm outline-none',
                                            'placeholder:text-zinc-500',
                                            !config.prefix && 'pl-4'
                                        )}
                                    />
                                </div>
                                {/* Verify status indicator */}
                                {value && (
                                    <div className="w-8 flex items-center justify-center">
                                        {status === 'checking' && (
                                            <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
                                        )}
                                        {status === 'valid' && (
                                            <Check className="w-4 h-4 text-primary" />
                                        )}
                                        {status === 'invalid' && (
                                            <span className="text-yellow-500 text-xs font-sans">
                                                ?
                                            </span>
                                        )}
                                        {status === 'idle' && value && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    window.open(
                                                        config.buildUrl(value),
                                                        '_blank'
                                                    )
                                                }
                                                className="text-zinc-500 hover:text-zinc-300 transition-colors"
                                                title="Open in new tab"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                            {fieldError && (
                                <p className="text-xs text-red-400 font-sans">
                                    {fieldError}
                                </p>
                            )}
                        </div>
                    );
                })}

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
                        {saving ? 'saving...' : 'save_socials'}
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
