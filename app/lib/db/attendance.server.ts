/**
 * PostgreSQL adapter for Attendance
 * Wraps attendance.postgres.server.ts to maintain backward compatibility with existing routes
 * Converts between Postgres UUIDs and MongoDB-compatible ObjectId interface
 */

import * as attendanceDb from './attendance.postgres.server';
import { db } from './provider.server';
import { attendance as attendanceTable } from '@drizzle/schema';
import { eq, and, count } from 'drizzle-orm';
import type {
    Attendance,
    AttendanceInsert,
    AttendanceUpdate,
    AttendanceStatus
} from '@/types/adapters';

/**
 * Convert Postgres attendance to MongoDB-compatible format
 */
function toMongoAttendance(pgAttendance: {
    id: string;
    memberId: string;
    lumaEventId: string;
    status: AttendanceStatus;
    checkedInAt: Date | null;
    createdAt: Date;
}): Attendance {
    return {
        _id: pgAttendance.id as unknown as Attendance['_id'],
        memberId: pgAttendance.memberId,
        lumaEventId: pgAttendance.lumaEventId,
        status: pgAttendance.status as AttendanceStatus,
        checkedInAt: pgAttendance.checkedInAt,
        createdAt: pgAttendance.createdAt
    };
}

/**
 * Get all attendance records for a member - adapter maintains MongoDB interface
 */
export async function getAttendanceByMemberId(
    memberId: string
): Promise<Attendance[]> {
    const records = await attendanceDb.getAttendanceByMemberId(memberId);
    return records.map(toMongoAttendance);
}

/**
 * Get all attendance records for an event - adapter maintains MongoDB interface
 */
export async function getAttendanceByEventId(
    lumaEventId: string
): Promise<Attendance[]> {
    const records = await attendanceDb.getAttendanceByEventId(lumaEventId);
    return records.map(toMongoAttendance);
}

/**
 * Get a specific attendance record - adapter maintains MongoDB interface
 */
export async function getAttendance(
    memberId: string,
    lumaEventId: string
): Promise<Attendance | null> {
    const record = await attendanceDb.getAttendance(memberId, lumaEventId);
    return record ? toMongoAttendance(record) : null;
}

/**
 * Create an attendance record (register for event) - adapter maintains MongoDB interface
 */
export async function createAttendance(
    data: AttendanceInsert
): Promise<Attendance> {
    const created = await attendanceDb.registerAttendance({
        memberId: data.memberId as string,
        lumaEventId: data.lumaEventId,
        status: data.status || 'registered'
    });
    return toMongoAttendance(created);
}

/**
 * Update an attendance record - adapter maintains MongoDB interface
 */
export async function updateAttendance(
    memberId: string,
    lumaEventId: string,
    data: AttendanceUpdate
): Promise<Attendance | null> {
    const updated = await attendanceDb.updateAttendance(
        memberId,
        lumaEventId,
        data
    );
    return updated ? toMongoAttendance(updated) : null;
}

/**
 * Check-in a member to an event - adapter delegates to Postgres
 */
export async function checkInToEvent(
    memberId: string,
    lumaEventId: string
): Promise<Attendance | null> {
    const updated = await attendanceDb.checkInMember(memberId, lumaEventId);
    return updated ? toMongoAttendance(updated) : null;
}

/**
 * Register a member for an event (upsert) - adapter maintains MongoDB interface
 */
export async function registerForEvent(
    memberId: string,
    lumaEventId: string
): Promise<Attendance> {
    const created = await attendanceDb.registerAttendance({
        memberId,
        lumaEventId,
        status: 'registered'
    });
    return toMongoAttendance(created);
}

/**
 * Get attendance count for an event - adapter delegates to Postgres
 */
export async function getEventAttendanceCount(
    lumaEventId: string
): Promise<{ registered: number; checkedIn: number }> {
    const result = await db
        .select({
            status: attendanceTable.status,
            count: count()
        })
        .from(attendanceTable)
        .where(eq(attendanceTable.lumaEventId, lumaEventId))
        .groupBy(attendanceTable.status);

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
 * Get total checked-in count for a member - adapter delegates to Postgres
 */
export async function getCheckedInCountByMember(
    memberId: string
): Promise<number> {
    const result = await db
        .select({ count: count() })
        .from(attendanceTable)
        .where(
            and(
                eq(attendanceTable.memberId, memberId),
                eq(attendanceTable.status, 'checked-in')
            )
        );

    return result[0]?.count || 0;
}
