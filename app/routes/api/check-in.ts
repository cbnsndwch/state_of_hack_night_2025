/**
 * API route for member check-ins at hack nights.
 * POST /api/check-in - Check in a member to an event
 *
 * This route handles self check-ins by:
 * 1. Recording check-in via Zero sync (for real-time updates)
 * 2. Updating streaks and awarding badges (server-side)
 * 3. Optionally updating guest status in Luma via API proxy (server-side with secret key)
 */

import { data, type ActionFunctionArgs } from 'react-router';
import { getAuth } from '@clerk/react-router/server';
import { getAttendance } from '@/lib/db/attendance.server';
import { getEventByLumaId } from '@/lib/db/events.server';
import { updateMemberStreak } from '@/lib/db/streaks.server';
import { awardCheckInBadges } from '@/lib/db/badge-assignment.server';
import { getProfileByClerkUserId } from '@/lib/db/profiles.server';

/**
 * Update guest check-in status in Luma.
 * This proxies the request to Luma's API to mark the guest as checked in.
 */
async function updateLumaGuestCheckIn(
    lumaEventId: string,
    lumaAttendeeId: string
): Promise<{ success: boolean; error?: string }> {
    const LUMA_API_KEY = process.env.LUMA_API_KEY;
    if (!LUMA_API_KEY) {
        console.warn('LUMA_API_KEY not configured, skipping Luma API update');
        return { success: true }; // Continue without Luma update
    }

    try {
        const response = await fetch(
            'https://public-api.luma.com/v1/event/update-guest-status',
            {
                method: 'POST',
                headers: {
                    'x-luma-api-key': LUMA_API_KEY,
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                },
                body: JSON.stringify({
                    event_api_id: lumaEventId,
                    guest_api_id: lumaAttendeeId,
                    check_in_status: 'checked_in'
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error(
                'Luma API check-in failed:',
                response.status,
                errorText
            );

            // Return error but don't fail the check-in
            // (we already recorded it in our DB)
            return {
                success: false,
                error: `Luma API returned ${response.status}`
            };
        }

        return { success: true };
    } catch (error) {
        console.error('Error updating Luma guest check-in:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * GET handler - Not supported (check-ins are POST only)
 */
export async function loader() {
    return data({ error: 'Method not allowed' }, { status: 405 });
}

/**
 * POST handler - Check in a member to an event
 */
export async function action(args: ActionFunctionArgs) {
    if (args.request.method !== 'POST') {
        return data({ error: 'Method not allowed' }, { status: 405 });
    }

    try {
        // Verify user is authenticated with Clerk
        const auth = await getAuth(args);
        if (!auth.userId) {
            return data({ error: 'Authentication required' }, { status: 401 });
        }

        // Get the authenticated user's profile
        const userProfile = await getProfileByClerkUserId(auth.userId);
        if (!userProfile) {
            return data(
                {
                    error: 'Profile not found. Please complete onboarding first.'
                },
                { status: 404 }
            );
        }

        const formData = await args.request.formData();
        const lumaEventId = formData.get('lumaEventId')?.toString();
        const lumaAttendeeId = formData.get('lumaAttendeeId')?.toString();

        // Use the authenticated user's memberId (profile ID)
        const memberId = userProfile.id.toString();

        // Validate required fields
        if (!lumaEventId) {
            return data(
                { error: 'Missing required field: lumaEventId' },
                { status: 400 }
            );
        }

        // Check if event exists in our database
        const event = await getEventByLumaId(lumaEventId);
        if (!event) {
            return data(
                { error: 'Event not found. Please sync events first.' },
                { status: 404 }
            );
        }

        // Check if member is already checked in
        const existingAttendance = await getAttendance(memberId, lumaEventId);

        if (existingAttendance) {
            return data(
                {
                    error: 'Already checked in',
                    message: 'You are already checked in to this event'
                },
                { status: 409 }
            );
        }

        // Create attendance record via Zero mutator for real-time sync
        // Note: We call the Zero mutator endpoint internally to ensure the attendance
        // record syncs to all connected clients in real-time
        const mutateResponse = await fetch(
            new URL('/api/zero/mutate', args.request.url),
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Forward the original authorization header
                    Cookie: args.request.headers.get('Cookie') || ''
                },
                body: JSON.stringify({
                    mutations: [
                        {
                            id: Math.random(),
                            clientID: 'server-check-in',
                            name: 'attendance.checkIn',
                            args: {
                                memberId,
                                lumaEventId
                            }
                        }
                    ]
                })
            }
        );

        if (!mutateResponse.ok) {
            const errorData = await mutateResponse.json();
            return data(
                {
                    error: 'Failed to record check-in',
                    message: errorData.error || 'Unknown error'
                },
                { status: 500 }
            );
        }

        const mutateResult = await mutateResponse.json();

        // Check if the mutation returned an error
        if (mutateResult[0]?.result?.error) {
            return data(
                {
                    error: 'Failed to record check-in',
                    message:
                        mutateResult[0].result.message ||
                        'Check-in mutation failed'
                },
                { status: 500 }
            );
        }

        // Fetch the created attendance record
        const attendance = await getAttendance(memberId, lumaEventId);

        if (!attendance) {
            return data(
                { error: 'Failed to retrieve check-in record' },
                { status: 500 }
            );
        }

        // Optionally update Luma guest status
        // (only if lumaAttendeeId is provided)
        let lumaUpdateResult = null;
        if (lumaAttendeeId) {
            lumaUpdateResult = await updateLumaGuestCheckIn(
                lumaEventId,
                lumaAttendeeId
            );

            // Log if Luma update failed (but don't fail the check-in)
            if (!lumaUpdateResult.success) {
                console.warn(
                    `Check-in recorded locally but Luma API update failed: ${lumaUpdateResult.error}`
                );
            }
        }

        // Update member's attendance streak
        let streakCount = 0;
        try {
            streakCount = await updateMemberStreak(memberId);
        } catch (error) {
            console.error('Error updating streak count:', error);
            // Don't fail the check-in if streak update fails
        }

        // Check and award badges based on check-in milestones and streaks
        let awardedBadges: Array<{
            id: string;
            name: string;
            iconAscii: string;
            criteria: string;
        }> = [];
        try {
            const badges = await awardCheckInBadges(memberId, streakCount);
            awardedBadges = badges.map(badge => ({
                id: badge.id.toString(),
                name: badge.name,
                iconAscii: badge.iconAscii,
                criteria: badge.criteria
            }));
        } catch (error) {
            console.error('Error awarding badges:', error);
            // Don't fail the check-in if badge award fails
        }

        return data({
            success: true,
            message: 'Checked in successfully',
            attendance: {
                id: attendance.id.toString(),
                memberId: attendance.memberId.toString(),
                lumaEventId: attendance.lumaEventId,
                status: attendance.status,
                checkedInAt: attendance.checkedInAt?.toISOString() ?? null,
                createdAt: attendance.createdAt.toISOString()
            },
            streakCount,
            awardedBadges,
            lumaUpdated: lumaUpdateResult?.success ?? false
        });
    } catch (error) {
        console.error('Error processing check-in:', error);
        return data(
            {
                error: 'Failed to process check-in',
                message:
                    error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
