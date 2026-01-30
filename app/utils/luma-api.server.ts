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

export interface LumaEvent {
    api_id: string;
    name: string;
    description?: string;
    cover_url?: string;
    url: string;
    start_at: string; // ISO 8601
    end_at?: string; // ISO 8601
    timezone: string;
    geo_address_info?: {
        address?: string;
        city?: string;
        latitude?: number;
        longitude?: number;
        place_name?: string;
        type?: string;
    };
    guest_count?: number;
    approval_count?: number;
    is_canceled?: boolean;
}

export interface LumaListEventsResponse {
    entries: LumaEvent[];
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

/**
 * List events from the calendar.
 *
 * @param options - Options for filtering and pagination
 * @returns List of events with pagination info
 */
export async function listCalendarEvents(options?: {
    /** Starting date filter (ISO 8601) */
    startingAfter?: string;
    /** Ending date filter (ISO 8601) */
    endingBefore?: string;
    /** Pagination cursor from previous response */
    paginationCursor?: string;
    /** Number of events to return (max 100) */
    paginationLimit?: number;
}): Promise<LumaListEventsResponse> {
    const params = new URLSearchParams();

    if (options?.startingAfter) {
        params.set('period_starts_after', options.startingAfter);
    }
    if (options?.endingBefore) {
        params.set('period_ends_before', options.endingBefore);
    }
    if (options?.paginationCursor) {
        params.set('pagination_cursor', options.paginationCursor);
    }
    if (options?.paginationLimit) {
        params.set('pagination_limit', String(options.paginationLimit));
    }

    const queryString = params.toString();
    const endpoint = `/v1/calendar/list-events${queryString ? `?${queryString}` : ''}`;

    return lumaFetch<LumaListEventsResponse>(endpoint);
}

/**
 * Fetch all upcoming events from the calendar.
 * Handles pagination automatically.
 *
 * @returns Array of all upcoming events
 */
export async function fetchAllUpcomingEvents(): Promise<LumaEvent[]> {
    const now = new Date().toISOString();
    const allEvents: LumaEvent[] = [];
    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore) {
        const response = await listCalendarEvents({
            startingAfter: now,
            paginationCursor: cursor,
            paginationLimit: 100
        });

        allEvents.push(...response.entries);
        hasMore = response.has_more;
        cursor = response.next_cursor;
    }

    return allEvents;
}
