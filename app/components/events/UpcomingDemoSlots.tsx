import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { NeoCard } from '@/components/ui/NeoCard';
import { Button } from '../ui/button';

interface DemoSlot {
    id: string;
    eventId: string;
    memberId: string;
    title: string;
    description: string | null;
    requestedTime: string | null;
    durationMinutes: number;
    status: 'pending' | 'confirmed' | 'canceled';
    createdAt: string;
    member?: {
        id: string;
        displayName: string | null;
        email: string | null;
    };
    event?: {
        id: string;
        name: string;
        startAt: string;
    };
}

/**
 * UpcomingDemoSlots — shows upcoming community demo slot bookings.
 * Fetches all confirmed/pending slots for upcoming events.
 */
export function UpcomingDemoSlots() {
    const [demoSlots, setDemoSlots] = useState<DemoSlot[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSlots() {
            try {
                const res = await fetch('/api/demo-slots');
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();
                // Filter to only pending/confirmed, sort by event date
                const slots = (data.demoSlots || [])
                    .filter(
                        (s: DemoSlot) =>
                            s.status === 'pending' || s.status === 'confirmed'
                    )
                    .slice(0, 5);
                setDemoSlots(slots);
            } catch (err) {
                console.error('Error fetching demo slots:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchSlots();
    }, []);

    if (loading) {
        return (
            <NeoCard>
                <h3 className="text-lg font-sans mb-4">upcoming_demos</h3>
                <div className="text-sm text-zinc-500 font-sans animate-pulse">
                    loading...
                </div>
            </NeoCard>
        );
    }

    if (demoSlots.length === 0) {
        return (
            <NeoCard className="flex flex-col gap-2">
                <h3 className="text-lg font-sans mb-3">upcoming_demos</h3>

                <p className="text-sm text-zinc-400 mb-4">
                    no demos scheduled yet
                </p>

                <Button
                    asChild
                    variant="ghost"
                    className="font-sans bg-primary text-black hover:bg-primary/90"
                    data-add-project-trigger
                >
                    <Link
                        to="/dashboard/demo-slots"
                        className="hover:underline"
                    >
                        book a slot
                    </Link>
                </Button>
            </NeoCard>
        );
    }

    return (
        <NeoCard>
            <h3 className="text-lg font-sans text-primary mb-4">
                upcoming_demos
            </h3>
            <div className="space-y-3">
                {demoSlots.map(slot => (
                    <Link
                        key={slot.id}
                        to="/dashboard/demo-slots"
                        className="flex items-center gap-3 p-3 border border-zinc-800 hover:border-zinc-600 bg-zinc-900/30 hover:bg-zinc-900/60 transition-all group"
                    >
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-sans text-white truncate">
                                {slot.title}
                            </div>
                            <div className="text-xs text-zinc-500 mt-0.5">
                                {slot.durationMinutes} min
                                {slot.event?.name && (
                                    <span> · {slot.event.name}</span>
                                )}
                            </div>
                        </div>
                        <span
                            className={`shrink-0 px-2 py-0.5 text-[10px] font-sans border ${
                                slot.status === 'confirmed'
                                    ? 'border-green-500/50 text-green-500'
                                    : 'border-yellow-500/50 text-yellow-500'
                            }`}
                        >
                            {slot.status}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-zinc-600 group-hover:text-primary shrink-0 transition-colors" />
                    </Link>
                ))}
            </div>
            <Link
                to="/dashboard/demo-slots"
                className="mt-4 block text-center text-xs font-sans text-zinc-500 hover:text-primary transition-colors"
            >
                view all / book a slot →
            </Link>
        </NeoCard>
    );
}
