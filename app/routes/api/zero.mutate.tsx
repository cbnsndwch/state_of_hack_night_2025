/**
 * Zero Sync Mutate Endpoint
 *
 * This endpoint handles mutation requests from zero-cache (NOT from direct
 * browser requests). When a client calls `zero.mutate(...)`, Zero sends
 * the mutation to zero-cache, and zero-cache calls this endpoint to execute
 * the mutation against Postgres.
 *
 * ## Auth flow
 *
 * The Zero client is created with a Clerk session JWT (`auth` option).
 * zero-cache stores that token and forwards it as an `Authorization: Bearer
 * <token>` header when it POSTs to this endpoint. Because the request
 * originates from zero-cache (a Docker container), it does NOT carry browser
 * cookies — so Clerk's cookie-based `getAuth()` would always return null.
 *
 * Instead we:
 *   1. Extract the Bearer token from the Authorization header.
 *   2. Verify it with Clerk's `verifyToken()` (which validates signature +
 *      expiration with a generous clock skew).
 *   3. Read the `sub` claim (Clerk user ID) from the verified payload.
 *
 * The `handleMutateRequest` utility from `@rocicorp/zero/server` parses
 * the push protocol, iterates mutations, and wraps each in a transaction.
 */

import type { ActionFunctionArgs } from 'react-router';
import { verifyToken } from '@clerk/react-router/server';
import { handleMutateRequest } from '@rocicorp/zero/server';
import { mustGetMutator } from '@rocicorp/zero';
import { dbProvider } from '@/lib/db/provider.server';
import { mutators } from '@/zero/mutators';
import { getProfileByClerkUserId } from '@/lib/db/profiles.server';

/**
 * Extract and verify the Clerk JWT from the Authorization header that
 * zero-cache forwards on every push request.
 *
 * Returns the Clerk user ID (`sub` claim) or null if auth fails.
 */
async function authenticateFromBearer(
    request: Request
): Promise<string | null> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.slice(7); // strip "Bearer "
    if (!token) return null;

    try {
        const payload = await verifyToken(token, {
            secretKey: process.env.CLERK_SECRET_KEY,
            // Allow up to 5 minutes of clock skew so that tokens nearing
            // expiry aren't rejected while zero-cache retries the push.
            clockSkewInMs: 5 * 60 * 1000
        });

        return payload.sub ?? null;
    } catch (err) {
        console.warn(
            '[Zero Mutate] Bearer token verification failed:',
            err instanceof Error ? err.message : err
        );
        return null;
    }
}

/**
 * Handle POST requests for Zero mutations.
 *
 * zero-cache sends mutation pushes to this endpoint. We authenticate the
 * user via the Bearer token, resolve the mutator, and execute it within a
 * DB transaction using Zero's `handleMutateRequest` + `transact` pattern.
 */
export async function action(actionArgs: ActionFunctionArgs) {
    try {
        // Authenticate via Bearer token forwarded by zero-cache
        const userId = await authenticateFromBearer(actionArgs.request);

        if (!userId) {
            console.log(
                'Zero Mutate: No valid Bearer token. Returning 401.',
                'Headers present:',
                [...actionArgs.request.headers.keys()].join(', ')
            );
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log(
            'Zero Mutate: Authenticated successfully. Proceeding to handleMutateRequest.'
        );

        // Look up user's role for context
        let userRole = 'user';
        try {
            const profile = await getProfileByClerkUserId(userId);
            if (profile?.isAppAdmin) {
                userRole = 'admin';
            }
        } catch {
            // Fall back to 'user' role if profile lookup fails
        }

        // Handle the mutation using Zero's transact pattern.
        // handleMutateRequest parses the push request from zero-cache,
        // iterates over mutations, and calls our callback for each one.
        const result = await handleMutateRequest(
            dbProvider,
            transact =>
                transact((tx, name, args) => {
                    const mutator = mustGetMutator(mutators, name);
                    return mutator.fn({
                        args,
                        tx,
                        ctx: {
                            userId,
                            role: userRole
                        }
                    });
                }),
            actionArgs.request
        );

        return Response.json(result);
    } catch (error) {
        console.error('Zero mutate error:', error);
        return Response.json(
            {
                error: error instanceof Error ? error.message : 'Unknown error',
                type: 'mutate-error'
            },
            { status: 500 }
        );
    }
}

/**
 * Handle GET requests (not supported — mutations must use POST)
 */
export async function loader() {
    return Response.json(
        { error: 'Zero mutate endpoint requires POST' },
        { status: 405 }
    );
}
