/**
 * Server-side test setup.
 *
 * Runs once before all server integration tests. Verifies the database
 * connection is live (tests hit real Postgres — no mocks).
 */
import { afterAll, beforeAll } from 'vitest';
import { Pool } from 'pg';

let pool: Pool;

beforeAll(async () => {
    const connectionString =
        process.env.DATABASE_URL ||
        'postgresql://postgres:password@localhost:5433/hello_miami';

    pool = new Pool({
        connectionString,
        max: 5,
        connectionTimeoutMillis: 5_000,
    });

    // Fail fast if the DB is not reachable
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
});

afterAll(async () => {
    if (pool) {
        await pool.end();
    }
});
