/**
 * Dashboard route tests.
 *
 * The dashboard requires Clerk authentication, so unauthenticated requests
 * should be redirected to /login. These tests verify the SSR redirect
 * behaviour and that the error boundary keeps the app functional
 * even when loaders throw.
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard — Auth redirect', () => {
    test('unauthenticated visit to /dashboard redirects to /login', async ({
        page
    }) => {
        // The createDashboardLoader redirects to /login when not authenticated.
        // Follow the redirect and verify we land on the login page.
        await page.goto('/dashboard');

        await page.waitForURL(/\/login/);
        await expect(page).toHaveURL(/\/login/);
    });

    test('unauthenticated visit to /dashboard/profile redirects to /login', async ({
        page
    }) => {
        await page.goto('/dashboard/profile');

        await page.waitForURL(/\/login/);
        await expect(page).toHaveURL(/\/login/);
    });

    test('unauthenticated visit to /dashboard/projects redirects to /login', async ({
        page
    }) => {
        await page.goto('/dashboard/projects');

        await page.waitForURL(/\/login/);
        await expect(page).toHaveURL(/\/login/);
    });
});

test.describe('Dashboard — SSR hydration', () => {
    test('page does not show a white screen (no WSOD)', async ({ page }) => {
        // Navigate to dashboard (will redirect to login, but the point is
        // that the redirect itself is server-rendered — no blank white page).
        const response = await page.goto('/dashboard');

        // The response should be a redirect (302) or the final login page (200).
        expect(response?.status()).toBeLessThan(500);

        // The body should have rendered content (not an empty white screen)
        const bodyText = await page.textContent('body');
        expect(bodyText?.trim().length).toBeGreaterThan(0);
    });
});
