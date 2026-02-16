import { type MetaFunction } from 'react-router';
import { CalendarIcon, MapPinIcon, UsersIcon } from 'lucide-react';
import { useMemo } from 'react';
import { useSafeQuery } from '@/hooks/use-safe-query';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { NeoCard } from '@/components/ui/NeoCard';
import { LiveIndicator } from '@/components/connection-status';
import { eventQueries } from '@/zero/queries';

export const meta: MetaFunction = () => {
    return [
        { title: 'Events | hello_miami' },
        {
            name: 'description',
            content:
                'Upcoming hack nights and community events. Join us every Tuesday and Thursday.'
        }
    ];
};

// Event type for client-side rendering
interface EventData {
    id: string;
    lumaEventId: string;
    name: string;
    description: string | null;
    coverUrl: string | null;
    url: string;
    startAt: string;
    endAt: string | null;
    timezone: string;
    location: {
        type: string;
        name: string | null;
        address: string | null;
        lat: number | null;
        lng: number | null;
    } | null;
    stats: {
        registered: number;
        checkedIn: number;
    };
    isCanceled: boolean;
}

export default function Events() {
    // Use Zero query for realtime event data (SSR-safe)
    const [eventsData] = useSafeQuery(eventQueries.upcoming());

    // Transform Zero query results to match expected format
    const events = useMemo(() => {
        if (!eventsData) return [];
        return eventsData.map(event => ({
            id: event.id,
            lumaEventId: event.lumaEventId || '',
            name: event.name || '',
            description: event.description,
            coverUrl: event.coverUrl,
            url: event.url || '',
            startAt: event.startAt
                ? new Date(event.startAt).toISOString()
                : new Date().toISOString(),
            endAt: event.endAt ? new Date(event.endAt).toISOString() : null,
            timezone: event.timezone || 'UTC',
            location: event.location,
            stats:
                typeof event.stats === 'object' && event.stats !== null
                    ? (event.stats as { registered: number; checkedIn: number })
                    : { registered: 0, checkedIn: 0 },
            isCanceled: event.isCanceled ?? false
        }));
    }, [eventsData]);

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="grow py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-12">
                        <div className="flex items-center justify-between mb-4">
                            <h1 className="text-5xl font-sans text-primary drop-shadow-[4px_4px_0px_color-mix(in_srgb,var(--primary),transparent_80%)]">
                                upcoming events
                            </h1>
                            <LiveIndicator />
                        </div>
                        <p className="text-xl text-zinc-400 max-w-2xl">
                            Join us every Tuesday and Thursday. No fluff, all
                            building.
                        </p>
                    </div>

                    {/* Events Grid */}
                    {events.length === 0 ? (
                        <NeoCard className="p-12 text-center">
                            <p className="text-zinc-400 text-lg">
                                No upcoming events scheduled yet. Check back
                                soon!
                            </p>
                        </NeoCard>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {events.map(event => (
                                <EventCard key={event.id} event={event} />
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}

interface EventCardProps {
    event: EventData;
}

function EventCard({ event }: EventCardProps) {
    const startDate = new Date(event.startAt);
    const endDate = event.endAt ? new Date(event.endAt) : null;

    // Format date
    const formattedDate = startDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    // Format time range
    const startTime = startDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
    const endTime = endDate
        ? endDate.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
          })
        : null;

    const timeRange = endTime ? `${startTime} - ${endTime}` : startTime;

    return (
        <NeoCard className="p-6 flex flex-col hover:translate-x-1 hover:-translate-y-1 transition-transform">
            {/* Event cover image if available */}
            {event.coverUrl && (
                <div className="mb-4 -mx-6 -mt-6">
                    <img
                        src={event.coverUrl}
                        alt={event.name}
                        className="w-full h-48 object-cover border-b-2 border-white"
                    />
                </div>
            )}

            {/* Event name */}
            <h3 className="text-xl font-sans text-primary mb-3 line-clamp-2">
                {event.name}
            </h3>

            {/* Event details */}
            <div className="space-y-2 text-sm text-zinc-400 mb-4 grow">
                <div className="flex items-start gap-2">
                    <CalendarIcon className="w-4 h-4 mt-0.5 shrink-0" />
                    <div className="flex flex-col">
                        <span>{formattedDate}</span>
                        <span className="text-xs">{timeRange}</span>
                    </div>
                </div>

                {event.location && event.location.name && (
                    <div className="flex items-start gap-2">
                        <MapPinIcon className="w-4 h-4 mt-0.5 shrink-0" />
                        <span className="line-clamp-2">
                            {event.location.name}
                        </span>
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <UsersIcon className="w-4 h-4 shrink-0" />
                    <span>{event.stats.registered} registered</span>
                </div>
            </div>

            {/* RSVP Button */}
            <a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center px-4 py-2 bg-primary text-black font-bold border-2 border-black hover:bg-primary/90 transition-colors text-sm"
            >
                rsvp_on_luma
            </a>
        </NeoCard>
    );
}
