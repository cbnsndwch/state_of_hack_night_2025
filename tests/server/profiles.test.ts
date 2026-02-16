/**
 * Integration tests for the profiles database layer.
 *
 * These tests run against the REAL Postgres instance (docker-compose).
 * No mocks, no fakes — the same code paths used in production.
 *
 * 🔑  Requires Postgres running: docker compose up -d postgres
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

import * as schema from '@drizzle/schema';

// ── Direct DB connection (bypasses the .server.ts boundary so we can ──────
//    import without React Router's server module resolution)
let pool: Pool;
let db: ReturnType<typeof drizzle>;

/** Generate a unique test email so parallel runs don't collide. */
const testEmail = () => `test-${randomUUID().slice(0, 8)}@test.hello.miami`;
const testClerkId = () => `user_test_${randomUUID().slice(0, 12)}`;

beforeAll(() => {
    const connectionString =
        process.env.DATABASE_URL ||
        'postgresql://postgres:password@localhost:5433/hello_miami';

    pool = new Pool({ connectionString, max: 5 });
    db = drizzle(pool, { schema });
});

afterAll(async () => {
    await pool.end();
});

// ── Cleanup tracker ──────────────────────────────────────────────────────────
const createdIds: string[] = [];

afterEach(async () => {
    // Delete test rows created during the test
    for (const id of createdIds) {
        await db
            .delete(schema.profiles)
            .where(eq(schema.profiles.id, id))
            .catch(() => {
                // Ignore — row may already be deleted by the test
            });
    }
    createdIds.length = 0;
});

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE
// ═══════════════════════════════════════════════════════════════════════════════

