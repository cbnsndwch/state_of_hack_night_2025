import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for hello_miami.
 *
 * Two project workspaces:
 *   1. "server" — integration tests that hit real Postgres (no DOM needed)
 *   2. "client" — React component tests using jsdom
 *
 * Reports:
 *   pnpm test           — terminal summary
 *   pnpm test:ui        — opens Vitest UI in browser
 *   pnpm test -- --reporter=html  — generates HTML report in ./html/
 */
export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './app'),
            '@drizzle': path.resolve(__dirname, './drizzle'),
        },
    },
    test: {
        /* Global test timeout — DB round-trips need a bit more time */
        testTimeout: 15_000,

        /* Reporter: default terminal + optional html */
        reporters: process.env.CI
            ? ['default', 'junit']
            : ['default'],

        /* Output for JUnit (CI) */
        outputFile: {
            junit: './test-results/junit.xml',
        },

        projects: [
            // ─── Server-side integration tests ───────────────────────────
            {
                test: {
                    name: 'server',
                    include: ['tests/server/**/*.test.ts'],
                    environment: 'node',
                    /* Load .env so DATABASE_URL is available */
                    env: {
                        DATABASE_URL:
                            process.env.DATABASE_URL ||
                            'postgresql://postgres:password@localhost:5433/hello_miami',
                    },
                    /* Sequential — tests share a real DB */
                    sequence: { concurrent: false },
                    setupFiles: ['./tests/server/setup.ts'],
                },
                resolve: {
                    alias: {
                        '@': path.resolve(__dirname, './app'),
                        '@drizzle': path.resolve(__dirname, './drizzle'),
                    },
                },
            },
            // ─── Client-side component tests ─────────────────────────────
            {
                plugins: [react()],
                test: {
                    name: 'client',
                    include: ['tests/client/**/*.test.{ts,tsx}'],
                    environment: 'jsdom',
                    setupFiles: ['./tests/client/setup.ts'],
                    css: true,
                },
                resolve: {
                    alias: {
                        '@': path.resolve(__dirname, './app'),
                        '@drizzle': path.resolve(__dirname, './drizzle'),
                    },
                },
            },
        ],
    },
});
