import { useEffect, useCallback, useState } from 'react';
import { useLoaderData, useNavigate } from 'react-router';
import type { ActionFunctionArgs } from 'react-router';
import { getAuth } from '@clerk/react-router/server';

import { AppLayout } from '@/components/layout/AppLayout';
import { NeoButton } from '@/components/ui/NeoButton';
import {
    ProfileBasicInfoCard,
    ProfileSkillsCard,
    ProfileSocialsCard,
    ProfileCommunityPrefsCard
} from '@/components/profile';
import type { ProfileLike } from '@/components/profile/types';
import { useAuth } from '@/hooks/use-auth';
import { useSafeQuery } from '@/hooks/use-safe-query';
import { useZeroConnection } from '@/components/providers/zero-provider';
import { mutators } from '@/zero/mutators';
import {
    createDashboardLoader,
    type DashboardLoaderData
} from '@/lib/create-dashboard-loader.server';
import {
    getProfileByClerkUserId,
    updateProfile as updateProfileDb
} from '@/lib/db/profiles.server';
import { profileQueries } from '@/zero/queries';
import { Button } from '@/components/ui/button';

export { DashboardErrorBoundary as ErrorBoundary } from '@/components/layout/DashboardErrorBoundary';

/**
 * Server-side loader: uses createDashboardLoader for auth + profile.
 * Profile data is available immediately on navigation, without waiting for Zero.
 */
export const loader = createDashboardLoader();

/**
 * Server-side action: handles profile updates directly via Drizzle/Postgres.
 *
 * This replaces the broken Zero push endpoint path. Changes are written
 * directly to Postgres, and zero-cache picks them up via WAL replication.
 */
export async function action(args: ActionFunctionArgs) {
    const auth = await getAuth(args);
    if (!auth.userId) {
        return Response.json(
            { success: false, error: 'Unauthorized' },
            { status: 401 }
        );
    }

    const body = await args.request.json();
    const { id, ...fields } = body as { id: string; [key: string]: unknown };

    if (!id) {
        return Response.json(
            { success: false, error: 'Profile ID required' },
            { status: 400 }
        );
    }

    // Verify ownership: the authenticated user can only update their own profile
    const profile = await getProfileByClerkUserId(auth.userId);
    if (!profile || profile.id !== id) {
        return Response.json(
            { success: false, error: 'You can only update your own profile' },
            { status: 403 }
        );
    }

    try {
        await updateProfileDb(id, fields);
        return Response.json({ success: true });
    } catch (err) {
        console.error('Profile update error:', err);
        return Response.json(
            {
                success: false,
                error: err instanceof Error ? err.message : 'Update failed'
            },
            { status: 500 }
        );
    }
}

type LoaderData = DashboardLoaderData;

export default function ProfileEdit() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const { zero } = useZeroConnection();

    // Server-side loader data (available immediately on navigation)
    const loaderData = useLoaderData<LoaderData>();
    const serverProfile = loaderData?.profile ?? null;

    // Use Zero for reactive updates (SSR-safe — disabled until Zero connects)
    const [zeroProfile] = useSafeQuery(
        user?.id ? profileQueries.byClerkUserId(user.id) : null
    );

    // Prefer Zero's reactive data when available, fall back to server-loaded profile
    const profile: ProfileLike | null = zeroProfile ?? serverProfile ?? null;

    useEffect(() => {
        if (!loading && !user) {
            navigate('/');
        }
    }, [user, loading, navigate]);

    /**
     * Generic save handler shared by all section cards.
     * Each card passes only the fields it manages.
     *
     * Uses Zero's mutation API for optimistic updates + server sync.
     * Zero-cache picks up changes via WAL replication automatically.
     */
    const handleSectionSave = useCallback(
        async (
            fields: Record<string, unknown>
        ): Promise<{ success: boolean; error?: string }> => {
            if (!user || !profile) {
                return { success: false, error: 'Not authenticated' };
            }

            if (!zero) {
                return { success: false, error: 'Sync not connected' };
            }

            setSaving(true);
            try {
                const write = zero.mutate(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    mutators.profiles.update({
                        id: profile.id,
                        ...fields
                    } as any)
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ) as any;

                const result = await write.client;

                if (result.type === 'error') {
                    return {
                        success: false,
                        error:
                            result.error?.message || 'Failed to update profile'
                    };
                }
                return { success: true };
            } catch (err) {
                return {
                    success: false,
                    error:
                        err instanceof Error
                            ? err.message
                            : 'Failed to update profile'
                };
            } finally {
                setSaving(false);
            }
        },
        [user, profile, zero]
    );

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

                <div className="space-y-6">
                    <ProfileBasicInfoCard
                        profile={profile}
                        onSave={handleSectionSave}
                        saving={saving}
                    />

                    <ProfileSkillsCard
                        profile={profile}
                        onSave={handleSectionSave}
                        saving={saving}
                    />

                    <ProfileSocialsCard
                        profile={profile}
                        onSave={handleSectionSave}
                        saving={saving}
                    />

                    <ProfileCommunityPrefsCard
                        profile={profile}
                        onSave={handleSectionSave}
                        saving={saving}
                    />
                </div>
            </main>
        </AppLayout>
    );
}
