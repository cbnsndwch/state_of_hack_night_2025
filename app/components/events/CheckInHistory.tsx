/**
 * Component to display a member's check-in history
 */

import { useEffect, useState } from 'react';
import { NeoCard } from '@/components/ui/NeoCard';

interface CheckInHistoryItem {
    id: string;
    checkedInAt: string;
    event: {
        id: string;
        lumaEventId: string;
        name: string;
        startAt: string;
        location: string | null;
        coverUrl: string | null;
    } | null;
}

interface CheckInHistoryProps {
    // No props needed - uses authenticated user
}

export function CheckInHistory(_props: CheckInHistoryProps) {
    const [history, setHistory] = useState<CheckInHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/check-in-history')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setHistory(data.history || []);
                } else {
                    setError(data.error || 'Failed to load check-in history');
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching check-in history:', err);
                setError('Failed to load check-in history');
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <NeoCard>
                <div className="flex items-center justify-center py-8">
                    <div className="text-zinc-500 font-sans animate-pulse">
                        loading check-in history...
                    </div>
                </div>
            </NeoCard>
        );
    }

    if (error) {
        return (
            <NeoCard>
                <div className="text-center py-8">
                    <div className="text-red-400 font-sans mb-2">
                        error loading history
                    </div>
                </div>
            </NeoCard>
        );
    }

    if (history.length === 0) {
        return (
            <NeoCard>
                <div className="text-center py-12">
                    <div className="text-5xl mb-4">📍</div>
                    <div className="text-lg font-sans text-zinc-400 mb-2">
                        no check-ins yet
                    </div>
                    <div className="text-sm text-zinc-500">
                        use the "I'm Here" button at an event to start tracking
                        your attendance
                    </div>
                </div>
            </NeoCard>
        );
    }

    return (
        <NeoCard>
            <div className="space-y-4">
                {history.map(item => (
                    <div
                        key={item.id}
                        className="p-4 bg-zinc-900/50 border border-zinc-800 hover:border-primary/50 transition-colors"
                    >
                        <div className="flex items-start gap-4">
                            {/* Event icon or image */}
                            <div className="flex-shrink-0">
                                {item.event?.coverUrl ? (
                                    <img
                                        src={item.event.coverUrl}
                                        alt={item.event.name}
                                        className="w-16 h-16 object-cover border-2 border-zinc-700"
                                    />
                                ) : (
                                    <div className="w-16 h-16 bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
                                        <span className="text-2xl">✓</span>
                                    </div>
                                )}
                            </div>

                            {/* Event details */}
                            <div className="flex-1 min-w-0">
                                <h4 className="font-sans text-primary mb-1 truncate">
                                    {item.event?.name || 'Event'}
                                </h4>
                                <div className="space-y-1 text-sm">
                                    <div className="text-zinc-400">
                                        <span className="text-zinc-500">
                                            checked in:{' '}
                                        </span>
                                        {new Date(
                                            item.checkedInAt
                                        ).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}{' '}
                                        at{' '}
                                        {new Date(
                                            item.checkedInAt
                                        ).toLocaleTimeString('en-US', {
                                            hour: 'numeric',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                    {item.event?.location && (
                                        <div className="text-zinc-500 truncate">
                                            📍 {item.event.location}
                                        </div>
                                    )}
                                    {item.event?.startAt && (
                                        <div className="text-zinc-600 text-xs">
                                            event started:{' '}
                                            {new Date(
                                                item.event.startAt
                                            ).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Summary footer */}
            <div className="mt-6 pt-4 border-t border-zinc-800">
                <div className="text-center text-sm text-zinc-500">
                    total check-ins:{' '}
                    <span className="text-primary font-sans">
                        {history.length}
                    </span>
                </div>
            </div>
        </NeoCard>
    );
}
