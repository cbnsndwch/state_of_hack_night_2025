/**
 * Integration tests for the Drizzle schema definition.
 *
 * Verifies that every column in the profiles table exists in Postgres
 * and that the Drizzle schema matches the actual DDL. This is the
 * canary test — if the migration is out of sync, these fail first.
 *
 * 🔑  Requires Postgres running: docker compose up -d postgres
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';

let pool: Pool;

beforeAll(() => {
    pool = new Pool({
        connectionString:
            process.env.DATABASE_URL ||
            'postgresql://postgres:password@localhost:5433/hello_miami',
        max: 3,
    });
});

afterAll(async () => {
    await pool.end();
});

describe('Schema Integrity — profiles table', () => {
    it('profiles table exists', async () => {
        const { rows } = await pool.query(
            `SELECT to_regclass('public.profiles') AS oid`
        );
        expect(rows[0].oid).toBeTruthy();
    });

    const EXPECTED_COLUMNS = [
        // Original columns
        'id',
        'clerk_user_id',
        'luma_email',
        'verification_status',
        'is_app_admin',
        'luma_attendee_id',
        'bio',
        'skills',
        'github_username',
        'twitter_handle',
        'website_url',
        'role',
        'seeking_funding',
        'open_to_mentoring',
        'streak_count',
        'onboarding_dismissed',
        'created_at',
        'updated_at',
        // New columns added for profile section cards
        'linkedin_url',
        'looking_for_cofounder',
        'want_product_feedback',
        'seeking_accelerator_intros',
        'want_to_give_back',
        'specialties',
        'interested_experiences',
    ];

    it.each(EXPECTED_COLUMNS)(
        'column "%s" exists in profiles table',
        async (columnName) => {
            const { rows } = await pool.query(
                `SELECT column_name FROM information_schema.columns
                 WHERE table_schema = 'public'
                   AND table_name = 'profiles'
                   AND column_name = $1`,
                [columnName]
            );
            expect(rows).toHaveLength(1);
        }
    );

    it('boolean columns have correct defaults', async () => {
        const boolColumns = [
            'is_app_admin',
            'seeking_funding',
            'open_to_mentoring',
            'looking_for_cofounder',
            'want_product_feedback',
            'seeking_accelerator_intros',
            'want_to_give_back',
            'onboarding_dismissed',
        ];

        const { rows } = await pool.query(
            `SELECT column_name, column_default
             FROM information_schema.columns
             WHERE table_schema = 'public'
               AND table_name = 'profiles'
               AND column_name = ANY($1)`,
            [boolColumns]
        );

        for (const row of rows) {
            expect(row.column_default).toBe('false');
        }
    });

    it('jsonb array columns have correct defaults', async () => {
        const jsonbColumns = ['skills', 'specialties', 'interested_experiences'];

        const { rows } = await pool.query(
            `SELECT column_name, column_default, data_type
             FROM information_schema.columns
             WHERE table_schema = 'public'
               AND table_name = 'profiles'
               AND column_name = ANY($1)`,
            [jsonbColumns]
        );

        for (const row of rows) {
            expect(row.data_type).toBe('jsonb');
            // Default should be '[]'::jsonb
            expect(row.column_default).toContain("'[]'");
        }
    });
});
