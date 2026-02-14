/* eslint-disable @typescript-eslint/no-explicit-any */
import { desc, eq } from 'drizzle-orm';
import { lumaWebhooks } from '@drizzle/schema';
import { db } from '@/lib/db/provider.server';
import type { LumaWebhook, LumaWebhookInsert } from '@/types/adapters';

/**
 * Store a raw webhook for audit/debugging
 */
export async function storeWebhook(
    data: LumaWebhookInsert
): Promise<LumaWebhook> {
    const [webhook] = await db
        .insert(lumaWebhooks)
        .values({
            type: data.type,
            payload: data.payload,
            receivedAt: new Date()
        })
        .returning();

    return {
        ...webhook,
        _id: webhook.id
    } as any;
}

/**
 * Get all webhooks (for debugging/admin)
 */
export async function getWebhooks(limit = 100): Promise<LumaWebhook[]> {
    const hooks = await db
        .select()
        .from(lumaWebhooks)
        .orderBy(desc(lumaWebhooks.receivedAt))
        .limit(limit);

    return hooks.map(h => ({ ...h, _id: h.id }) as any);
}

/**
 * Get webhooks by type
 */
export async function getWebhooksByType(
    type: string,
    limit = 100
): Promise<LumaWebhook[]> {
    const hooks = await db
        .select()
        .from(lumaWebhooks)
        .where(eq(lumaWebhooks.type, type))
        .orderBy(desc(lumaWebhooks.receivedAt))
        .limit(limit);

    return hooks.map(h => ({ ...h, _id: h.id }) as any);
}
