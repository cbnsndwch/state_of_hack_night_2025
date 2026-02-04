import { useUser, useClerk, useSignIn, useSignUp } from '@clerk/react-router';
import { useEffect, useRef } from 'react';

/**
 * Custom auth hook using Clerk.
 * Provides a unified interface for authentication across the app.
 */
export function useAuth() {
    const { user: clerkUser, isLoaded } = useUser();
    const { signOut: clerkSignOut, setActive } = useClerk();
    const { signIn, isLoaded: signInLoaded } = useSignIn();
    const { signUp, isLoaded: signUpLoaded } = useSignUp();

    // Store the email address ID for OTP verification
    const emailAddressIdRef = useRef<string | null>(null);
    // Track whether we're in sign-up mode
    const isSignUpModeRef = useRef(false);

    // Transform Clerk user to our expected format
    const user = clerkUser
        ? {
              id: clerkUser.id,
              email:
                  clerkUser.emailAddresses[0]?.emailAddress ||
                  clerkUser.primaryEmailAddress?.emailAddress ||
                  ''
          }
        : null;

    const loading = !isLoaded;

    useEffect(() => {
        // Ensure profile exists in MongoDB after login
        const ensureProfile = async () => {
            if (!clerkUser) return;

            try {
                await fetch('/api/auth/complete-login', {
                    method: 'POST'
                });
            } catch (err) {
                console.error('Failed to sync profile:', err);
            }
        };

        if (clerkUser && isLoaded) {
            ensureProfile();
        }
    }, [clerkUser, isLoaded]);

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

    const signOut = async () => {
        await clerkSignOut();
    };

    /**
     * Send OTP to email for sign in using Clerk.
     * If the user doesn't have a Clerk account yet, automatically switches to sign-up flow.
     */
    const signInWithEmail = async (email: string) => {
        if (!signIn || !signInLoaded || !signUp || !signUpLoaded) {
            throw new Error('Auth not initialized');
        }

        // Reset sign-up mode
        isSignUpModeRef.current = false;

        try {
            // Try to sign in first (for existing users)
            const result = await signIn.create({
                identifier: email
            });

            // Find the email_code factor
            const emailCodeFactor = result.supportedFirstFactors?.find(
                factor => factor.strategy === 'email_code'
            );

            if (!emailCodeFactor || emailCodeFactor.strategy !== 'email_code') {
                throw new Error('Email code authentication not available');
            }

            // Store the email address ID for verification
            emailAddressIdRef.current = emailCodeFactor.emailAddressId;

            // Prepare email code verification (sends the OTP)
            await signIn.prepareFirstFactor({
                strategy: 'email_code',
                emailAddressId: emailCodeFactor.emailAddressId
            });
        } catch (err: unknown) {
            // Check if this is a "user not found" error - switch to sign-up flow
            const clerkError = err as { errors?: Array<{ code: string }> };
            const isUserNotFound = clerkError.errors?.some(
                e =>
                    e.code === 'form_identifier_not_found' ||
                    e.code === 'identifier_not_found'
            );

            if (isUserNotFound) {
                // Switch to sign-up flow
                isSignUpModeRef.current = true;

                // Create a new sign-up with email
                await signUp.create({
                    emailAddress: email
                });

                // Prepare email code verification for sign-up
                await signUp.prepareEmailAddressVerification({
                    strategy: 'email_code'
                });
            } else {
                throw err;
            }
        }
    };

    /**
     * Verify OTP code and complete sign in or sign up
     */
    const verifyOtp = async (_email: string, code: string) => {
        if (isSignUpModeRef.current) {
            // Complete sign-up flow
            if (!signUp || !signUpLoaded) {
                throw new Error('Sign up not initialized');
            }

            const result = await signUp.attemptEmailAddressVerification({
                code
            });

            if (result.status === 'complete') {
                // Set the new session as active
                if (result.createdSessionId) {
                    await setActive({ session: result.createdSessionId });
                }
                return result;
            }

            // Handle missing requirements (e.g., password required in Clerk config)
            if (result.status === 'missing_requirements') {
                const missingFields = result.missingFields || [];
                if (missingFields.includes('password')) {
                    throw new Error(
                        'Account setup incomplete. Please contact support or sign up with a different method.'
                    );
                }
                throw new Error(
                    `Missing required fields: ${missingFields.join(', ')}`
                );
            }

            throw new Error('Verification failed. Please try again.');
        } else {
            // Complete sign-in flow
            if (!signIn || !signInLoaded) {
                throw new Error('Sign in not initialized');
            }

            const result = await signIn.attemptFirstFactor({
                strategy: 'email_code',
                code
            });

            if (result.status !== 'complete') {
                throw new Error(
                    'Verification failed. Please check your code and try again.'
                );
            }

            // Set the session as active
            if (result.createdSessionId) {
                await setActive({ session: result.createdSessionId });
            }

            return result;
        }
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
