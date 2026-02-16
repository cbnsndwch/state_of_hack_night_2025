/**
 * Zero Sync Mutate Endpoint
 *
 * This endpoint handles mutation requests from zero-cache (NOT from direct
 * browser requests). When a client calls `zero.mutate(...)`, Zero sends
 * the mutation to zero-cache, and zero-cache calls this endpoint to execute
 * the mutation against Postgres.
 *
 * The `handleMutateRequest` utility from `@rocicorp/zero/server` parses
 * the push protocol, iterates mutations, and wraps each in a transaction.
 */

import type { ActionFunctionArgs } from 'react-router';
import { getAuth } from '@clerk/react-router/server';
import { handleMutateRequest } from '@rocicorp/zero/server';
import { mustGetMutator } from '@rocicorp/zero';
import { dbProvider } from '@/lib/db/provider.server';
import { mutators } from '@/zero/mutators';
import { getProfileByClerkUserId } from '@/lib/db/profiles.server';

/**
 * Handle POST requests for Zero mutations.
 *
 * zero-cache sends mutation pushes to this endpoint. We authenticate the
 * user via Clerk, resolve the mutator, and execute it within a DB transaction
 * using Zero's `handleMutateRequest` + `transact` pattern.
 */
export async function action(actionArgs: ActionFunctionArgs) {
    try {
        // Authenticate the user via Clerk
        const auth = await getAuth(actionArgs);
        const userId = auth.userId;

        if (!userId) {
            console.log('Zero Mutate: No userId found. Returning 401.');
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('Zero Mutate: Authenticated successfully. Proceeding to handleMutateRequest.');

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
                error:
                    error instanceof Error ? error.message : 'Unknown error',
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
