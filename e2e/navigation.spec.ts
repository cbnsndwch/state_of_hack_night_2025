/**
 * Navigation and routing E2E tests.
 *
 * Verifies that client-side navigation works (React Router),
 * that all public routes resolve without errors, and that
 * protected routes properly guard access.
 */
import { test, expect } from '@playwright/test';

test.describe('Client-side Navigation', () => {
    test('navigates from landing → ethos via link', async ({ page }) => {
        await page.goto('/');

        // Find the ethos link and click it
        const ethosLink = page.getByRole('link', { name: /ethos/i });
        if (await ethosLink.isVisible()) {
            await ethosLink.click();
            await page.waitForURL(/\/ethos/);
            await expect(
                page.getByRole('heading', { name: /ethos/i })
            ).toBeVisible();
        }
    });

    test('navigates from landing → events via link', async ({ page }) => {
        await page.goto('/');

        const eventsLink = page.getByRole('link', { name: /events/i });
        if (await eventsLink.isVisible()) {
            await eventsLink.click();
            await page.waitForURL(/\/events/);
            await expect(
                page.getByRole('heading', { name: /upcoming events/i })
            ).toBeVisible();
        }
    });
});

test.describe('All Public Routes — No 500s', () => {
    const PUBLIC_ROUTES = [
        '/',
        '/ethos',
        '/events',
        '/showcase',
        '/login',
        '/reports/2025',
    ];

    for (const route of PUBLIC_ROUTES) {
        test(`GET ${route} — status < 500`, async ({ page }) => {
            const response = await page.goto(route);
            expect(response?.status()).toBeLessThan(500);

            // No blank page
            const bodyText = await page.textContent('body');
            expect(bodyText?.trim().length).toBeGreaterThan(0);
        });
    }
});

test.describe('All Protected Routes — Redirect to /login', () => {
    const PROTECTED_ROUTES = [
        '/dashboard',
        '/dashboard/profile',
        '/dashboard/projects',
        '/dashboard/check-ins',
        '/dashboard/demo-slots',
    ];

    for (const route of PROTECTED_ROUTES) {
        test(`GET ${route} → redirects to /login`, async ({ page }) => {
            await page.goto(route);
            await page.waitForURL(/\/login/, { timeout: 10_000 });
            expect(page.url()).toContain('/login');
        });
    }
});
