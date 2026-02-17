import { useNavigate } from 'react-router';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useSafeQuery } from '@/hooks/use-safe-query';
import { profileQueries } from '@/zero/queries';
import { AppLayout } from '@/components/layout/AppLayout';
import { CheckInHistory } from '@/components/events/CheckInHistory';
import { ImHereButton } from '@/components/events/ImHereButton';
import { NeoCard } from '@/components/ui/NeoCard';
import { Button } from '@/components/ui/button';
import { createDashboardLoader } from '@/lib/create-dashboard-loader.server';

export { DashboardErrorBoundary as ErrorBoundary } from '@/components/layout/DashboardErrorBoundary';

export const loader = createDashboardLoader();

export default function DashboardCheckIns() {
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
                        hack_night_streak
                    </h1>
                    <p className="text-zinc-400 font-sans">
                        track your attendance and keep your streak alive
                    </p>
                </header>

                {/* Streak stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                    <NeoCard>
                        <div className="text-xs font-sans text-zinc-500 mb-1">
                            current streak
                        </div>
                        <div className="text-3xl font-sans text-primary">
                            {profile?.streakCount || 0} weeks
                        </div>
                    </NeoCard>

                    <ImHereButton lumaAttendeeId={profile?.lumaAttendeeId} />
                </div>

                {/* Check-in history */}
                <section>
                    <h2 className="text-2xl font-sans text-primary mb-6">
                        check_in_history
                    </h2>
                    <CheckInHistory />
                </section>
            </main>
        </AppLayout>
    );
}
