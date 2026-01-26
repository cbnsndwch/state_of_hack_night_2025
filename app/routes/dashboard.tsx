import { useNavigate } from 'react-router';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { NeoCard } from '@/components/ui/NeoCard';

export default function Dashboard() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && !user) {
            navigate('/');
        }
    }, [user, loading, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="font-mono text-[#22c55e] animate-pulse">
                    loading...
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-black text-white selection:bg-[#22c55e] selection:text-black">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-12">
                <header className="mb-12">
                    <h1 className="text-4xl font-mono text-[#22c55e] mb-2">
                        builder_dashboard
                    </h1>
                    <p className="text-zinc-400 font-mono">
                        welcome back,{' '}
                        {user.user_metadata.full_name ||
                            user.email?.split('@')[0]}
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Profile Stats */}
                    <NeoCard className="md:col-span-2">
                        <h2 className="text-xl font-mono text-[#22c55e] mb-6">
                            profile
                        </h2>
                        <div className="space-y-6">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center">
                                    {user.user_metadata.avatar_url ? (
                                        <img
                                            src={user.user_metadata.avatar_url}
                                            alt="profile"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="text-3xl font-bold">
                                            ?
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="text-lg font-mono">
                                        {user.user_metadata.full_name ||
                                            'anonymous builder'}
                                    </div>
                                    <div className="text-zinc-500 font-mono text-sm">
                                        {user.email}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-zinc-900/50 border border-zinc-800">
                                    <div className="text-xs font-mono text-zinc-500 mb-1">
                                        attendance streak
                                    </div>
                                    <div className="text-2xl font-mono text-[#22c55e]">
                                        0 weeks
                                    </div>
                                </div>
                                <div className="p-4 bg-zinc-900/50 border border-zinc-800">
                                    <div className="text-xs font-mono text-zinc-500 mb-1">
                                        total hacks
                                    </div>
                                    <div className="text-2xl font-mono text-[#22c55e]">
                                        0
                                    </div>
                                </div>
                            </div>
                        </div>
                    </NeoCard>

                    {/* Quick Links / Actions */}
                    <div className="space-y-6">
                        <NeoCard variant="cyan">
                            <h3 className="text-lg font-mono mb-4">
                                upcoming_events
                            </h3>
                            <p className="text-sm text-zinc-400 mb-4">
                                check into the next hack night to start your
                                streak.
                            </p>
                            <a
                                href="https://luma.com/hello_miami"
                                target="_blank"
                                className="block w-full py-2 bg-black border border-white text-center font-mono text-sm hover:invert transition-all"
                            >
                                view on luma
                            </a>
                        </NeoCard>

                        <NeoCard variant="magenta">
                            <h3 className="text-lg font-mono mb-4">
                                ships_gallery
                            </h3>
                            <p className="text-sm text-zinc-400 mb-4">
                                show the community what you've been building.
                            </p>
                            <button className="w-full py-2 bg-black border border-white text-center font-mono text-sm hover:invert transition-all">
                                submit a project
                            </button>
                        </NeoCard>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
