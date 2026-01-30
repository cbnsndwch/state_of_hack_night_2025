import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for changes
        const {
            data: { subscription }
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    /**
     * Check if user is allowed to log in
     */
    const checkUserByEmail = async (email: string) => {
        const formData = new FormData();
        formData.append('email', email);

        const response = await fetch('/api/auth/check-user', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to check user');
        }

        return await response.json();
    };

    /**
     * Send OTP to email for sign in
     */
    const signInWithEmail = async (email: string) => {
        // We allow creating the user in Supabase because we've already gated them
        // via checkUserByEmail in the UI.
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: true
            }
        });
        if (error) throw error;
    };

    /**
     * Verify OTP code and complete sign in
     */
    const verifyOtp = async (email: string, token: string) => {
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'email'
        });

        if (error) throw error;

        // After successful verification, we should ensure the profile is linked
        // We can do this by calling a sync endpoint
        if (data.session) {
            await fetch('/api/auth/complete-login', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${data.session.access_token}`
                }
            });
        }

        return data;
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    };

    return {
        user,
        loading,
        checkUserByEmail,
        signInWithEmail,
        verifyOtp,
        signOut
    };
}
