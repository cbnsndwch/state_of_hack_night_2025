/**
 * Authentication hook using Clerk
 * Replaces the Supabase-based auth hook
 */

import { useUser, useClerk } from '@clerk/react-router';
import { useEffect } from 'react';

export function useAuth() {
    const { user, isLoaded } = useUser();
    const { signOut: clerkSignOut } = useClerk();

    const loading = !isLoaded;

    // Ensure MongoDB profile is synced after authentication
    useEffect(() => {
        if (user) {
            fetch('/api/auth/complete-login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    clerkUserId: user.id,
                    email: user.primaryEmailAddress?.emailAddress,
                }),
            }).catch((err) => {
                console.error('Failed to sync profile:', err);
            });
        }
    }, [user]);

    /**
     * Check if user is allowed to log in (verify Luma subscription)
     */
    const checkUserByEmail = async (email: string) => {
        const formData = new FormData();
        formData.append('email', email);

        const response = await fetch('/api/auth/check-user', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Failed to check user');
        }

        return await response.json();
    };

    /**
     * Sign out the current user
     */
    const signOut = async () => {
        await clerkSignOut();
    };

    return {
        user: user
            ? {
                  id: user.id,
                  email: user.primaryEmailAddress?.emailAddress,
              }
            : null,
        loading,
        checkUserByEmail,
        signOut,
    };
}

        return await response.json();
    };

    /**
     * Send OTP to email for sign in using Clerk
     */
    const signInWithEmail = async (email: string) => {
        if (!signIn) {
            throw new Error('Sign in not initialized');
        }

        // First, check if user is allowed to sign in
        const checkResult = await checkUserByEmail(email);
        if (!checkResult.allowed) {
            throw new Error(checkResult.message || 'Not authorized to sign in');
        }

        // Start the sign-in process with email link
        await signIn.create({
            identifier: email
        });

        // Prepare email link verification
        await signIn.prepareFirstFactor({
            strategy: 'email_link',
            emailAddressId: signIn.supportedFirstFactors.find(
                factor => factor.strategy === 'email_link'
            )?.emailAddressId
        });
    };

    /**
     * Verify email link and complete sign in
     * Note: With Clerk, email links are verified automatically via URL params
     * This method is for compatibility; the actual verification happens via Clerk's built-in flow
     */
    const verifyEmailLink = async () => {
        if (!signIn) {
            throw new Error('Sign in not initialized');
        }

        // Attempt to complete the sign-in (Clerk handles the verification token from URL)
        const result = await signIn.attemptFirstFactor({
            strategy: 'email_link'
        });

        return result;
    };

    /**
     * Sign out the current user
     */
    const signOut = async () => {
        await clerkSignOut();
    };

    return {
        user: user
            ? { id: user.id, email: user.primaryEmailAddress?.emailAddress }
            : null,
        loading,
        checkUserByEmail,
        signInWithEmail,
        verifyEmailLink,
        signOut
    };
}
