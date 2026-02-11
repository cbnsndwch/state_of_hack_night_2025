/**
 * Database Provider for Zero Sync
 *
 * This module sets up the Drizzle ORM connection to PostgreSQL
 * and provides a centralized database client for the application.
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { zeroDrizzle } from '@rocicorp/zero/server/adapters/drizzle';
import * as schema from '../../../drizzle/schema';
import { schema as zeroSchema } from '@/zero/schema';

// Create PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
});

// Create Drizzle ORM instance with schema
export const db = drizzle(pool, { schema });

/**
 * Zero Drizzle provider for mutations
 * This is used by the /api/zero/mutate endpoint
 */
export const dbProvider = zeroDrizzle(zeroSchema, db);

/**
 * Type-safe database client with full schema awareness
 */
export type Database = typeof db;

/**
 * Close the database connection pool
 * (mainly for testing or graceful shutdown)
 */
export async function closeDb() {
    await pool.end();
}

/**
 * Test database connection
 */
export async function testDbConnection() {
    try {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        return true;
    } catch (error) {
        console.error('Database connection error:', error);
        return false;
    }
}
