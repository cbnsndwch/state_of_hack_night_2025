/**
 * Dashboard Loader Factory
 *
 * Creates standardized server-side loaders for dashboard routes.
 * Handles authentication, profile fetching, and optional data extension.
 *
 * This provides immediate data on navigation — Zero's reactive sync
 * then takes over for live updates after hydration.
 *
 * Usage:
 * ```ts
 * // Simple: just auth + profile
 * export const loader = createDashboardLoader();
 *
 * // Extended: auth + profile + additional data
 * export const loader = createDashboardLoader(async ({ profile }) => {
 *     const projects = profile ? await getProjectsByMemberId(profile.id) : [];
 *     return { projects };
 * });
 * ```
 */

import { getAuth } from '@clerk/react-router/server';
import type { LoaderFunctionArgs } from 'react-router';

import { getProfileByClerkUserId } from '@/lib/db/profiles.server';

// Re-export the profile type for consumers
export type { Profile } from '@/zero/schema';

/**
 * Base data returned by every dashboard loader.
 */
export type DashboardLoaderBase = {
    profile: Awaited<ReturnType<typeof getProfileByClerkUserId>>;
};

/**
 * Full loader data = base + whatever the extend callback returns.
 */
export type DashboardLoaderData<T = Record<string, never>> =
    DashboardLoaderBase & T;

/**
 * Arguments passed to the `extend` callback.
 */
export type DashboardLoaderContext = {
    /** Authenticated Clerk user ID */
    userId: string;
    /** Profile fetched from Postgres (null if not found) */
    profile: DashboardLoaderBase['profile'];
    /** Original React Router loader args */
    args: LoaderFunctionArgs;
};

/**
 * Creates a server-side loader for dashboard routes.
 *
 * Every dashboard loader:
 * 1. Checks authentication (redirects to `/login` if not authenticated)
 * 2. Fetches the user's profile from Postgres
 * 3. Optionally fetches additional data via the `extend` callback
 *
 * @param extend - Optional async function to fetch additional route-specific data
 * @returns A React Router loader function
 */
export function createDashboardLoader<T = Record<string, never>>(
    extend?: (ctx: DashboardLoaderContext) => Promise<T>
) {
    return async (args: LoaderFunctionArgs): Promise<DashboardLoaderData<T>> => {
        const auth = await getAuth(args);

        if (!auth.userId) {
            throw new Response(null, {
                status: 302,
                headers: { Location: '/login' }
            });
        }

        const profile = await getProfileByClerkUserId(auth.userId);

        const extra = extend
            ? await extend({ userId: auth.userId, profile, args })
            : ({} as T);

        return { profile, ...extra };
    };
}
