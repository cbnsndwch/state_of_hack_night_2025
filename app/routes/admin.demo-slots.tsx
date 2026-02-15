import { useNavigate, useLoaderData, Link } from 'react-router';
import {
    data,
    type LoaderFunctionArgs,
    type ActionFunctionArgs
} from 'react-router';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { AppLayout } from '@/components/layout/AppLayout';
import { getProfileByClerkUserId } from '@/lib/db/profiles.server';
import {
    getDemoSlotsWithMembersAndEvents,
    updateDemoSlot,
    getDemoSlotById
} from '@/lib/db/demo-slots.server';
import { sendDemoStatusUpdate } from '@/lib/notifications/demo-slots.server';
import { NeoButton } from '@/components/ui/NeoButton';
import { NeoCard } from '@/components/ui/NeoCard';

type SerializedDemoSlot = {
    id: string;
    eventId: string;
    title: string;
    description: string | null;
    requestedTime: string | null;
    durationMinutes: number;
    status: 'pending' | 'confirmed' | 'canceled';
    confirmedByOrganizer: boolean;
    createdAt: string;
    updatedAt: string;
    member: {
        id: string;
        lumaEmail: string;
        githubUsername: string | null;
    };
    event: {
        id: string;
        name: string;
        startAt: string;
    };
};

type LoaderData = {
    demoSlots: SerializedDemoSlot[];
    error?: string;
};

/**
 * Admin dashboard for managing demo slots
 * Shows all scheduled demos with organizer actions
 */
export async function loader({ request }: LoaderFunctionArgs) {
    // Parse Clerk user ID from request headers or session
    const url = new URL(request.url);
    const clerkUserId = url.searchParams.get('userId');
    const eventId = url.searchParams.get('eventId') || undefined;
    const status = url.searchParams.get('status') as
        | 'pending'
        | 'confirmed'
        | 'canceled'
        | undefined;

    if (!clerkUserId) {
        return data(
            { demoSlots: [], error: 'Not authenticated' } as LoaderData,
            {
                status: 401
            }
        );
    }

    // Check if user is an app admin
    const profile = await getProfileByClerkUserId(clerkUserId);
    if (!profile || !profile.isAppAdmin) {
        return data(
            {
                demoSlots: [],
                error: 'Access denied - admin only'
            } as LoaderData,
            { status: 403 }
        );
    }

    const demoSlotsData = await getDemoSlotsWithMembersAndEvents({
        eventId,
        status
    });

    // Serialize dates and ObjectIds for JSON
    const demoSlots = demoSlotsData.map(slot => ({
        ...slot,
        id: slot.id.toString(),
        eventId: slot.eventId.toString(),
        createdAt: slot.createdAt.toISOString(),
        updatedAt: slot.updatedAt.toISOString(),
        member: {
            id: slot.member.id.toString(),
            lumaEmail: slot.member.lumaEmail,
            githubUsername: slot.member.githubUsername
        },
        event: {
            id: slot.event.id.toString(),
            name: slot.event.name,
            startAt: slot.event.startAt.toISOString()
        }
    }));

    return data({ demoSlots } as LoaderData);
}

/**
 * Action handler for updating demo slots
 */
