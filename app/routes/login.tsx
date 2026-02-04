import { useEffect } from 'react';
import { useNavigate, type MetaFunction } from 'react-router';
import { SignIn, useUser } from '@clerk/react-router';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

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
    const { user, isLoaded } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        // Redirect to dashboard if already logged in
        if (isLoaded && user) {
            navigate('/dashboard');
        }
    }, [user, isLoaded, navigate]);

    if (!isLoaded) {
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

                    {/* Clerk Sign-In Component */}
                    <div className="flex justify-center">
                        <SignIn
                            routing="path"
                            path="/login"
                            signUpUrl="/signup"
                            afterSignInUrl="/dashboard"
                            appearance={{
                                elements: {
                                    rootBox: 'mx-auto',
                                    card: 'bg-zinc-900 border border-zinc-800 shadow-lg',
                                    headerTitle: 'text-primary font-sans',
                                    headerSubtitle: 'text-zinc-400 font-sans',
                                    socialButtonsBlockButton:
                                        'bg-white text-black hover:bg-zinc-200 font-sans',
                                    formButtonPrimary:
                                        'bg-primary hover:bg-primary/90 font-sans',
                                    footerActionLink:
                                        'text-primary hover:text-primary/90',
                                    identityPreviewText: 'text-zinc-300',
                                    formFieldInput:
                                        'bg-zinc-800 border-zinc-700 text-white font-sans',
                                    formFieldLabel: 'text-zinc-300 font-sans'
                                }
                            }}
                        />
                    </div>

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
