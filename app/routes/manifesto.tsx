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
                <article className="max-w-3xl mx-auto prose prose-invert font-sans">
                    <h1 className="text-5xl font-sans text-primary mb-12 drop-shadow-[4px_4px_0px_color-mix(in_srgb,var(--primary),transparent_80%)]">
                        the hello_miami manifesto
                    </h1>

                    <div className="space-y-12 text-lg leading-relaxed lowercase text-zinc-300">
                        <section>
                            <h2 className="text-2xl font-sans text-white mb-4">
                                i. the third place
                            </h2>
                            <p>
                                in a city often defined by surface-level
                                connections, hello_miami is the anchor. it is a
                                "third place"—a neutral ground for builders to
                                gather, away from the pressures of work and the
                                isolation of home.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-sans text-white mb-4">
                                ii. radical no-ego
                            </h2>
                            <p>
                                we check our titles at the door. it doesn't
                                matter if you're a senior engineer at a faang
                                company or a student shipping your first "hello
                                world." our status is determined solely by the
                                curiosity we bring and the lines of code we
                                commit.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-sans text-white mb-4">
                                iii. shipping as momentum
                            </h2>
                            <p>
                                rather than doing networking, we do building.
                                the loudest person in the room is the one who
                                just demoed something they started three hours
                                ago. we prioritize the "ugly" version 0.1 over
                                the perfect version 0.0.
                            </p>
                        </section>

                        <section className="bg-zinc-900 p-8 border-l-4 border-primary font-sans italic">
                            <p className="mb-2">
                                "we show up because we want to build. we stay
                                because we found our people."
                            </p>
                            <p className="text-right text-sm not-italic font-bold text-primary">
                                — all of us
                            </p>
                        </section>
                    </div>
                </article>
            </main>
            <Footer />
        </div>
    );
}
