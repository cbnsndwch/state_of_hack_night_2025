/**
 * Streak calculation logic for member attendance.
 *
 * A "streak" is a consecutive series of hack night attendances.
 * Hack nights typically occur weekly on Thursdays.
 */

import { getAttendanceByMemberId } from './attendance.server';
import { getEvents } from './events.server';
import { updateProfile } from './profiles.server';
import type { Attendance } from '@/types/adapters';

/**
 * Calculate the current streak for a member based on their attendance history.
 *
 * Algorithm:
 * 1. Get all checked-in attendance records for the member (sorted by event date)
 * 2. Get all past events (sorted by date)
 * 3. Start from the most recent event and count backwards:
 *    - If the member attended, increment streak
 *    - If the member missed an event, break the streak
 * 4. Return the streak count
 *
 * @param memberId - The member's ID
 * @returns The current streak count (number of consecutive weeks attended)
 */
export async function calculateStreak(memberId: string): Promise<number> {
    // Get all checked-in attendance for this member
    const allAttendance = await getAttendanceByMemberId(memberId);
    const checkedInAttendance = allAttendance.filter(
        a => a.status === 'checked-in' && a.checkedInAt !== null
    );

    // If no check-ins, streak is 0
    if (checkedInAttendance.length === 0) {
        return 0;
    }

    // Get all past events (including today's events) sorted by date descending
    const now = new Date();
    const pastEvents = await getEvents({
        pastOnly: false, // Include ongoing events
        sortOrder: -1 // Most recent first
    });

    // Filter to only events that have started
    const startedEvents = pastEvents.filter(event => event.startAt <= now);

    // If no events have occurred yet, streak is 0
    if (startedEvents.length === 0) {
        return 0;
    }

    // Create a map of lumaEventId -> attendance for quick lookup
    const attendanceMap = new Map<string, Attendance>();
    for (const attendance of checkedInAttendance) {
        attendanceMap.set(attendance.lumaEventId, attendance);
    }

    // Count consecutive attendance from most recent event backwards
    let streakCount = 0;
    for (const event of startedEvents) {
        // Check if member attended this event
        if (attendanceMap.has(event.lumaEventId)) {
            streakCount++;
        } else {
            // Streak is broken - stop counting
            break;
        }
    }

    return streakCount;
}

/**
 * Update a member's streak count in their profile.
 *
 * @param memberId - The member's ID
 * @returns The updated streak count
 */
export async function updateMemberStreak(memberId: string): Promise<number> {
    const streakCount = await calculateStreak(memberId);

    await updateProfile(memberId, {
        streakCount
    });

    return streakCount;
}

/**
 * Get the streak count for a member without updating the database.
 * Useful for displaying streak in UI.
 *
 * @param memberId - The member's ID
 * @returns The current streak count
 */
export async function getStreakCount(memberId: string): Promise<number> {
    return calculateStreak(memberId);
}

/**
 * Recalculate streaks for all members (batch operation).
 * Useful for maintenance or after importing historical data.
 *
 * @returns Number of profiles updated
 */
export async function recalculateAllStreaks(): Promise<number> {
    const { getProfiles } = await import('./profiles.server');
    const profiles = await getProfiles();

    let updatedCount = 0;
    for (const profile of profiles) {
        await updateMemberStreak(profile.id.toString());
        updatedCount++;
    }

    return updatedCount;
}

/**
 * Helper: Get the date range for a "week" based on event schedule.
 * Hack nights typically occur weekly, so we consider events within 7-10 days
 * of each other as consecutive weeks.
 *
 * @param eventDate - The event date
 * @returns Object with start and end dates for that week
 */
export function getWeekRange(eventDate: Date): {
    start: Date;
    end: Date;
} {
    // A "week" is 7 days before and after the event
    const start = new Date(eventDate);
    start.setDate(start.getDate() - 7);

    const end = new Date(eventDate);
    end.setDate(end.getDate() + 7);

    return { start, end };
}
