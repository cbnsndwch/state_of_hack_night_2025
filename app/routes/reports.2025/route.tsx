import { type MetaFunction } from 'react-router';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Hero } from '@/sections/Hero';
import { Geography } from '@/sections/Geography';
import { Impact } from '@/sections/Impact';
import { Interests } from '@/sections/Interests';

export const meta: MetaFunction = () => {
    return [
        { title: 'hello_miami | 2025 impact report' },
        {
            name: 'description',
            content:
                'a look back at the growth and impact of hack night in 2025.'
        }
    ];
};

export default function Report2025() {
    return (
        <div className="min-h-screen bg-dots-zinc-900 bg-size-[20px_20px] bg-zinc-950">
            <Navbar />
            <main className="space-y-12 pb-20">
                <Hero />
                <Impact />
                <Interests />
                <Geography />
            </main>
            <Footer />
        </div>
    );
}
