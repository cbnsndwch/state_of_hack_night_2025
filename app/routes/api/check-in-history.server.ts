/**
 * API endpoint to fetch a member's check-in history with event details
 * GET /api/check-in-history?memberId={id}
 */

import { data, type LoaderFunctionArgs } from 'react-router';
import { getAttendanceByMemberId } from '@/lib/db/attendance.server';
import { getEventByLumaId } from '@/lib/db/events.server';

export async function loader({ request }: LoaderFunctionArgs) {
    const url = new URL(request.url);
    const memberId = url.searchParams.get('memberId');

    if (!memberId) {
        return data({ error: 'memberId is required' }, { status: 400 });
    }

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
