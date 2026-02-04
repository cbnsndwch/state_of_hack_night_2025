/**
 * Clerk server-side utilities for React Router
 */

import { createClerkClient } from '@clerk/react-router/api.server';

if (!process.env.CLERK_SECRET_KEY) {
    throw new Error('CLERK_SECRET_KEY environment variable is required');
}

/**
 * Clerk client for server-side operations
 * Use this to verify tokens and fetch user data
 */
export const clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY
});
