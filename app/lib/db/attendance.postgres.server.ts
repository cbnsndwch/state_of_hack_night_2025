/**
 * PostgreSQL data access layer for Attendance
 * This replaces the MongoDB-based attendance.server.ts for the new Postgres/Zero architecture.
 * Type-safe queries using Drizzle ORM.
 */

import { db } from './provider.server';
import { attendance } from '@drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';

export type AttendanceStatus = 'registered' | 'checked-in';

export interface AttendanceInput {
    memberId: string;
    lumaEventId: string;
    status?: AttendanceStatus;
    checkedInAt?: Date | null;
}

export interface AttendanceUpdate {
    status?: AttendanceStatus;
    checkedInAt?: Date | null;
}

/**
 * Get all attendance records for a member
 */
export async function getAttendanceByMemberId(memberId: string) {
    return db
        .select()
        .from(attendance)
        .where(eq(attendance.memberId, memberId))
        .orderBy(desc(attendance.createdAt));
}

/**
 * Get all attendance records for an event
 */
export async function getAttendanceByEventId(lumaEventId: string) {
    return db
        .select()
        .from(attendance)
        .where(eq(attendance.lumaEventId, lumaEventId))
        .orderBy(desc(attendance.createdAt));
}

/**
 * Get a specific attendance record
 */
export async function getAttendance(memberId: string, lumaEventId: string) {
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
export async function getAttendanceById(id: string) {
    const result = await db
        .select()
        .from(attendance)
        .where(eq(attendance.id, id));

    return result[0] || null;
}

/**
 * Register attendance for an event
 */
export async function registerAttendance(data: AttendanceInput) {
    // Check if already exists
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
 * Update attendance status (e.g., mark as checked-in)
 */
export async function updateAttendance(
    memberId: string,
    lumaEventId: string,
    data: AttendanceUpdate
) {
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
 * Mark member as checked-in for an event
 */
export async function checkInMember(memberId: string, lumaEventId: string) {
    return updateAttendance(memberId, lumaEventId, {
        status: 'checked-in',
        checkedInAt: new Date()
    });
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
