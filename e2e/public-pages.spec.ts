/**
 * Smoke tests for public pages.
 *
 * These verify that the server-side render succeeds and key content is visible
 * without any authentication. They're the first line of defense against
 * broken SSR or build regressions.
 */

import { test, expect } from '@playwright/test';

test.describe('Public Pages — SSR Smoke Tests', () => {
    test('landing page renders heading and community tagline', async ({
        page
    }) => {
        await page.goto('/');

        // Core heading rendered server-side
        await expect(
            page.getByRole('heading', { name: /hello_miami/i })
        ).toBeVisible();

        // Tagline text
        await expect(
            page.getByText(/no-ego.*builder community/i)
        ).toBeVisible();
    });

    test('ethos page renders heading', async ({ page }) => {
        await page.goto('/ethos');

        await expect(
            page.getByRole('heading', { name: /ethos/i })
        ).toBeVisible();
    });

    test('events page renders heading and description', async ({ page }) => {
        await page.goto('/events');

        await expect(
            page.getByRole('heading', { name: /upcoming events/i })
        ).toBeVisible();

        await expect(
            page.getByText(/every tuesday and thursday/i)
        ).toBeVisible();
    });

    test('showcase page renders heading and description', async ({
        page
    }) => {
        await page.goto('/showcase');

        await expect(
            page.getByRole('heading', { name: /project showcase/i })
        ).toBeVisible();

        // Description text is always rendered (search input only appears after Zero loads data)
        await expect(
            page.getByText(/what our community is building/i)
        ).toBeVisible();
    });

    test('login page renders heading', async ({ page }) => {
        await page.goto('/login');

        await expect(
            page.getByRole('heading', { name: /member_login/i })
        ).toBeVisible();
    });
});
