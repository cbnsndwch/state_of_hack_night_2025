import { MongoClient, type Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'hello_miami';

if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
}

// Store the URI in a const after the check to satisfy TypeScript
const uri: string = MONGODB_URI;

let client: MongoClient;
let db: Db;

/**
 * Get the MongoDB client and database.
 * Uses a singleton pattern to reuse connections across requests.
 */
export async function getMongoDb(): Promise<Db> {
    if (db) {
        return db;
    }

    if (!client) {
        client = new MongoClient(uri);
        await client.connect();
    }

    db = client.db(MONGODB_DB_NAME);
    return db;
}

/**
 * Close the MongoDB connection.
 * Call this during graceful shutdown.
 */
export async function closeMongoDb(): Promise<void> {
    if (client) {
        await client.close();
    }
}

// Collection names
export const CollectionName = {
    PROFILES: 'profiles',
    PROJECTS: 'projects',
    BADGES: 'badges',
    MEMBER_BADGES: 'member_badges',
    ATTENDANCE: 'attendance',
    PENDING_USERS: 'pending_users',
    LUMA_WEBHOOKS: 'luma_webhooks',
    SURVEYS: 'surveys',
    SURVEY_RESPONSES: 'survey_responses',
    EVENTS: 'events',
    DEMO_SLOTS: 'demo_slots'
} as const;
