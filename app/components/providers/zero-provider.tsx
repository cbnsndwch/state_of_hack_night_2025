/**
 * Zero Sync Provider
 *
 * Wraps the application with Zero's realtime sync capabilities.
 * This provider manages the Zero client connection and makes queries
 * available throughout the app.
 *
 * ## SSR Support
 *
 * Zero doesn't natively support SSR (it relies on WebSocket + IndexedDB).
 * This provider works around that by:
 *
 * 1. **Always rendering children** — even before the Zero client connects.
 *    Previously, children were gated behind `zero ? ... : null`, which
 *    blocked server-side rendering entirely.
 *
 * 2. **Providing a SSR stub** to `@rocicorp/zero/react`'s internal
 *    `ZeroContext` when the real client isn't ready. This satisfies the
 *    `useZero()` truthiness check inside `useQuery()`, preventing the
 *    "useZero must be used within ZeroProvider" error during SSR.
 *
 * 3. Components should use `useSafeQuery` (from `@/hooks/use-safe-query`)
 *    instead of importing `useQuery` directly from `@rocicorp/zero/react`.
 *    `useSafeQuery` gates the actual query behind a `zero` availability
 *    check, ensuring `useQuery` always receives `null` during SSR.
 *
 * When the Zero client connects on the client side, queries activate
 * automatically and provide live/reactive updates.
 */

import { createContext, useContext, useEffect, useState } from 'react';
import { Zero } from '@rocicorp/zero';
import {
    ZeroProvider as ZeroReactProvider,
    ZeroContext as OriginalZeroContext
} from '@rocicorp/zero/react';
import { useAuth } from '@/hooks/use-auth';
import { schema } from '@/zero/schema';
import type { Schema } from '@/zero/schema';
import { mutators } from '@/zero/mutators';

/**
 * A minimal stub that satisfies `useZero()`'s truthiness check inside
 * `@rocicorp/zero/react`'s `useQuery()`. This is only used when the real
 * Zero client isn't connected yet (SSR or before hydration/WebSocket init).
 *
 * IMPORTANT: This stub is NEVER used to execute real queries. The `useSafeQuery`
 * hook gates all query expressions behind `useZeroConnection().zero`, so
 * `useQuery()` always receives `null` when this stub is active, hitting the
 * fast "disabled query" code path. The stub's properties are never accessed.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SSR_ZERO_STUB = Object.freeze({ __ssrStub: true }) as any;

type ZeroContextValue = {
    zero: Zero<Schema> | null;
    isConnected: boolean;
    error: Error | null;
};

const ZeroContext = createContext<ZeroContextValue>({
    zero: null,
    isConnected: false,
    error: null
});

export function useZero() {
    const context = useContext(ZeroContext);
    if (!context.zero) {
        throw new Error('useZero must be used within ZeroProvider');
    }
    return context.zero;
}

export function useZeroConnection() {
    return useContext(ZeroContext);
}

export function ZeroProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const cacheUrl = import.meta.env.VITE_ZERO_CACHE_URL as string | undefined;
    const [zero, setZero] = useState<Zero<Schema> | null>(null);

    useEffect(() => {
        // Wait for strict-mode double-invoke to settle or hydration to complete
        // This effect will run on mount and when dependencies change.
        if (!cacheUrl) {
            return;
        }

        let z: Zero<Schema> | null = null;
        try {
            z = new Zero<Schema>({
                userID: user?.id || 'anonymous',
                schema,
                server: cacheUrl,
                mutators,
                context: { userId: user?.id || 'anonymous' },
                // loglevel info in dev, error in prod
                logLevel: import.meta.env.DEV ? 'info' : 'error'
            });

            setTimeout(() => {
                setZero(z);
                setIsConnected(true);
            }, 0);
        } catch (e) {
            setTimeout(() => {
                setError(e as Error);
            }, 0);
            return;
        }

        return () => {
            // Cleanup function
            void (async () => {
                try {
                    await z?.close();
                } catch (err) {
                    const message =
                        err instanceof Error ? err.message : String(err);
                    if (
                        !message.includes(
                            'Global zero instance does not match this instance'
                        )
                    ) {
                        console.error('[Zero] Error closing client:', err);
                    }
                }
            })();
            setZero(null);
            setIsConnected(false);
        };
    }, [cacheUrl, user?.id]);

    useEffect(() => {
        if (!zero) return;

        // Expose to window for debugging
        if (typeof window !== 'undefined') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).__zero = zero;
        }

        return () => {
            if (typeof window !== 'undefined') {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if ((window as any).__zero === zero) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (window as any).__zero = undefined;
                }
            }
        };
    }, [zero]);

    return (
        <ZeroContext.Provider value={{ zero, isConnected, error }}>
            {zero ? (
                <ZeroReactProvider zero={zero}>{children}</ZeroReactProvider>
            ) : (
                // SSR / pre-connection: provide stub so useQuery() doesn't throw,
                // but useSafeQuery gates all queries to null → disabled path.
                <OriginalZeroContext.Provider value={SSR_ZERO_STUB}>
                    {children}
                </OriginalZeroContext.Provider>
            )}
        </ZeroContext.Provider>
    );
}
