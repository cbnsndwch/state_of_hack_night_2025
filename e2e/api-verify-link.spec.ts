/**
 * E2E tests for the verify-link API endpoint.
 *
 * Playwright tests this at the HTTP level — no browser rendering needed,
 * just raw request/response against the real running server.
 */
import { test, expect } from '@playwright/test';

test.describe('API — /api/verify-link', () => {
    test('returns exists: true for a well-known URL', async ({ request }) => {
        const resp = await request.get('/api/verify-link', {
            params: { url: 'https://github.com' },
        });

        expect(resp.status()).toBe(200);
        const body = await resp.json();
        expect(body.exists).toBe(true);
    });

    test('returns exists: false for a non-existent domain', async ({
        request,
    }) => {
        const resp = await request.get('/api/verify-link', {
            params: {
                url: 'https://this-domain-definitely-does-not-exist-12345.xyz',
            },
        });

        expect(resp.status()).toBe(200);
        const body = await resp.json();
        expect(body.exists).toBe(false);
    });

    test('returns 400 when url param is missing', async ({ request }) => {
        const resp = await request.get('/api/verify-link');
        expect(resp.status()).toBe(400);
    });

    test('returns 400 for non-http schemes', async ({ request }) => {
        const resp = await request.get('/api/verify-link', {
            params: { url: 'ftp://example.com' },
        });

        expect(resp.status()).toBe(400);
        const body = await resp.json();
        expect(body.error).toContain('Invalid URL scheme');
    });
});
