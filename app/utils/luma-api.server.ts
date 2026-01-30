/**
 * Luma API client for Hello Miami.
 *
 * This module provides typed access to the Luma Public API for querying
 * calendar subscribers and calendar information.
 *
 * @see https://docs.luma.com/reference
 */

const LUMA_API_BASE = 'https://public-api.luma.com';

/**
 * Get the Luma API key from environment variables.
 * Throws if not configured.
 */
function getLumaApiKey(): string {
    const apiKey = process.env.LUMA_API_KEY;
    if (!apiKey) {
        throw new Error(
            'LUMA_API_KEY environment variable is not set. ' +
                'Get your API key from the Luma dashboard → Settings → Developer.'
        );
    }
    return apiKey;
}

/**
 * Make an authenticated request to the Luma API.
 */
async function lumaFetch<T>(
    endpoint: string,
    options?: RequestInit
): Promise<T> {
    const apiKey = getLumaApiKey();
    const url = `${LUMA_API_BASE}${endpoint}`;

    const response = await fetch(url, {
        ...options,
        headers: {
            'x-luma-api-key': apiKey,
            accept: 'application/json',
            ...options?.headers
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
            `Luma API error: ${response.status} ${response.statusText} - ${errorText}`
        );
    }

    return response.json() as Promise<T>;
}

// =============================================================================
// Types for Luma API responses
// =============================================================================

export interface LumaPerson {
    api_id: string;
    email: string;
    name: string;
    avatar_url?: string;
    created_at: string;
    event_checked_in_count?: number;
    event_approved_count?: number;
}

export interface LumaListPeopleResponse {
    entries: LumaPerson[];
    has_more: boolean;
    next_cursor?: string;
}

// =============================================================================

// =============================================================================
// API Functions
// =============================================================================

/**
 * Search for a person in the calendar by email.
 *
 * @param email - The email address to search for
 * @returns The person if found, null otherwise
 */
export async function findPersonByEmail(
    email: string
): Promise<LumaPerson | null> {
    const response = await lumaFetch<LumaListPeopleResponse>(
        `/v1/calendar/list-people?query=${encodeURIComponent(email)}&pagination_limit=1`
    );

    if (response.entries.length === 0) {
        return null;
    }

    // The API does a search, so we need to verify exact email match
    const person = response.entries.find(
        p => p.email.toLowerCase() === email.toLowerCase()
    );

    return person ?? null;
}

/**
 * Check if a user is subscribed to the calendar.
 *
 * @param email - The email to check
 * @returns Object with subscription status and person details
 */
export async function checkCalendarSubscription(email: string): Promise<{
    isSubscribed: boolean;
    person: LumaPerson | null;
}> {
    // Search for the person in the calendar subscribers
    const person = await findPersonByEmail(email);

    return {
        isSubscribed: person !== null,
        person
    };
}
