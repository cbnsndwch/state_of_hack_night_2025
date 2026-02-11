/**
 * Zero Sync Query Endpoint
 *
 * This endpoint handles query requests from Zero clients.
 * Zero-cache calls this endpoint to resolve query names + args into ZQL expressions.
 * The ZQL is then executed by zero-cache against its SQLite replica.
 *
 * For this to work properly, queries must be defined using defineQueries/defineQuery
 * from '@rocicorp/zero'. See the Zero documentation for examples:
 * https://zero.rocicorp.dev/docs/queries
 */

import type { ActionFunctionArgs } from 'react-router';
import { getAuth } from '@clerk/react-router/ssr.server';
import { handleQueryRequest } from '@rocicorp/zero/server';
import { mustGetQuery, defineQueries, defineQuery } from '@rocicorp/zero';
import { z } from 'zod';
import { schema } from '@/zero/schema';
import { zql } from '@/zero/schema';

/**
 * Define queries using Zero's query system
 *
 * These are example queries that demonstrate the correct pattern.
 * As we migrate components, we'll add more queries here.
 */
const queries = defineQueries({
    profiles: {
        // Example: Get profile by Clerk user ID
        byClerkUserId: defineQuery(
            z.object({ clerkUserId: z.string() }),
            ({ args: { clerkUserId } }) => {
                return zql.profiles.where('clerkUserId', clerkUserId).one();
            }
        ),
        // Example: Get all profiles
        all: defineQuery(() => {
            return zql.profiles.orderBy('createdAt', 'desc');
        })
    },
    projects: {
        // Example: Get all projects
        all: defineQuery(() => {
            return zql.projects
                .orderBy('createdAt', 'desc')
                .related('member', q => q.one());
        }),
        // Example: Get projects by member ID
        byMemberId: defineQuery(
            z.object({ memberId: z.string() }),
            ({ args: { memberId } }) => {
                return zql.projects
                    .where('memberId', memberId)
                    .orderBy('createdAt', 'desc');
            }
        )
    },
    events: {
        // Example: Get upcoming events
        upcoming: defineQuery(() => {
            const now = new Date();
            return zql.events
                .where(q => q.cmp('startAt', '>', now.getTime()))
                .orderBy('startAt', 'asc');
        })
    }
});

/**
 * Handle POST requests for Zero queries
 *
 * Zero-cache sends the query name and arguments to this endpoint.
 * We authenticate the user via Clerk, look up the query implementation,
 * and return the ZQL expression for zero-cache to execute.
 */
export async function action(args: ActionFunctionArgs) {
    try {
        // Get the authenticated user from Clerk
        const auth = await getAuth(args);
        const userId = auth.userId || 'anon';

        // Handle the query request using Zero's handleQueryRequest helper
        // This parses the request, looks up queries by name, and returns ZQL
        const result = await handleQueryRequest(
            (name, queryArgs) => {
                // Look up the query by name in our queries registry
                const query = mustGetQuery(queries, name);

                // Execute the query function with args and context
                // The query function returns a ZQL expression
                return query.fn({
                    args: queryArgs,
                    ctx: {
                        userId,
                        role: 'user' // TODO: Determine role from profile
                    }
                });
            },
            schema,
            args.request
        );

        // Return the result as JSON (ZQL expressions)
        return Response.json(result);
    } catch (error) {
        console.error('Zero query error:', error);

        // Return error response
        return Response.json(
            {
                error: error instanceof Error ? error.message : 'Unknown error',
                type: 'query-error'
            },
            { status: 500 }
        );
    }
}

/**
 * Handle GET requests (not supported - queries must use POST)
 */
export async function loader() {
    return Response.json(
        { error: 'Zero query endpoint requires POST' },
        { status: 405 }
    );
}
