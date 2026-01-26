import { useState, useEffect } from 'react';
import { Link, type MetaFunction } from 'react-router';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { NeoCard } from '@/components/ui/NeoCard';

export const meta: MetaFunction = () => {
    return [
        { title: 'hello_miami | the third place for builders' },
        {
            name: 'description',
            content:
                'the home of miami hack night and the community of builders hanging out and shipping cool sh*t.'
        }
    ];
};

export default function Landing() {
    const [text, setText] = useState('');
    const fullText = 'hello_miami> _';

    useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
            setText(fullText.slice(0, i));
            i++;
            if (i > fullText.length) {
                i = 0;
            }
        }, 200);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="grow">
                {/* Terminal Hero */}
                <section className="py-20 px-4 bg-black border-bottom-2 border-[#22c55e]/20">
                    <div className="max-w-4xl mx-auto font-mono">
                        <div className="bg-[#1a1a1a] p-2 rounded-t-lg border-2 border-zinc-800 border-b-0 flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/50" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                            <div className="w-3 h-3 rounded-full bg-green-500/50" />
                        </div>
                        <div className="bg-[#0a0a0a] p-8 border-2 border-zinc-800 min-h-75 flex flex-col justify-center">
                            <h1 className="text-4xl md:text-6xl text-[#22c55e] mb-4">
                                {text}
                            </h1>
                            <p className="text-xl text-zinc-400 max-w-2xl leading-relaxed">
                                A "no-ego" builder community for Miami hackers.
                                Twice a week. Zero fluff. All momentum.
                            </p>
                            <div className="mt-8 flex gap-4">
                                <Link
                                    to="/manifesto"
                                    className="px-6 py-3 bg-[#22c55e] text-black font-bold border-2 border-black hover:translate-x-1 hover:-translate-y-1 transition-transform shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-none"
                                >
                                    Read Manifesto
                                </Link>
                                <a
                                    href="https://lu.ma/miami"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-6 py-3 bg-transparent text-[#22c55e] font-bold border-2 border-[#22c55e] hover:bg-[#22c55e]/10 transition-colors"
                                >
                                    Join Next Event
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Community Values */}
                <section className="py-20 px-4 max-w-7xl mx-auto">
                    <h2 className="text-3xl font-mono mb-12 border-l-4 border-[#22c55e] pl-4">
                        core values
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <NeoCard className="p-6 border-[#22c55e]">
                            <h3 className="text-xl font-mono text-[#22c55e] mb-2">
                                01. no ego
                            </h3>
                            <p className="text-zinc-400">
                                We don't care who you are or what you've done.
                                We care about what you're building tonight.
                            </p>
                        </NeoCard>
                        <NeoCard className="p-6">
                            <h3 className="text-xl font-mono text-[#22c55e] mb-2">
                                02. stay hungry
                            </h3>
                            <p className="text-zinc-400">
                                Weekly consistency beats monthly bursts. We show
                                up every Tuesday and Thursday.
                            </p>
                        </NeoCard>
                        <NeoCard className="p-6">
                            <h3 className="text-xl font-mono text-[#22c55e] mb-2">
                                03. ships only
                            </h3>
                            <p className="text-zinc-400">
                                Talk is cheap. Code is currency. If it's not
                                live, it's not a hack.
                            </p>
                        </NeoCard>
                    </div>
                </section>

                {/* Report CTA */}
                <section className="py-20 px-4 bg-[#22c55e]/5">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-3xl font-mono mb-6">
                            explore the 2025 impact
                        </h2>
                        <p className="text-zinc-400 mb-8 max-w-2xl mx-auto">
                            see how we grew from a small group to a thriving
                            community of over 1.2k members.
                        </p>
                        <Link
                            to="/reports/2025"
                            className="inline-block px-8 py-4 border-2 border-[#22c55e] text-[#22c55e] font-mono hover:bg-[#22c55e] hover:text-black transition-all"
                        >
                            view 2025 report &rarr;
                        </Link>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