export async function action({ request }: ActionFunctionArgs) {
    const url = new URL(request.url);
    const clerkUserId = url.searchParams.get('userId');

    if (!clerkUserId) {
        return data({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user is an app admin
    const profile = await getProfileByClerkUserId(clerkUserId);
    if (!profile || !profile.isAppAdmin) {
        return data({ error: 'Access denied - admin only' }, { status: 403 });
    }

    const formData = await request.formData();
    const demoSlotId = formData.get('demoSlotId') as string;
    const action = formData.get('action') as string;

    if (!demoSlotId) {
        return data({ error: 'Demo slot ID is required' }, { status: 400 });
    }

    try {
        switch (action) {
            case 'confirm':
                await updateDemoSlot(demoSlotId, {
                    status: 'confirmed',
                    confirmedByOrganizer: true
                });
                // Send confirmation email (fire and forget)
                getDemoSlotById(demoSlotId).then(slot => {
                    if (slot) {
                        sendDemoStatusUpdate(slot, 'confirmed').catch(error => {
                            console.error(
                                'Failed to send confirmation email:',
                                error
                            );
                        });
                    }
                });
                return data({ success: true, message: 'Demo slot confirmed' });

            case 'cancel':
                await updateDemoSlot(demoSlotId, {
                    status: 'canceled',
                    confirmedByOrganizer: false
                });
                // Send cancellation email (fire and forget)
                getDemoSlotById(demoSlotId).then(slot => {
                    if (slot) {
                        sendDemoStatusUpdate(slot, 'canceled').catch(error => {
                            console.error(
                                'Failed to send cancellation email:',
                                error
                            );
                        });
                    }
                });
                return data({ success: true, message: 'Demo slot canceled' });

            case 'pending':
                await updateDemoSlot(demoSlotId, {
                    status: 'pending',
                    confirmedByOrganizer: false
                });
                return data({
                    success: true,
                    message: 'Demo slot set to pending'
                });

            default:
                return data({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('Error updating demo slot:', error);
        return data({ error: 'Failed to update demo slot' }, { status: 500 });
    }
}

export default function AdminDemoSlots() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const { demoSlots, error } = useLoaderData<LoaderData>();
    const [filter, setFilter] = useState<
        'all' | 'pending' | 'confirmed' | 'canceled'
    >('all');

    useEffect(() => {
        if (!loading && !user) {
            navigate('/');
        }
    }, [user, loading, navigate]);

    const handleAction = async (demoSlotId: string, action: string) => {
        try {
            const formData = new FormData();
            formData.append('demoSlotId', demoSlotId);
            formData.append('action', action);

            const response = await fetch(
                `/admin/demo-slots?userId=${user?.id}`,
                {
                    method: 'POST',
                    body: formData
                }
            );

            if (!response.ok) {
                throw new Error('Failed to update demo slot');
            }

            // Reload the page to fetch updated data
            window.location.reload();
        } catch (err) {
            console.error('Error updating demo slot:', err);
            alert('Failed to update demo slot');
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

    if (error) {
        return (
            <AppLayout isAdmin>
                <div className="min-h-full bg-black px-4 py-12">
                    <NeoCard className="p-12 text-center">
                        <h1 className="mb-4 font-mono text-2xl font-bold text-red-500">
                            {error}
                        </h1>
                        <Link to="/dashboard">
                            <NeoButton>Back to Dashboard</NeoButton>
                        </Link>
                    </NeoCard>
                </div>
            </AppLayout>
        );
    }

    // Filter demo slots
    const filteredSlots = demoSlots.filter(slot => {
        if (filter === 'all') return true;
        return slot.status === filter;
    });

    // Group slots by status for summary
    const statusCounts = {
        pending: demoSlots.filter(s => s.status === 'pending').length,
        confirmed: demoSlots.filter(s => s.status === 'confirmed').length,
        canceled: demoSlots.filter(s => s.status === 'canceled').length
    };

    return (
        <AppLayout isAdmin>
            <div className="min-h-full bg-black px-4 py-12">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="mb-4 font-mono text-4xl font-bold text-primary">
                        demo_slot_management
                    </h1>
                    <p className="font-sans text-zinc-400">
                        Organizer view for all scheduled demo presentations
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <NeoCard className="p-6">
                        <div className="text-sm font-sans text-zinc-500 mb-1">
                            pending review
                        </div>
                        <div className="text-3xl font-mono text-yellow-500">
                            {statusCounts.pending}
                        </div>
                    </NeoCard>
                    <NeoCard className="p-6">
                        <div className="text-sm font-sans text-zinc-500 mb-1">
                            confirmed
                        </div>
                        <div className="text-3xl font-mono text-green-500">
                            {statusCounts.confirmed}
                        </div>
                    </NeoCard>
                    <NeoCard className="p-6">
                        <div className="text-sm font-sans text-zinc-500 mb-1">
                            canceled
                        </div>
                        <div className="text-3xl font-mono text-red-500">
                            {statusCounts.canceled}
                        </div>
                    </NeoCard>
                </div>

                {/* Filter Buttons */}
                <div className="flex gap-4 mb-6">
                    <NeoButton
                        onClick={() => setFilter('all')}
                        variant={filter === 'all' ? 'primary' : 'secondary'}
                    >
                        all ({demoSlots.length})
                    </NeoButton>
                    <NeoButton
                        onClick={() => setFilter('pending')}
                        variant={filter === 'pending' ? 'primary' : 'secondary'}
                    >
                        pending ({statusCounts.pending})
                    </NeoButton>
                    <NeoButton
                        onClick={() => setFilter('confirmed')}
                        variant={
                            filter === 'confirmed' ? 'primary' : 'secondary'
                        }
                    >
                        confirmed ({statusCounts.confirmed})
                    </NeoButton>
                    <NeoButton
                        onClick={() => setFilter('canceled')}
                        variant={
                            filter === 'canceled' ? 'primary' : 'secondary'
                        }
                    >
                        canceled ({statusCounts.canceled})
                    </NeoButton>
                </div>

                {/* Demo Slots List */}
                <div className="space-y-4">
                    {filteredSlots.length === 0 ? (
                        <NeoCard className="p-12 text-center">
                            <p className="font-sans text-zinc-500">
                                no demo slots found for this filter
                            </p>
                        </NeoCard>
                    ) : (
                        filteredSlots.map(slot => (
                            <NeoCard key={slot.id} className="p-6">
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                    {/* Demo Info */}
                                    <div className="flex-1">
                                        <div className="text-xs font-mono text-zinc-600 mb-1">
                                            {slot.event.name} •{' '}
                                            {new Date(
                                                slot.event.startAt
                                            ).toLocaleDateString()}
                                        </div>
                                        <h3 className="text-xl font-sans text-primary mb-2">
                                            {slot.title}
                                        </h3>
                                        {slot.description && (
                                            <p className="text-sm text-zinc-400 mb-3">
                                                {slot.description}
                                            </p>
                                        )}
                                        <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
                                            <div>
                                                <span className="text-zinc-600">
                                                    Member:
                                                </span>{' '}
                                                {slot.member.githubUsername ||
                                                    slot.member.lumaEmail}
                                            </div>
                                            {slot.requestedTime && (
                                                <div>
                                                    <span className="text-zinc-600">
                                                        Time:
                                                    </span>{' '}
                                                    {slot.requestedTime}
                                                </div>
                                            )}
                                            <div>
                                                <span className="text-zinc-600">
                                                    Duration:
                                                </span>{' '}
                                                {slot.durationMinutes} min
                                            </div>
                                            <div>
                                                <span className="text-zinc-600">
                                                    Submitted:
                                                </span>{' '}
                                                {new Date(
                                                    slot.createdAt
                                                ).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status & Actions */}
                                    <div className="flex flex-col items-start md:items-end gap-3">
                                        <span
                                            className={`px-3 py-1 text-xs font-sans border ${
                                                slot.status === 'confirmed'
                                                    ? 'border-green-500 text-green-500'
                                                    : slot.status === 'pending'
                                                      ? 'border-yellow-500 text-yellow-500'
                                                      : 'border-red-500 text-red-500'
                                            }`}
                                        >
                                            {slot.status}
                                        </span>

                                        <div className="flex flex-col gap-2">
                                            {slot.status !== 'confirmed' && (
                                                <NeoButton
                                                    className="text-sm px-4 py-2"
                                                    onClick={() =>
                                                        handleAction(
                                                            slot.id,
                                                            'confirm'
                                                        )
                                                    }
                                                >
                                                    ✓ confirm
                                                </NeoButton>
                                            )}
                                            {slot.status !== 'pending' && (
                                                <NeoButton
                                                    className="text-sm px-4 py-2"
                                                    variant="secondary"
                                                    onClick={() =>
                                                        handleAction(
                                                            slot.id,
                                                            'pending'
                                                        )
                                                    }
                                                >
                                                    ⟳ set pending
                                                </NeoButton>
                                            )}
                                            {slot.status !== 'canceled' && (
                                                <NeoButton
                                                    className="text-sm px-4 py-2"
                                                    variant="secondary"
                                                    onClick={() =>
                                                        handleAction(
                                                            slot.id,
                                                            'cancel'
                                                        )
                                                    }
                                                >
                                                    ✕ cancel
                                                </NeoButton>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </NeoCard>
                        ))
                    )}
                </div>

                {/* Back Button */}
                <div className="mt-8">
                    <Link to="/dashboard">
                        <NeoButton variant="secondary">
                            ← back to dashboard
                        </NeoButton>
                    </Link>
                </div>
            </div>
        </AppLayout>
    );
}
