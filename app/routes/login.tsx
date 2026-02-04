import { useEffect } from 'react';
import { useNavigate, type MetaFunction } from 'react-router';
import { useClerk } from '@clerk/react-router';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/hooks/use-auth';
import { GithubIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NeoCard } from '@/components/ui/NeoCard';

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
    const { openSignIn } = useClerk();
    const navigate = useNavigate();

    useEffect(() => {
        // Redirect to dashboard if already logged in
        if (!loading && user) {
            navigate('/dashboard');
        }
    }, [user, loading, navigate]);

    const handleGitHubLogin = () => {
        openSignIn({
            redirectUrl: '/dashboard',
            appearance: {
                elements: {
                    rootBox: 'mx-auto',
                    card: 'bg-black border border-primary'
                }
            }
        });
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
                        {/* GitHub OAuth via Clerk */}
                        <Button
                            onClick={handleGitHubLogin}
                            className="w-full bg-white text-black hover:bg-zinc-200 font-sans flex items-center justify-center gap-2 py-6"
                        >
                            <GithubIcon className="w-5 h-5" />
                            continue_with_clerk
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

            <Footer />
        </div>
    );
}
