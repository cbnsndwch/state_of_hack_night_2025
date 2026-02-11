/**
 * PostgreSQL data access layer for Demo Slots
 * This replaces the MongoDB-based demo-slots.server.ts for the new Postgres/Zero architecture.
 * Type-safe queries using Drizzle ORM.
 */

import { db } from './provider.server';
import { demoSlots } from '@drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';

export type DemoSlotStatus = 'pending' | 'confirmed' | 'canceled';

export interface DemoSlotInput {
    memberId: string;
    eventId: string;
    title: string;
    description?: string | null;
    requestedTime?: string | null;
    durationMinutes?: number;
    status?: DemoSlotStatus;
}

export interface DemoSlotUpdate {
    title?: string;
    description?: string | null;
    requestedTime?: string | null;
    durationMinutes?: number;
    status?: DemoSlotStatus;
    confirmedByOrganizer?: boolean;
}

/**
 * Get all demo slots for an event
 */
export async function getDemoSlotsByEventId(eventId: string) {
    return db
        .select()
        .from(demoSlots)
        .where(eq(demoSlots.eventId, eventId))
        .orderBy(desc(demoSlots.createdAt));
}

/**
 * Get all demo slots by a member
 */
export async function getDemoSlotsByMemberId(memberId: string) {
    return db
        .select()
        .from(demoSlots)
        .where(eq(demoSlots.memberId, memberId))
        .orderBy(desc(demoSlots.createdAt));
}

/**
 * Get a demo slot by ID
 */
export async function getDemoSlotById(id: string) {
    const result = await db
        .select()
        .from(demoSlots)
        .where(eq(demoSlots.id, id));

    return result[0] || null;
}

/**
 * Get demo slots by event and status
 */
export async function getDemoSlotsByEventAndStatus(
    eventId: string,
    status: DemoSlotStatus
) {
    return db
        .select()
        .from(demoSlots)
        .where(
            and(eq(demoSlots.eventId, eventId), eq(demoSlots.status, status))
        )
        .orderBy(desc(demoSlots.createdAt));
}

/**
 * Create a new demo slot
 */
export async function createDemoSlot(data: DemoSlotInput) {
    const [slot] = await db
        .insert(demoSlots)
        .values({
            memberId: data.memberId,
            eventId: data.eventId,
            title: data.title,
            description: data.description || null,
            requestedTime: data.requestedTime || null,
            durationMinutes: data.durationMinutes || 5,
            status: data.status || 'pending',
            confirmedByOrganizer: false,
            createdAt: new Date(),
            updatedAt: new Date()
        })
        .returning();

    return slot;
}

/**
 * Update a demo slot
 */
export async function updateDemoSlot(id: string, data: DemoSlotUpdate) {
    const [updated] = await db
        .update(demoSlots)
        .set({
            ...data,
            updatedAt: new Date()
        })
        .where(eq(demoSlots.id, id))
        .returning();

    return updated || null;
}

/**
 * Confirm a demo slot (by organizer)
 */
export async function confirmDemoSlot(id: string) {
    return updateDemoSlot(id, {
        status: 'confirmed',
        confirmedByOrganizer: true
    });
}

/**
 * Cancel a demo slot
 */
export async function cancelDemoSlot(id: string) {
    return updateDemoSlot(id, {
        status: 'canceled'
    });
}

/**
 * Delete a demo slot
 */
export async function deleteDemoSlot(id: string): Promise<boolean> {
    const result = await db.delete(demoSlots).where(eq(demoSlots.id, id));

    return (result.rowCount ?? 0) > 0;
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