describe('Profile — Create', () => {
    it('inserts a minimal profile with required fields only', async () => {
        const email = testEmail();
        const clerkId = testClerkId();

        const [profile] = await db
            .insert(schema.profiles)
            .values({ clerkUserId: clerkId, lumaEmail: email })
            .returning();

        createdIds.push(profile.id);

        expect(profile).toBeDefined();
        expect(profile.id).toBeTruthy();
        expect(profile.lumaEmail).toBe(email);
        expect(profile.clerkUserId).toBe(clerkId);
        expect(profile.verificationStatus).toBe('pending');
        expect(profile.isAppAdmin).toBe(false);
        expect(profile.seekingFunding).toBe(false);
        expect(profile.openToMentoring).toBe(false);
    });

    it('inserts a profile with all new community-preference fields', async () => {
        const email = testEmail();
        const clerkId = testClerkId();

        const [profile] = await db
            .insert(schema.profiles)
            .values({
                clerkUserId: clerkId,
                lumaEmail: email,
                linkedinUrl: 'sergio-miami',
                lookingForCofounder: true,
                wantProductFeedback: true,
                seekingAcceleratorIntros: true,
                wantToGiveBack: true,
                specialties: ['software', 'data/AI'],
                interestedExperiences: ['hack nights', 'demo nights'],
            })
            .returning();

        createdIds.push(profile.id);

        expect(profile.linkedinUrl).toBe('sergio-miami');
        expect(profile.lookingForCofounder).toBe(true);
        expect(profile.wantProductFeedback).toBe(true);
        expect(profile.seekingAcceleratorIntros).toBe(true);
        expect(profile.wantToGiveBack).toBe(true);
        expect(profile.specialties).toEqual(['software', 'data/AI']);
        expect(profile.interestedExperiences).toEqual([
            'hack nights',
            'demo nights',
        ]);
    });

    it('defaults jsonb arrays to empty when not provided', async () => {
        const email = testEmail();

        const [profile] = await db
            .insert(schema.profiles)
            .values({ clerkUserId: testClerkId(), lumaEmail: email })
            .returning();

        createdIds.push(profile.id);

        expect(profile.skills).toEqual([]);
        expect(profile.specialties).toEqual([]);
        expect(profile.interestedExperiences).toEqual([]);
    });

    it('defaults boolean community prefs to false', async () => {
        const [profile] = await db
            .insert(schema.profiles)
            .values({ clerkUserId: testClerkId(), lumaEmail: testEmail() })
            .returning();

        createdIds.push(profile.id);

        expect(profile.lookingForCofounder).toBe(false);
        expect(profile.wantProductFeedback).toBe(false);
        expect(profile.seekingAcceleratorIntros).toBe(false);
        expect(profile.wantToGiveBack).toBe(false);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// READ
// ═══════════════════════════════════════════════════════════════════════════════

describe('Profile — Read', () => {
    it('fetches a profile by clerkUserId', async () => {
        const clerkId = testClerkId();
        const email = testEmail();

        const [created] = await db
            .insert(schema.profiles)
            .values({ clerkUserId: clerkId, lumaEmail: email })
            .returning();
        createdIds.push(created.id);

        const [fetched] = await db
            .select()
            .from(schema.profiles)
            .where(eq(schema.profiles.clerkUserId, clerkId))
            .limit(1);

        expect(fetched).toBeDefined();
        expect(fetched.id).toBe(created.id);
    });

    it('returns empty array for a non-existent clerkUserId', async () => {
        const result = await db
            .select()
            .from(schema.profiles)
            .where(eq(schema.profiles.clerkUserId, 'user_does_not_exist'))
            .limit(1);

        expect(result).toHaveLength(0);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// UPDATE
// ═══════════════════════════════════════════════════════════════════════════════

describe('Profile — Update', () => {
    it('updates bio and role', async () => {
        const [profile] = await db
            .insert(schema.profiles)
            .values({
                clerkUserId: testClerkId(),
                lumaEmail: testEmail(),
            })
            .returning();
        createdIds.push(profile.id);

        const [updated] = await db
            .update(schema.profiles)
            .set({ bio: 'Building cool stuff', role: 'Founder' })
            .where(eq(schema.profiles.id, profile.id))
            .returning();

        expect(updated.bio).toBe('Building cool stuff');
        expect(updated.role).toBe('Founder');
    });

    it('updates social links including LinkedIn', async () => {
        const [profile] = await db
            .insert(schema.profiles)
            .values({
                clerkUserId: testClerkId(),
                lumaEmail: testEmail(),
            })
            .returning();
        createdIds.push(profile.id);

        const [updated] = await db
            .update(schema.profiles)
            .set({
                githubUsername: 'octocat',
                twitterHandle: 'jack',
                websiteUrl: 'https://example.com',
                linkedinUrl: 'sergio-miami',
            })
            .where(eq(schema.profiles.id, profile.id))
            .returning();

        expect(updated.githubUsername).toBe('octocat');
        expect(updated.twitterHandle).toBe('jack');
        expect(updated.websiteUrl).toBe('https://example.com');
        expect(updated.linkedinUrl).toBe('sergio-miami');
    });

    it('updates community preference booleans', async () => {
        const [profile] = await db
            .insert(schema.profiles)
            .values({
                clerkUserId: testClerkId(),
                lumaEmail: testEmail(),
            })
            .returning();
        createdIds.push(profile.id);

        const [updated] = await db
            .update(schema.profiles)
            .set({
                openToMentoring: true,
                seekingFunding: true,
                lookingForCofounder: true,
                wantProductFeedback: true,
                seekingAcceleratorIntros: true,
                wantToGiveBack: true,
            })
            .where(eq(schema.profiles.id, profile.id))
            .returning();

        expect(updated.openToMentoring).toBe(true);
        expect(updated.seekingFunding).toBe(true);
        expect(updated.lookingForCofounder).toBe(true);
        expect(updated.wantProductFeedback).toBe(true);
        expect(updated.seekingAcceleratorIntros).toBe(true);
        expect(updated.wantToGiveBack).toBe(true);
    });

    it('updates specialties and interestedExperiences arrays', async () => {
        const [profile] = await db
            .insert(schema.profiles)
            .values({
                clerkUserId: testClerkId(),
                lumaEmail: testEmail(),
            })
            .returning();
        createdIds.push(profile.id);

        const specialties = ['software', 'hardware/electrical', 'data/AI'];
        const experiences = ['hack nights', 'hackathon', 'demo nights'];

        const [updated] = await db
            .update(schema.profiles)
            .set({ specialties, interestedExperiences: experiences })
            .where(eq(schema.profiles.id, profile.id))
            .returning();

        expect(updated.specialties).toEqual(specialties);
        expect(updated.interestedExperiences).toEqual(experiences);
    });

    it('updates skills array', async () => {
        const [profile] = await db
            .insert(schema.profiles)
            .values({
                clerkUserId: testClerkId(),
                lumaEmail: testEmail(),
            })
            .returning();
        createdIds.push(profile.id);

        const skills = ['React', 'TypeScript', 'Rust', 'Docker'];

        const [updated] = await db
            .update(schema.profiles)
            .set({ skills })
            .where(eq(schema.profiles.id, profile.id))
            .returning();

        expect(updated.skills).toEqual(skills);
    });

    it('sets updatedAt when explicitly passed', async () => {
        const [profile] = await db
            .insert(schema.profiles)
            .values({
                clerkUserId: testClerkId(),
                lumaEmail: testEmail(),
            })
            .returning();
        createdIds.push(profile.id);

        const now = new Date();
        const [updated] = await db
            .update(schema.profiles)
            .set({ bio: 'Updated', updatedAt: now })
            .where(eq(schema.profiles.id, profile.id))
            .returning();

        expect(updated.updatedAt.getTime()).toBe(now.getTime());
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// DELETE
// ═══════════════════════════════════════════════════════════════════════════════

describe('Profile — Delete', () => {
    it('deletes a profile by id and returns it', async () => {
        const [profile] = await db
            .insert(schema.profiles)
            .values({
                clerkUserId: testClerkId(),
                lumaEmail: testEmail(),
            })
            .returning();

        const [deleted] = await db
            .delete(schema.profiles)
            .where(eq(schema.profiles.id, profile.id))
            .returning();

        expect(deleted.id).toBe(profile.id);

        // Verify it's really gone
        const remaining = await db
            .select()
            .from(schema.profiles)
            .where(eq(schema.profiles.id, profile.id));

        expect(remaining).toHaveLength(0);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════════

describe('Profile — Edge cases', () => {
    it('handles null optional fields gracefully', async () => {
        const [profile] = await db
            .insert(schema.profiles)
            .values({
                clerkUserId: testClerkId(),
                lumaEmail: testEmail(),
                bio: null,
                githubUsername: null,
                twitterHandle: null,
                websiteUrl: null,
                linkedinUrl: null,
                role: null,
                lumaAttendeeId: null,
            })
            .returning();
        createdIds.push(profile.id);

        expect(profile.bio).toBeNull();
        expect(profile.githubUsername).toBeNull();
        expect(profile.twitterHandle).toBeNull();
        expect(profile.websiteUrl).toBeNull();
        expect(profile.linkedinUrl).toBeNull();
        expect(profile.role).toBeNull();
        expect(profile.lumaAttendeeId).toBeNull();
    });

    it('handles large skills/specialties arrays', async () => {
        const hugeList = Array.from({ length: 50 }, (_, i) => `skill_${i}`);

        const [profile] = await db
            .insert(schema.profiles)
            .values({
                clerkUserId: testClerkId(),
                lumaEmail: testEmail(),
                skills: hugeList,
                specialties: hugeList,
            })
            .returning();
        createdIds.push(profile.id);

        expect(profile.skills).toHaveLength(50);
        expect(profile.specialties).toHaveLength(50);
    });

    it('stores and returns special characters in bio', async () => {
        const bio = 'I ❤️ building! 日本語テスト & <script>alert("xss")</script>';

        const [profile] = await db
            .insert(schema.profiles)
            .values({
                clerkUserId: testClerkId(),
                lumaEmail: testEmail(),
                bio,
            })
            .returning();
        createdIds.push(profile.id);

        expect(profile.bio).toBe(bio);
    });
});
