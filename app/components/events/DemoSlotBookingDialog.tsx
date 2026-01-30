import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';

interface Event {
    id: string;
    name: string;
    startAt: string;
    endAt: string | null;
}

export function DemoSlotBookingDialog({
    onDemoBooked,
    open: externalOpen,
    onOpenChange: externalOnOpenChange
}: {
    onDemoBooked?: () => void;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}) {
    const { user } = useAuth();
    const [internalOpen, setInternalOpen] = useState(false);

    // Use external state if provided, otherwise use internal state
    const open = externalOpen !== undefined ? externalOpen : internalOpen;
    const setOpen = externalOnOpenChange || setInternalOpen;

    const [loading, setLoading] = useState(false);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [requestedTime, setRequestedTime] = useState('');
    const [durationMinutes, setDurationMinutes] = useState('5');

    // Fetch upcoming events when dialog opens
    useEffect(() => {
        if (open) {
            fetchUpcomingEvents();
        }
    }, [open]);

    const fetchUpcomingEvents = async () => {
        try {
            setLoadingEvents(true);
            const response = await fetch('/api/events?upcoming=true&limit=10');
            if (!response.ok) {
                throw new Error('Failed to fetch events');
            }
            const data = await response.json();
            setEvents(data.events || []);
        } catch (err) {
            console.error('Error fetching events:', err);
            alert('Failed to load upcoming events');
        } finally {
            setLoadingEvents(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (!selectedEventId) {
            alert('Please select an event');
            return;
        }

        setLoading(true);

        try {
            // Submit demo slot via API route
            const formData = new FormData();
            formData.append('supabaseUserId', user.id);
            formData.append('eventId', selectedEventId);
            formData.append('title', title);
            formData.append('description', description);
            formData.append('requestedTime', requestedTime);
            formData.append('durationMinutes', durationMinutes);

            const response = await fetch('/api/demo-slots', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to book demo slot');
            }

            // Reset form
            setOpen(false);
            setSelectedEventId('');
            setTitle('');
            setDescription('');
            setRequestedTime('');
            setDurationMinutes('5');
            onDemoBooked?.();
        } catch (err: unknown) {
            console.error('Error booking demo slot:', err);
            const message =
                err instanceof Error ? err.message : 'Unknown error';
            alert('Failed to book demo slot: ' + message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    className="font-sans bg-cyan-500 text-black hover:bg-cyan-400 border-2 border-black"
                    data-book-demo-trigger
                >
                    book_demo_slot
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px] bg-zinc-950 border-zinc-800 text-zinc-100">
                <DialogHeader>
                    <DialogTitle className="font-sans text-cyan-400">
                        book_demo_slot
                    </DialogTitle>
                    <DialogDescription className="font-sans text-zinc-400">
                        Reserve a time to demo what you've been building at an
                        upcoming hack night
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label
                            htmlFor="event"
                            className="font-sans text-zinc-300"
                        >
                            event
                        </Label>
                        {loadingEvents ? (
                            <div className="text-sm text-zinc-500">
                                loading events...
                            </div>
                        ) : events.length === 0 ? (
                            <div className="text-sm text-zinc-500">
                                no upcoming events found
                            </div>
                        ) : (
                            <Select
                                value={selectedEventId}
                                onValueChange={setSelectedEventId}
                                required
                            >
                                <SelectTrigger className="font-sans bg-zinc-900 border-zinc-700 text-zinc-100">
                                    <SelectValue placeholder="select an event" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-700">
                                    {events.map(event => (
                                        <SelectItem
                                            key={event.id}
                                            value={event.id}
                                            className="font-sans text-zinc-100"
                                        >
                                            {event.name} -{' '}
                                            {new Date(
                                                event.startAt
                                            ).toLocaleDateString()}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label
                            htmlFor="title"
                            className="font-sans text-zinc-300"
                        >
                            demo title
                        </Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required
                            className="font-sans bg-zinc-900 border-zinc-700 text-zinc-100 focus:border-cyan-400"
                            placeholder="My awesome project"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label
                            htmlFor="description"
                            className="font-sans text-zinc-300"
                        >
                            description
                        </Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="font-sans bg-zinc-900 border-zinc-700 text-zinc-100 focus:border-cyan-400"
                            placeholder="What will you demo?"
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label
                                htmlFor="requested_time"
                                className="font-sans text-zinc-300"
                            >
                                preferred time
                            </Label>
                            <Input
                                id="requested_time"
                                value={requestedTime}
                                onChange={e => setRequestedTime(e.target.value)}
                                className="font-sans bg-zinc-900 border-zinc-700 text-zinc-100 focus:border-cyan-400"
                                placeholder="e.g., 8:30 PM"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label
                                htmlFor="duration"
                                className="font-sans text-zinc-300"
                            >
                                duration (min)
                            </Label>
                            <Select
                                value={durationMinutes}
                                onValueChange={setDurationMinutes}
                            >
                                <SelectTrigger className="font-sans bg-zinc-900 border-zinc-700 text-zinc-100">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-700">
                                    <SelectItem
                                        value="3"
                                        className="font-sans text-zinc-100"
                                    >
                                        3 min
                                    </SelectItem>
                                    <SelectItem
                                        value="5"
                                        className="font-sans text-zinc-100"
                                    >
                                        5 min
                                    </SelectItem>
                                    <SelectItem
                                        value="10"
                                        className="font-sans text-zinc-100"
                                    >
                                        10 min
                                    </SelectItem>
                                    <SelectItem
                                        value="15"
                                        className="font-sans text-zinc-100"
                                    >
                                        15 min
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={loading || loadingEvents}
                            className="w-full font-sans bg-cyan-500 text-black hover:bg-cyan-400 border-2 border-black"
                        >
                            {loading ? 'booking...' : 'book demo slot'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
