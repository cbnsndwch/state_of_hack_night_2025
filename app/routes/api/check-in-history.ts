/**
 * API endpoint to fetch a member's check-in history with event details
 * GET /api/check-in-history
 *
 * Requires authentication. Returns check-in history for the authenticated user.
 */

import { data, type LoaderFunctionArgs } from 'react-router';
import { getAuth } from '@clerk/react-router/server';
import { getAttendanceByMemberId } from '@/lib/db/attendance.server';
import { getEventByLumaId } from '@/lib/db/events.server';
import { getProfileByClerkUserId } from '@/lib/db/profiles.server';

export async function loader(args: LoaderFunctionArgs) {
    // Verify user is authenticated with Clerk
    const auth = await getAuth(args);
    if (!auth.userId) {
        return data({ error: 'Authentication required' }, { status: 401 });
    }

    // Get the authenticated user's profile
    const userProfile = await getProfileByClerkUserId(auth.userId);
    if (!userProfile) {
        return data({ error: 'Profile not found' }, { status: 404 });
    }

    const memberId = userProfile._id.toString();

    try {
        // Get all attendance records for this member
        const attendanceRecords = await getAttendanceByMemberId(memberId);

        // Only include checked-in records
        const checkedInRecords = attendanceRecords.filter(
            record => record.status === 'checked-in' && record.checkedInAt
        );

        // Fetch event details for each check-in
        const historyWithEvents = await Promise.all(
            checkedInRecords.map(async record => {
                const event = await getEventByLumaId(record.lumaEventId);
                return {
                    id: record._id.toString(),
                    checkedInAt: record.checkedInAt,
                    event: event
                        ? {
                              id: event._id.toString(),
                              lumaEventId: event.lumaEventId,
                              name: event.name,
                              startAt: event.startAt,
                              location: event.location,
                              coverUrl: event.coverUrl
                          }
                        : null
                };
            })
        );

        // Filter out records where event wasn't found (shouldn't happen but good to be safe)
        const validHistory = historyWithEvents.filter(h => h.event !== null);

        return data({
            success: true,
            history: validHistory,
            totalCheckIns: validHistory.length
        });
    } catch (error) {
        console.error('Error fetching check-in history:', error);
        return data(
            {
                error: 'Failed to fetch check-in history',
                details:
                    error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
