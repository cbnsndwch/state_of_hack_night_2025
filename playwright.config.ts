import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for hello_miami E2E tests.
 *
 * By default tests run against `http://localhost:5173` (Vite dev server).
 * Set `BASE_URL` env var to override, e.g. for a staging deploy.
 *
 * Quick start:
 *   pnpm dev            # start dev server in one terminal
 *   pnpm test:e2e       # run tests in another
 */
export default defineConfig({
    testDir: './e2e',
    outputDir: './e2e/results',

    /* Maximum time a single test can run */
    timeout: 30_000,

    /* Maximum time expect() assertion can wait */
    expect: { timeout: 10_000 },

    /* Run tests sequentially in CI, parallel locally */
    fullyParallel: !process.env.CI,

    /* Fail the build on CI if you accidentally left test.only */
    forbidOnly: !!process.env.CI,

    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,

    /* Reporter */
    reporter: process.env.CI ? 'github' : 'html',

    use: {
        baseURL: process.env.BASE_URL || 'http://localhost:5173',

        /* Capture traces on first retry for debugging */
        trace: 'on-first-retry',

        /* Take a screenshot on failure */
        screenshot: 'only-on-failure'
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] }
        }
    ],

    /* Start the dev server automatically if no server is running */
    webServer: {
        command: 'pnpm dev',
        url: 'http://localhost:5173',
        reuseExistingServer: true,
        timeout: 60_000
    }
});
