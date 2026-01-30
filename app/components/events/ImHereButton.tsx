/**
 * "I'm Here" Check-In Button Component
 *
 * This component allows members to check themselves into hack nights.
 * The button is only active during event hours (6:30 PM - 1:00 AM).
 */

import { useState, useEffect } from 'react';
import { NeoCard } from '@/components/ui/NeoCard';
import { Button } from '@/components/ui/button';

interface Event {
    id: string;
    lumaEventId: string;
    name: string;
    startAt: string;
    endAt: string | null;
    location: {
        type: string;
        name: string | null;
    } | null;
}

interface ImHereButtonProps {
    /** The member's profile ID */
    memberId?: string;
    /** The member's Luma Attendee ID (required for check-in) */
    lumaAttendeeId?: string | null;
}

export function ImHereButton({ memberId, lumaAttendeeId }: ImHereButtonProps) {
    const [nextEvent, setNextEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [checking, setChecking] = useState(false);
    const [isWithinTimeWindow, setIsWithinTimeWindow] = useState(false);
    const [checkInStatus, setCheckInStatus] = useState<
        'idle' | 'success' | 'error' | 'already-checked-in'
    >('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Fetch the next upcoming event
    useEffect(() => {
        async function fetchNextEvent() {
            try {
                const response = await fetch(
                    '/api/events?upcoming=true&limit=1'
                );
                const data = await response.json();

                if (data.events && data.events.length > 0) {
                    setNextEvent(data.events[0]);
                }
            } catch (error) {
                console.error('Error fetching next event:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchNextEvent();
    }, []);

    // Check if current time is within event window (6:30 PM - 1:00 AM)
    useEffect(() => {
        if (!nextEvent) {
            setIsWithinTimeWindow(false);
            return;
        }

        function checkTimeWindow() {
            if (!nextEvent) return;

            const now = new Date();
            const eventStart = new Date(nextEvent.startAt);

            // Check if event is today and within time window
            const isToday =
                now.getDate() === eventStart.getDate() &&
                now.getMonth() === eventStart.getMonth() &&
                now.getFullYear() === eventStart.getFullYear();

            // Event window: 6:30 PM (18:30) to 1:00 AM (01:00 next day)
            const eventDate = new Date(eventStart);
            const windowStart = new Date(eventDate);
            windowStart.setHours(18, 30, 0, 0); // 6:30 PM

            const windowEnd = new Date(eventDate);
            windowEnd.setDate(windowEnd.getDate() + 1);
            windowEnd.setHours(1, 0, 0, 0); // 1:00 AM next day

            const inWindow = now >= windowStart && now <= windowEnd;

            setIsWithinTimeWindow(isToday && inWindow);
        }

        checkTimeWindow();
        const interval = setInterval(checkTimeWindow, 60000); // Check every minute

        return () => clearInterval(interval);
    }, [nextEvent]);

    async function handleCheckIn() {
        if (!memberId || !nextEvent) {
            return;
        }

        setChecking(true);
        setErrorMessage(null);

        try {
            const formData = new FormData();
            formData.append('memberId', memberId);
            formData.append('eventId', nextEvent.id);
            formData.append('lumaEventId', nextEvent.lumaEventId);
            if (lumaAttendeeId) {
                formData.append('lumaAttendeeId', lumaAttendeeId);
            }

            const response = await fetch('/api/check-in', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                if (response.status === 409) {
                    setCheckInStatus('already-checked-in');
                } else {
                    throw new Error(result.error || 'Failed to check in');
                }
            } else {
                setCheckInStatus('success');
            }
        } catch (error) {
            console.error('Error checking in:', error);
            setCheckInStatus('error');
            setErrorMessage(
                error instanceof Error ? error.message : 'Unknown error'
            );
        } finally {
            setChecking(false);
        }
    }

    if (loading) {
        return (
            <NeoCard variant="cyan">
                <div className="flex items-center justify-center py-8">
                    <div className="text-zinc-400 font-sans text-sm animate-pulse">
                        loading...
                    </div>
                </div>
            </NeoCard>
        );
    }

    if (!nextEvent) {
        return (
            <NeoCard variant="cyan">
                <h3 className="text-lg font-sans mb-4">check_in</h3>
                <p className="text-sm text-zinc-400 mb-4">
                    no upcoming events scheduled at this time.
                </p>
                <a
                    href="https://luma.com/hello_miami"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-2 bg-black border border-white text-center font-sans text-sm hover:invert transition-all"
                >
                    view calendar
                </a>
            </NeoCard>
        );
    }

    // Show warning if Luma Attendee ID is not linked
    if (!lumaAttendeeId) {
        return (
            <NeoCard variant="yellow">
                <h3 className="text-lg font-sans mb-4">check_in</h3>
                <p className="text-sm text-zinc-300 mb-4">
                    link your Luma Attendee ID to enable check-ins at hack
                    nights.
                </p>
                <a
                    href="/dashboard/profile"
                    className="block w-full py-2 bg-yellow-500 text-black border-2 border-black text-center font-sans text-sm hover:bg-yellow-400 transition-colors"
                >
                    add_luma_id
                </a>
            </NeoCard>
        );
    }

    const eventDate = new Date(nextEvent.startAt);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
    });

    return (
        <NeoCard variant="cyan">
            <h3 className="text-lg font-sans mb-4">i'm_here</h3>

            <div className="mb-4">
                <div className="text-sm text-zinc-400 mb-1">next event</div>
                <div className="text-base font-sans text-white mb-1">
                    {nextEvent.name}
                </div>
                <div className="text-xs text-zinc-500">{formattedDate}</div>
                {nextEvent.location?.name && (
                    <div className="text-xs text-zinc-500">
                        @ {nextEvent.location.name}
                    </div>
                )}
            </div>

            {checkInStatus === 'success' && (
                <div className="mb-4 p-3 bg-green-900/30 border border-primary">
                    <div className="text-sm font-sans text-primary">
                        ✓ checked in successfully!
                    </div>
                    <div className="text-xs text-zinc-400 mt-1">
                        your attendance has been recorded. keep building!
                    </div>
                </div>
            )}

            {checkInStatus === 'already-checked-in' && (
                <div className="mb-4 p-3 bg-cyan-900/30 border border-cyan-500">
                    <div className="text-sm font-sans text-cyan-400">
                        you're already checked in!
                    </div>
                    <div className="text-xs text-zinc-400 mt-1">
                        enjoy the hack night!
                    </div>
                </div>
            )}

            {checkInStatus === 'error' && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-500">
                    <div className="text-sm font-sans text-red-400">
                        check-in failed
                    </div>
                    {errorMessage && (
                        <div className="text-xs text-zinc-400 mt-1">
                            {errorMessage}
                        </div>
                    )}
                </div>
            )}

            {!isWithinTimeWindow && (
                <div className="mb-4 p-3 bg-zinc-900/50 border border-zinc-700">
                    <div className="text-xs text-zinc-400">
                        check-in opens at 6:30 PM on event day
                    </div>
                </div>
            )}

            <Button
                onClick={handleCheckIn}
                disabled={
                    !isWithinTimeWindow ||
                    checking ||
                    checkInStatus === 'success' ||
                    checkInStatus === 'already-checked-in'
                }
                className="w-full"
                variant={isWithinTimeWindow ? 'default' : 'outline'}
            >
                {checking
                    ? 'checking in...'
                    : checkInStatus === 'success' ||
                        checkInStatus === 'already-checked-in'
                      ? 'checked in ✓'
                      : isWithinTimeWindow
                        ? "i'm here!"
                        : 'not available yet'}
            </Button>
        </NeoCard>
    );
}
