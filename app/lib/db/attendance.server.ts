import { ObjectId } from 'mongodb';
import { getMongoDb, CollectionName } from '@/utils/mongodb.server';
import type {
    Attendance,
    AttendanceInsert,
    AttendanceUpdate,
    AttendanceStatus
} from '@/types/mongodb';

/**
 * Get all attendance records for a member
 */
export async function getAttendanceByMemberId(
    memberId: string
): Promise<Attendance[]> {
    const db = await getMongoDb();
    return db
        .collection<Attendance>(CollectionName.ATTENDANCE)
        .find({ memberId: new ObjectId(memberId) })
        .sort({ createdAt: -1 })
        .toArray();
}

/**
 * Get all attendance records for an event
 */
export async function getAttendanceByEventId(
    lumaEventId: string
): Promise<Attendance[]> {
    const db = await getMongoDb();
    return db
        .collection<Attendance>(CollectionName.ATTENDANCE)
        .find({ lumaEventId })
        .toArray();
}

/**
 * Get a specific attendance record
 */
export async function getAttendance(
    memberId: string,
    lumaEventId: string
): Promise<Attendance | null> {
    const db = await getMongoDb();
    return db.collection<Attendance>(CollectionName.ATTENDANCE).findOne({
        memberId: new ObjectId(memberId),
        lumaEventId
    });
}

/**
 * Create an attendance record (register for event)
 */
export async function createAttendance(
    data: AttendanceInsert
): Promise<Attendance> {
    const db = await getMongoDb();
    const now = new Date();

    const doc = {
        ...data,
        createdAt: now
    };

    const result = await db
        .collection<Attendance>(CollectionName.ATTENDANCE)
        .insertOne(doc as Attendance);

    return {
        _id: result.insertedId,
        ...doc
    } as Attendance;
}

/**
 * Update an attendance record
 */
export async function updateAttendance(
    memberId: string,
    lumaEventId: string,
    data: AttendanceUpdate
): Promise<Attendance | null> {
    const db = await getMongoDb();

    const result = await db
        .collection<Attendance>(CollectionName.ATTENDANCE)
        .findOneAndUpdate(
            {
                memberId: new ObjectId(memberId),
                lumaEventId
            },
            { $set: data },
            { returnDocument: 'after' }
        );

    return result;
}

/**
 * Check-in a member to an event
 */
export async function checkInToEvent(
    memberId: string,
    lumaEventId: string
): Promise<Attendance | null> {
    return updateAttendance(memberId, lumaEventId, {
        status: 'checked-in' as AttendanceStatus,
        checkedInAt: new Date()
    });
}

/**
 * Register a member for an event (upsert)
 */
export async function registerForEvent(
    memberId: string,
    lumaEventId: string
): Promise<Attendance> {
    const existing = await getAttendance(memberId, lumaEventId);
    if (existing) {
        return existing;
    }

    return createAttendance({
        memberId: new ObjectId(memberId),
        lumaEventId,
        status: 'registered'
    });
}

/**
 * Get attendance count for an event
 */
export async function getEventAttendanceCount(
    lumaEventId: string
): Promise<{ registered: number; checkedIn: number }> {
    const db = await getMongoDb();

    const result = await db
        .collection<Attendance>(CollectionName.ATTENDANCE)
        .aggregate<{ _id: AttendanceStatus; count: number }>([
            { $match: { lumaEventId } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ])
        .toArray();

    const counts = {
        registered: 0,
        checkedIn: 0
    };

    for (const r of result) {
        if (r._id === 'registered') {
            counts.registered = r.count;
        } else if (r._id === 'checked-in') {
            counts.checkedIn = r.count;
        }
    }

    return counts;
}
