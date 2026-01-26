import { type MetaFunction } from 'react-router';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export const meta: MetaFunction = () => {
    return [
        { title: 'hello_miami | manifesto' },
        {
            name: 'description',
            content:
                'the philosophy of hello_miami: no ego, stay hungry, ships only.'
        }
    ];
};

export default function Manifesto() {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="grow py-20 px-4">
                <article className="max-w-3xl mx-auto prose prose-invert font-serif">
                    <h1 className="text-5xl font-mono text-[#22c55e] mb-12 drop-shadow-[4px_4px_0px_rgba(34,197,94,0.2)]">
                        the hello_miami manifesto
                    </h1>

                    <div className="space-y-12 text-lg leading-relaxed text-zinc-300">
                        <section>
                            <h2 className="text-2xl font-mono text-white mb-4">
                                i. the third place
                            </h2>
                            <p>
                                In a city often defined by surface-level
                                connections, hello_miami is the anchor. It is a
                                "Third Place"—a neutral ground for builders to
                                gather, away from the pressures of work and the
                                isolation of home.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-mono text-white mb-4">
                                ii. radical no-ego
                            </h2>
                            <p>
                                We check our titles at the door. It doesn't
                                matter if you're a Senior Engineer at a FAANG
                                company or a student shipping your first "Hello
                                World." Our status is determined solely by the
                                curiosity we bring and the lines of code we
                                commit.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-mono text-white mb-4">
                                iii. shipping as momentum
                            </h2>
                            <p>
                                We don't do networking. we do building. The
                                loudest person in the room is the one who just
                                demoed something they started three hours ago.
                                We prioritize the "ugly" version 1.0 over the
                                perfect version 0.0.
                            </p>
                        </section>

                        <section className="bg-zinc-900 p-8 border-l-4 border-[#22c55e] font-mono italic">
                            "We show up because we must build. We stay because
                            we found our people."
                        </section>
                    </div>
                </article>
            </main>
            <Footer />
        </div>
    );
}
