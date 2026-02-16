/**
 * Client-side test setup.
 *
 * - Adds jest-dom matchers (toBeInTheDocument, toHaveTextContent, etc.)
 * - Ensures DOM cleanup between tests so renders don't leak across test cases
 */
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
    cleanup();
});
