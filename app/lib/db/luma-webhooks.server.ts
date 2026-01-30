import { getMongoDb, CollectionName } from '@/utils/mongodb.server';
import type { LumaWebhook, LumaWebhookInsert } from '@/types/mongodb';

/**
 * Store a raw webhook for audit/debugging
 */
export async function storeWebhook(
    data: LumaWebhookInsert
): Promise<LumaWebhook> {
    const db = await getMongoDb();

    const doc = {
        ...data,
        receivedAt: new Date()
    };

    const result = await db
        .collection<LumaWebhook>(CollectionName.LUMA_WEBHOOKS)
        .insertOne(doc as LumaWebhook);

    return {
        _id: result.insertedId,
        ...doc
    } as LumaWebhook;
}

/**
 * Get all webhooks (for debugging/admin)
 */
export async function getWebhooks(limit = 100): Promise<LumaWebhook[]> {
    const db = await getMongoDb();
    return db
        .collection<LumaWebhook>(CollectionName.LUMA_WEBHOOKS)
        .find()
        .sort({ receivedAt: -1 })
        .limit(limit)
        .toArray();
}

/**
 * Get webhooks by type
 */
export async function getWebhooksByType(
    type: string,
    limit = 100
): Promise<LumaWebhook[]> {
    const db = await getMongoDb();
    return db
        .collection<LumaWebhook>(CollectionName.LUMA_WEBHOOKS)
        .find({ type })
        .sort({ receivedAt: -1 })
        .limit(limit)
        .toArray();
}
