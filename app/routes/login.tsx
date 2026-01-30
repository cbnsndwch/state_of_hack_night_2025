import { useEffect } from 'react';
import { useNavigate, type MetaFunction } from 'react-router';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { LoginDialog } from '@/components/auth/LoginDialog';
import { useAuth } from '@/hooks/use-auth';
import { GithubIcon, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NeoCard } from '@/components/ui/NeoCard';
import { useState } from 'react';

export const meta: MetaFunction = () => {
    return [
        { title: 'Login | hello_miami' },
        {
            name: 'description',
            content: 'Sign in to access your builder profile and dashboard.'
        }
    ];
};

export default function Login() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const [emailDialogOpen, setEmailDialogOpen] = useState(false);

    useEffect(() => {
        // Redirect to dashboard if already logged in
        if (!loading && user) {
            navigate('/dashboard');
        }
    }, [user, loading, navigate]);

    const handleGitHubLogin = async () => {
        const { supabase } = await import('@/utils/supabase');
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`
            }
        });

        if (error) {
            console.error('GitHub OAuth error:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="font-sans text-primary animate-pulse">
                    loading...
                </div>
            </div>
        );
    }

    if (user) return null;

    return (
        <div className="min-h-screen flex flex-col bg-black">
            <Navbar />
            <main className="grow flex items-center justify-center px-4 py-12">
                <div className="max-w-md w-full space-y-8">
                    {/* Header */}
                    <div className="text-center">
                        <h1 className="text-4xl font-sans text-primary mb-2">
                            member_login
                        </h1>
                        <p className="text-zinc-400">
                            Access your builder profile and dashboard.
                        </p>
                    </div>

                    {/* Login Options */}
                    <NeoCard className="p-8 space-y-4">
                        {/* GitHub OAuth */}
                        <Button
                            onClick={handleGitHubLogin}
                            className="w-full bg-white text-black hover:bg-zinc-200 font-sans flex items-center justify-center gap-2 py-6"
                        >
                            <GithubIcon className="w-5 h-5" />
                            continue_with_github
                        </Button>

                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-zinc-800"></div>
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="bg-black px-2 text-zinc-500 font-sans">
                                    or
                                </span>
                            </div>
                        </div>

                        {/* Email OTP */}
                        <Button
                            onClick={() => setEmailDialogOpen(true)}
                            variant="outline"
                            className="w-full border-zinc-700 text-white hover:bg-zinc-900 font-sans flex items-center justify-center gap-2 py-6"
                        >
                            <Mail className="w-5 h-5" />
                            continue_with_email
                        </Button>
                    </NeoCard>

                    {/* Info */}
                    <div className="text-center text-sm text-zinc-500">
                        <p>
                            Only members subscribed to our{' '}
                            <a
                                href="https://lu.ma/hello_miami"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                            >
                                Luma calendar
                            </a>{' '}
                            can log in.
                        </p>
                    </div>
                </div>
            </main>

            {/* Email Login Dialog */}
            <LoginDialog
                open={emailDialogOpen}
                onOpenChange={setEmailDialogOpen}
            />

            <Footer />
        </div>
    );
}
