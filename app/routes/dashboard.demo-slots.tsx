import { useNavigate } from 'react-router';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useSafeQuery } from '@/hooks/use-safe-query';
import { profileQueries } from '@/zero/queries';
import { AppLayout } from '@/components/layout/AppLayout';
import { DemoSlotsList } from '@/components/events/DemoSlotsList';
import { DemoSlotBookingDialog } from '@/components/events/DemoSlotBookingDialog';
import { NeoCard } from '@/components/ui/NeoCard';
import { Button } from '@/components/ui/button';
import { createDashboardLoader } from '@/lib/create-dashboard-loader.server';

export { DashboardErrorBoundary as ErrorBoundary } from '@/components/layout/DashboardErrorBoundary';

export const loader = createDashboardLoader();

export default function DashboardDemoSlots() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    const [zeroProfile] = useSafeQuery(
        user?.id ? profileQueries.byClerkUserId(user.id) : null
    );

    useEffect(() => {
        if (!loading && !user) {
            navigate('/');
        }
    }, [user, loading, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="font-sans text-primary animate-pulse">
                    loading...
                </div>
            </div>
        );
    }

    if (!user) return null;

    const profile = zeroProfile ?? null;

    return (
        <AppLayout isAdmin={!!profile?.isAppAdmin}>
            <main className="max-w-6xl mx-auto bg-black text-white selection:bg-primary selection:text-black min-h-full">
                <header className="mb-8">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/dashboard')}
                        className="text-zinc-400 hover:text-white font-sans text-sm mb-3 flex items-center gap-2"
                    >
                        <span>←</span> back to dashboard
                    </Button>
                    <h1 className="text-3xl font-sans text-primary mb-2">
                        demo_slots
                    </h1>
                    <p className="text-zinc-400 font-sans">
                        reserve a time slot to present your project at an
                        upcoming hack night
                    </p>
                </header>

                {/* Book a demo slot */}
                <div className="mb-8">
                    <NeoCard variant="cyan">
                        <h3 className="text-lg font-sans mb-4">book_a_slot</h3>
                        <p className="text-sm text-zinc-400 mb-4">
                            reserve a time slot to present your project at an
                            upcoming hack night.
                        </p>
                        <DemoSlotBookingDialog
                            onDemoBooked={() => {
                                // Zero will automatically sync the new demo slot
                            }}
                        />
                    </NeoCard>
                </div>

                {/* My demo slots */}
                <section>
                    <h2 className="text-2xl font-sans text-primary mb-6">
                        my_demo_slots
                    </h2>
                    <DemoSlotsList memberId={profile?.id} />
                </section>
            </main>
        </AppLayout>
    );
}
