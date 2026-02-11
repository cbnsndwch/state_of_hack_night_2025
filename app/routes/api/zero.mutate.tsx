/**
 * Zero Sync Mutate Endpoint
 *
 * This endpoint handles mutation requests from Zero clients.
 * Zero-cache calls this endpoint to execute mutations (inserts, updates, deletes).
 * Mutations are applied to the PostgreSQL database using the Drizzle adapter.
 *
 * For this to work properly, mutations must be defined using defineMutators/defineMutator
 * from '@rocicorp/zero'. See the Zero documentation for examples:
 * https://zero.rocicorp.dev/docs/mutations
 */

import type { ActionFunctionArgs } from 'react-router';
import { getAuth } from '@clerk/react-router/ssr.server';
import { handleMutateRequest } from '@rocicorp/zero/server';
import { mustGetMutator } from '@rocicorp/zero';
import { dbProvider } from '@/lib/db/provider.server';
import { mutators } from '@/zero/mutators';

/**
 * Handle POST requests for Zero mutations
 *
 * Zero-cache sends the mutation name and arguments to this endpoint.
 * We authenticate the user via Clerk, look up the mutator implementation,
 * and execute it within a transaction.
 */
export async function action(actionArgs: ActionFunctionArgs) {
    try {
        // Get the authenticated user from Clerk
        const auth = await getAuth(actionArgs);
        const userId = auth.userId || 'anon';

        // Handle the mutation request using Zero's handleMutateRequest helper
        // This parses the request, executes mutations in a transaction, and returns results
        //
        // NOTE: The API has changed - handleMutateRequest now processes mutations differently
        // We'll need to update this once we have proper mutator implementations
        const result = await handleMutateRequest(
            dbProvider,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            async (tx: any, mutation: any) => {
                // Process individual mutation
                console.log('Mutation received:', { mutation, userId });

                // Extract mutation details
                const { id, clientID, name, args: mutationArgs } = mutation;

                try {
                    // Look up the mutator by name in our mutators registry
                    const mutator = mustGetMutator(mutators, name);

                    // Execute the mutator function with tx, args, and context
                    await mutator.fn({
                        tx,
                        args: mutationArgs,
                        ctx: {
                            userId,
                            role: 'user' // TODO: Determine role from profile
                        }
                    });

                    // Return success result
                    return {
                        id: { id, clientID },
                        result: { data: undefined }
                    };
                } catch (error) {
                    // Return error result
                    return {
                        id: { id, clientID },
                        result: {
                            error: 'app' as const,
                            message:
                                error instanceof Error
                                    ? error.message
                                    : 'Unknown error'
                        }
                    };
                }
            },
            actionArgs.request
        );

        // Return the result as JSON
        return Response.json(result);
    } catch (error) {
        console.error('Zero mutate error:', error);

        // Return error response
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
 * Handle GET requests (not supported - mutations must use POST)
 */
export async function loader() {
    return Response.json(
        { error: 'Zero mutate endpoint requires POST' },
        { status: 405 }
    );
}
