/**
 * PostgreSQL data access layer for Badges
 * This replaces the MongoDB-based badges.server.ts for the new Postgres/Zero architecture.
 * Type-safe queries using Drizzle ORM.
 */

import { db } from './provider.server';
import { badges } from '@drizzle/schema';
import { eq } from 'drizzle-orm';

export interface BadgeInput {
    name: string;
    iconAscii: string;
    criteria: string;
}

/**
 * Get all badges
 */
export async function getBadges() {
    return db.select().from(badges);
}

/**
 * Get a badge by ID
 */
export async function getBadgeById(id: string) {
    const result = await db.select().from(badges).where(eq(badges.id, id));

    return result[0] || null;
}

/**
 * Get a badge by name
 */
export async function getBadgeByName(name: string) {
    const result = await db.select().from(badges).where(eq(badges.name, name));

    return result[0] || null;
}

/**
 * Create a new badge
 */
export async function createBadge(data: BadgeInput) {
    const [badge] = await db
        .insert(badges)
        .values({
            name: data.name,
            iconAscii: data.iconAscii,
            criteria: data.criteria,
            createdAt: new Date()
        })
        .returning();

    return badge;
}

/**
 * Delete a badge by ID
 */
export async function deleteBadge(id: string): Promise<boolean> {
    const result = await db.delete(badges).where(eq(badges.id, id));

    return (result.rowCount ?? 0) > 0;
}

/**
 * Count total badges
 */
export async function countBadges() {
    const result = await db.select({ count: badges.id }).from(badges);

    return result[0] ? 1 : 0;
}
