import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '@/utils/supabase';

/**
 * OAuth callback route for GitHub authentication
 * Handles the redirect from Supabase after GitHub OAuth
 */
export default function AuthCallback() {
    const navigate = useNavigate();

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // Get the session from the URL hash
                const { data, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('Auth callback error:', error);
                    navigate('/login?error=auth_failed');
                    return;
                }

                if (data.session) {
                    // Call the complete-login endpoint to link/create MongoDB profile
                    const response = await fetch('/api/auth/complete-login', {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${data.session.access_token}`
                        }
                    });

                    if (!response.ok) {
                        console.error('Failed to complete login');
                        navigate('/login?error=profile_sync_failed');
                        return;
                    }

                    // Success - redirect to dashboard
                    navigate('/dashboard');
                } else {
                    // No session - redirect to login
                    navigate('/login');
                }
            } catch (err) {
                console.error('Unexpected error in auth callback:', err);
                navigate('/login?error=unexpected');
            }
        };

        handleCallback();
    }, [navigate]);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-center space-y-4">
                <div className="font-sans text-primary animate-pulse text-xl">
                    completing_login...
                </div>
                <div className="text-zinc-400 text-sm font-sans">
                    setting up your profile
                </div>
            </div>
        </div>
    );
}
