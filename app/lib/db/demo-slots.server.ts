/**
 * Database operations for demo slots (demo presentations at hack nights).
 * PostgreSQL/Drizzle implementation.
 */

import { db } from './provider.server';
import { demoSlots } from '../../../drizzle/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import type {
    DemoSlot,
    DemoSlotInsert,
    DemoSlotUpdate,
    DemoSlotWithMember,
    DemoSlotWithEvent
} from '@/types/adapters';

/**
 * Get all demo slots from the database.
 */
export async function getDemoSlots(options?: {
    eventId?: string;
    memberId?: string;
    status?: 'pending' | 'confirmed' | 'canceled';
    sortOrder?: 1 | -1;
    limit?: number;
}): Promise<DemoSlot[]> {
    const conditions = [];
    if (options?.eventId)
        conditions.push(eq(demoSlots.eventId, options.eventId));
    if (options?.memberId)
        conditions.push(eq(demoSlots.memberId, options.memberId));
    if (options?.status) conditions.push(eq(demoSlots.status, options.status));

    let finalQuery = db.select().from(demoSlots);
    if (conditions.length > 0) {
        finalQuery = finalQuery.where(and(...conditions)) as typeof finalQuery;
    }

    if (options?.sortOrder === 1) {
        finalQuery = finalQuery.orderBy(asc(demoSlots.createdAt));
    } else {
        finalQuery = finalQuery.orderBy(desc(demoSlots.createdAt));
    }

    if (options?.limit) {
        finalQuery = finalQuery.limit(options.limit);
    }

    return finalQuery;
}

/**
 * Get demo slots with member information populated.
 */
export async function getDemoSlotsWithMembers(options?: {
    eventId?: string;
    status?: 'pending' | 'confirmed' | 'canceled';
}): Promise<DemoSlotWithMember[]> {
    const conditions = [];
    if (options?.eventId)
        conditions.push(eq(demoSlots.eventId, options.eventId));
    if (options?.status) conditions.push(eq(demoSlots.status, options.status));

    const results = await db.query.demoSlots.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        with: {
            member: true
        },
        orderBy: [desc(demoSlots.createdAt)]
    });

    return results.map(slot => {
        const { memberId, ...rest } = slot;
        return {
            ...rest,
            member: {
                id: slot.member.id,
                lumaEmail: slot.member.lumaEmail,
                githubUsername: slot.member.githubUsername
            }
        };
    });
}

/**
 * Get demo slots with both member and event information (for organizer view).
 */
export async function getDemoSlotsWithMembersAndEvents(options?: {
    eventId?: string;
    status?: 'pending' | 'confirmed' | 'canceled';
}): Promise<
    Array<
        DemoSlotWithMember & {
            event: { id: string; name: string; startAt: Date };
        }
    >
> {
    const conditions = [];
    if (options?.eventId)
        conditions.push(eq(demoSlots.eventId, options.eventId));
    if (options?.status) conditions.push(eq(demoSlots.status, options.status));

    const results = await db.query.demoSlots.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        with: {
            member: true,
            event: true
        },
        orderBy: [desc(demoSlots.createdAt)]
    });

    const mapped = results.map(slot => {
        const { memberId, ...rest } = slot;
        return {
            ...rest,
            member: {
                id: slot.member.id,
                lumaEmail: slot.member.lumaEmail,
                githubUsername: slot.member.githubUsername
            },
            event: {
                id: slot.event.id,
                name: slot.event.name,
                startAt: slot.event.startAt
            }
        };
    });

    return mapped.sort(
        (a, b) => b.event.startAt.getTime() - a.event.startAt.getTime()
    );
}

/**
 * Get a demo slot by its ID.
 */
export async function getDemoSlotById(id: string): Promise<DemoSlot | null> {
    const slot = await db.query.demoSlots.findFirst({
        where: eq(demoSlots.id, id)
    });
    return slot || null;
}

/**
 * Create a new demo slot.
 */
export async function createDemoSlot(data: DemoSlotInsert): Promise<DemoSlot> {
    const [inserted] = await db
        .insert(demoSlots)
        .values({
            memberId: data.memberId,
            eventId: data.eventId,
            title: data.title,
            description: data.description || null,
            requestedTime: data.requestedTime || null,
            durationMinutes: data.durationMinutes || 5,
            status: data.status || 'pending',
            confirmedByOrganizer: data.confirmedByOrganizer || false,
            createdAt: new Date(),
            updatedAt: new Date()
        })
        .returning();

    return inserted;
}

/**
 * Update a demo slot.
 */
export async function updateDemoSlot(
    id: string,
    data: DemoSlotUpdate
): Promise<boolean> {
    const result = await db
        .update(demoSlots)
        .set({
            ...data,
            updatedAt: new Date()
        })
        .where(eq(demoSlots.id, id));

    return result.rowCount ? result.rowCount > 0 : false;
}

/**
 * Delete a demo slot.
 */
export async function deleteDemoSlot(id: string): Promise<boolean> {
    const result = await db.delete(demoSlots).where(eq(demoSlots.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
}

/**
 * Get demo slots for a member with event information.
 */
export async function getMemberDemoSlotsWithEvents(
    memberId: string
): Promise<DemoSlotWithEvent[]> {
    const results = await db.query.demoSlots.findMany({
        where: eq(demoSlots.memberId, memberId),
        with: {
            event: true
        },
        orderBy: [desc(demoSlots.createdAt)]
    });

    return results.map(slot => {
        const { eventId, ...rest } = slot;
        return {
            ...rest,
            event: {
                id: slot.event.id,
                name: slot.event.name,
                startAt: slot.event.startAt,
                endAt: slot.event.endAt
            }
        };
    });
}

/**
 * Confirm a demo slot (by organizer)
 */
export async function confirmDemoSlot(id: string): Promise<boolean> {
    return updateDemoSlot(id, {
        status: 'confirmed',
        confirmedByOrganizer: true
    });
}

/**
 * Cancel a demo slot
 */
export async function cancelDemoSlot(id: string): Promise<boolean> {
    return updateDemoSlot(id, {
        status: 'canceled'
    });
}

/**
 * Delete all demo slots for an event
 */
export async function deleteEventDemoSlots(eventId: string): Promise<number> {
    const result = await db
        .delete(demoSlots)
        .where(eq(demoSlots.eventId, eventId));

    return result.rowCount ?? 0;
}
