import { ArrowDown } from 'lucide-react';
import { StatCard } from '../components/ui/StatCard';
import stats from '../data/precomputed/general-stats.json';

export function Hero() {
    // Calculate some quick stats
    const { totalEvents, totalRegistrations, uniqueGuests } = stats;

    return (
        <section className="min-h-[90vh] flex flex-col justify-center items-center relative py-20 px-4">
            <div className="max-w-6xl w-full mx-auto space-y-16">
                <div className="text-center space-y-8">
                    <div className="inline-block px-4 py-2 bg-zinc-950 text-white neo-shadow border-2 border-primary font-semibold font-sans text-sm md:text-base lg:text-3xl tracking-widest transform -rotate-2">
                        hack night - 2025 year in review
                    </div>
                    <h1 className="text-6xl md:text-8xl lg:text-9xl font-normal font-sans tracking-tighter text-white leading-[0.9] pt-2">
                        hello_miami
                    </h1>
                    <p className="text-xl md:text-2xl font-normal font-sans text-white max-w-3xl mx-auto border-y-2 border-primary py-6 bg-zinc-950 neo-shadow">
                        we just want to hang out with other nerds and build cool
                        sh*t
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
                    <StatCard
                        label="events hosted"
                        value={totalEvents}
                        variant="cyan"
                    />
                    <StatCard
                        label="total registrations"
                        value={totalRegistrations.toLocaleString()}
                        subtext="approved rsvps"
                        variant="magenta"
                    />
                    <StatCard
                        label="unique builders"
                        value={uniqueGuests}
                        variant="yellow"
                    />
                </div>
            </div>

            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
                <ArrowDown size={32} className="text-white" />
            </div>
        </section>
    );
}
