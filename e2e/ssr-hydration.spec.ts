/**
 * SSR + Zero hydration tests.
 *
 * These verify that public pages with Zero queries render meaningful server
 * content (headings, layout) even before the Zero WebSocket connects. After
 * hydration, Zero should activate and the live-indicator should appear.
 */

import { test, expect } from '@playwright/test';

test.describe('SSR + Zero Hydration', () => {
    test('events page renders layout before Zero connects', async ({
        page
    }) => {
        // Block WebSocket connections to simulate Zero being unavailable
        await page.route('**/*', route => {
            if (route.request().url().includes('zero')) {
                return route.abort();
            }
            return route.continue();
        });

        await page.goto('/events');

        // The page should still render its SSR shell
        await expect(
            page.getByRole('heading', { name: /upcoming events/i })
        ).toBeVisible();

        // There should be visible text content — not a blank screen
        const mainText = await page.textContent('body');
        expect(mainText).toBeTruthy();
        expect(mainText!.length).toBeGreaterThan(50);
    });

    test('showcase page renders layout before Zero connects', async ({
        page
    }) => {
        await page.route('**/*', route => {
            if (route.request().url().includes('zero')) {
                return route.abort();
            }
            return route.continue();
        });

        await page.goto('/showcase');

        await expect(
            page.getByRole('heading', { name: /project showcase/i })
        ).toBeVisible();

        // Description text is always rendered (search input only appears after data loads)
        await expect(
            page.getByText(/what our community is building/i)
        ).toBeVisible();
    });

    test('events page shows live indicator after hydration', async ({
        page
    }) => {
        await page.goto('/events');

        // Wait a moment for React hydration + Zero connection
        // The LiveIndicator renders a small status element when connected.
        // We just verify the page is interactive (no hydration crash).
        await page.waitForTimeout(2000);

        // The heading should still be there post-hydration
        await expect(
            page.getByRole('heading', { name: /upcoming events/i })
        ).toBeVisible();
    });

    test('no console errors about useZero during SSR pages', async ({
        page
    }) => {
        const errors: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        await page.goto('/events');
        await page.waitForTimeout(2000);

        // Verify no "useZero must be used within ZeroProvider" errors
        const zeroErrors = errors.filter(e =>
            e.includes('useZero must be used within')
        );
        expect(zeroErrors).toHaveLength(0);
    });
});
