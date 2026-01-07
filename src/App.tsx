import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Hero } from '@/sections/Hero';
import { Geography } from '@/sections/Geography';
import { Impact } from '@/sections/Impact';
import { Interests } from '@/sections/Interests';

export default function App() {
    return (
        <TooltipProvider>
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
        </TooltipProvider>
    );
}
