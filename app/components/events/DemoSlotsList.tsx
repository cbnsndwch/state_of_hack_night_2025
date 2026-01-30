import { useEffect, useState } from 'react';
import { NeoCard } from '@/components/ui/NeoCard';

interface DemoSlot {
    id: string;
    eventId: string;
    title: string;
    description: string | null;
    requestedTime: string | null;
    durationMinutes: number;
    status: 'pending' | 'confirmed' | 'canceled';
    confirmedByOrganizer: boolean;
    createdAt: string;
    event?: {
        id: string;
        name: string;
        startAt: string;
        endAt: string | null;
    };
}

export function DemoSlotsList({ memberId }: { memberId?: string }) {
    const [demoSlots, setDemoSlots] = useState<DemoSlot[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDemoSlots();
    }, [memberId]);

    const fetchDemoSlots = async () => {
        try {
            setLoading(true);
            const url = memberId
                ? `/api/demo-slots?memberId=${memberId}`
                : '/api/demo-slots';
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to fetch demo slots');
            }
            const data = await response.json();
            setDemoSlots(data.demoSlots || []);
        } catch (err) {
            console.error('Error fetching demo slots:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="text-sm text-zinc-500 font-sans">
                loading demo slots...
            </div>
        );
    }

    if (demoSlots.length === 0) {
        return (
            <div className="text-sm text-zinc-500 font-sans">
                no demo slots booked yet
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {demoSlots.map(slot => (
                <NeoCard key={slot.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <h4 className="text-lg font-sans text-primary mb-1">
                                {slot.title}
                            </h4>
                            {slot.description && (
                                <p className="text-sm text-zinc-400 mb-2">
                                    {slot.description}
                                </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-zinc-500">
                                {slot.requestedTime && (
                                    <span>Time: {slot.requestedTime}</span>
                                )}
                                <span>
                                    Duration: {slot.durationMinutes} min
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <span
                                className={`px-2 py-1 text-xs font-sans border ${
                                    slot.status === 'confirmed'
                                        ? 'border-green-500 text-green-500'
                                        : slot.status === 'pending'
                                          ? 'border-yellow-500 text-yellow-500'
                                          : 'border-red-500 text-red-500'
                                }`}
                            >
                                {slot.status}
                            </span>
                            {slot.confirmedByOrganizer && (
                                <span className="text-xs text-green-500">
                                    ✓ confirmed
                                </span>
                            )}
                        </div>
                    </div>
                </NeoCard>
            ))}
        </div>
    );
}
