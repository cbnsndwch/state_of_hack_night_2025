/**
 * PostgreSQL data access layer for Attendance
 * Type-safe queries using Drizzle ORM.
 */

import { db } from './provider.server';
import { attendance } from '@drizzle/schema';
import { eq, and, desc, count } from 'drizzle-orm';
import type {
    Attendance,
    AttendanceInsert,
    AttendanceUpdate
} from '@/types/adapters';

/**
 * Get all attendance records for a member
 */
export async function getAttendanceByMemberId(
    memberId: string
): Promise<Attendance[]> {
    return db
        .select()
        .from(attendance)
        .where(eq(attendance.memberId, memberId))
        .orderBy(desc(attendance.createdAt));
}

/**
 * Get all attendance records for an event
 */
export async function getAttendanceByEventId(
    lumaEventId: string
): Promise<Attendance[]> {
    return db
        .select()
        .from(attendance)
        .where(eq(attendance.lumaEventId, lumaEventId))
        .orderBy(desc(attendance.createdAt));
}

/**
 * Get a specific attendance record
 */
export async function getAttendance(
    memberId: string,
    lumaEventId: string
): Promise<Attendance | null> {
    const result = await db
        .select()
        .from(attendance)
        .where(
            and(
                eq(attendance.memberId, memberId),
                eq(attendance.lumaEventId, lumaEventId)
            )
        );

    return result[0] || null;
}

/**
 * Get attendance by ID
 */
export async function getAttendanceById(
    id: string
): Promise<Attendance | null> {
    const result = await db
        .select()
        .from(attendance)
        .where(eq(attendance.id, id));

    return result[0] || null;
}

/**
 * Create an attendance record (register for event)
 */
export async function createAttendance(
    data: AttendanceInsert
): Promise<Attendance> {
    const existing = await getAttendance(data.memberId, data.lumaEventId);
    if (existing) {
        return existing;
    }

    const [record] = await db
        .insert(attendance)
        .values({
            memberId: data.memberId,
            lumaEventId: data.lumaEventId,
            status: data.status || 'registered',
            checkedInAt: data.checkedInAt || null,
            createdAt: new Date()
        })
        .returning();

    return record;
}

/**
 * Update an attendance record
 */
export async function updateAttendance(
    memberId: string,
    lumaEventId: string,
    data: AttendanceUpdate
): Promise<Attendance | null> {
    const [updated] = await db
        .update(attendance)
        .set(data)
        .where(
            and(
                eq(attendance.memberId, memberId),
                eq(attendance.lumaEventId, lumaEventId)
            )
        )
        .returning();

    return updated || null;
}

/**
 * Register a member for an event (upsert)
 */
export async function registerForEvent(
    memberId: string,
    lumaEventId: string
): Promise<Attendance> {
    return createAttendance({
        memberId,
        lumaEventId,
        status: 'registered'
    });
}

/**
 * Check-in a member to an event
 */
export async function checkInToEvent(
    memberId: string,
    lumaEventId: string
): Promise<Attendance | null> {
    return updateAttendance(memberId, lumaEventId, {
        status: 'checked-in',
        checkedInAt: new Date()
    });
}

/**
 * Get attendance count for an event
 */
export async function getEventAttendanceCount(
    lumaEventId: string
): Promise<{ registered: number; checkedIn: number }> {
    const result = await db
        .select({
            status: attendance.status,
            count: count()
        })
        .from(attendance)
        .where(eq(attendance.lumaEventId, lumaEventId))
        .groupBy(attendance.status);

    const counts = {
        registered: 0,
        checkedIn: 0
    };

    for (const r of result) {
        if (r.status === 'registered') {
            counts.registered = r.count;
        } else if (r.status === 'checked-in') {
            counts.checkedIn = r.count;
        }
    }

    return counts;
}

/**
 * Get total checked-in count for a member
 */
export async function getCheckedInCountByMember(
    memberId: string
): Promise<number> {
    const result = await db
        .select({ count: count() })
        .from(attendance)
        .where(
            and(
                eq(attendance.memberId, memberId),
                eq(attendance.status, 'checked-in')
            )
        );

    return result[0]?.count || 0;
}

/**
 * Delete an attendance record
 */
export async function deleteAttendance(id: string): Promise<boolean> {
    const result = await db.delete(attendance).where(eq(attendance.id, id));

    return (result.rowCount ?? 0) > 0;
}

/**
 * Delete all attendance for an event
 */
export async function deleteEventAttendance(
    lumaEventId: string
): Promise<number> {
    const result = await db
        .delete(attendance)
        .where(eq(attendance.lumaEventId, lumaEventId));

    return result.rowCount ?? 0;
}
