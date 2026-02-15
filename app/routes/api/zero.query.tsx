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
import { getAuth } from '@clerk/react-router/server';
import { handleQueryRequest } from '@rocicorp/zero/server';
import { mustGetQuery, defineQueries, defineQuery } from '@rocicorp/zero';
import { z } from 'zod';
import { schema } from '@/zero/schema';
import {
    profileQueries,
    projectQueries,
    badgeQueries,
    eventQueries,
    attendanceQueries,
    surveyQueries,
    surveyResponseQueries,
    demoSlotQueries
} from '@/zero/queries';
import { getProfileByClerkUserId } from '@/lib/db/profiles.server';

/**
 * Define queries using Zero's query system
 *
 * Import all queries from the centralized queries file and expose them
 * through Zero's query registry system.
 */
const queries = defineQueries({
    profiles: {
        byClerkUserId: defineQuery(
            z.object({ clerkUserId: z.string() }),
            ({ args: { clerkUserId } }) =>
                profileQueries.byClerkUserId(clerkUserId)
        ),
        byId: defineQuery(z.object({ id: z.string() }), ({ args: { id } }) =>
            profileQueries.byId(id)
        ),
        all: defineQuery(() => profileQueries.all()),
        search: defineQuery(
            z.object({ query: z.string() }),
            ({ args: { query } }) => profileQueries.search(query)
        )
    },
    projects: {
        all: defineQuery(() => projectQueries.all()),
        byMemberId: defineQuery(
            z.object({ memberId: z.string() }),
            ({ args: { memberId } }) => projectQueries.byMemberId(memberId)
        ),
        byId: defineQuery(z.object({ id: z.string() }), ({ args: { id } }) =>
            projectQueries.byId(id)
        ),
        search: defineQuery(
            z.object({ query: z.string() }),
            ({ args: { query } }) => projectQueries.search(query)
        )
    },
    badges: {
        all: defineQuery(() => badgeQueries.all()),
        byMemberId: defineQuery(
            z.object({ memberId: z.string() }),
            ({ args: { memberId } }) => badgeQueries.byMemberId(memberId)
        )
    },
    events: {
        upcoming: defineQuery(() => eventQueries.upcoming()),
        past: defineQuery(() => eventQueries.past()),
        byId: defineQuery(z.object({ id: z.string() }), ({ args: { id } }) =>
            eventQueries.byId(id)
        ),
        byLumaEventId: defineQuery(
            z.object({ lumaEventId: z.string() }),
            ({ args: { lumaEventId } }) =>
                eventQueries.byLumaEventId(lumaEventId)
        )
    },
    attendance: {
        byMemberId: defineQuery(
            z.object({ memberId: z.string() }),
            ({ args: { memberId } }) => attendanceQueries.byMemberId(memberId)
        ),
        byLumaEventId: defineQuery(
            z.object({ lumaEventId: z.string() }),
            ({ args: { lumaEventId } }) =>
                attendanceQueries.byLumaEventId(lumaEventId)
        ),
        memberAtEvent: defineQuery(
            z.object({ memberId: z.string(), lumaEventId: z.string() }),
            ({ args: { memberId, lumaEventId } }) =>
                attendanceQueries.memberAtEvent(memberId, lumaEventId)
        )
    },
    surveys: {
        active: defineQuery(() => surveyQueries.active()),
        bySlug: defineQuery(
            z.object({ slug: z.string() }),
            ({ args: { slug } }) => surveyQueries.bySlug(slug)
        ),
        byId: defineQuery(z.object({ id: z.string() }), ({ args: { id } }) =>
            surveyQueries.byId(id)
        )
    },
    surveyResponses: {
        bySurveyId: defineQuery(
            z.object({ surveyId: z.string() }),
            ({ args: { surveyId } }) =>
                surveyResponseQueries.bySurveyId(surveyId)
        ),
        byMemberAndSurvey: defineQuery(
            z.object({ memberId: z.string(), surveyId: z.string() }),
            ({ args: { memberId, surveyId } }) =>
                surveyResponseQueries.byMemberAndSurvey(memberId, surveyId)
        ),
        byMemberId: defineQuery(
            z.object({ memberId: z.string() }),
            ({ args: { memberId } }) =>
                surveyResponseQueries.byMemberId(memberId)
        )
    },
    demoSlots: {
        byEventId: defineQuery(
            z.object({ eventId: z.string() }),
            ({ args: { eventId } }) => demoSlotQueries.byEventId(eventId)
        ),
        byMemberId: defineQuery(
            z.object({ memberId: z.string() }),
            ({ args: { memberId } }) => demoSlotQueries.byMemberId(memberId)
        ),
        pendingByEventId: defineQuery(
            z.object({ eventId: z.string() }),
            ({ args: { eventId } }) => demoSlotQueries.pendingByEventId(eventId)
        )
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

        // Resolve the user's role from their profile
        let role: 'admin' | 'user' = 'user';
        if (userId && userId !== 'anon') {
            const profile = await getProfileByClerkUserId(userId);
            if (profile?.isAppAdmin) {
                role = 'admin';
            }
        }

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
                        role
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
