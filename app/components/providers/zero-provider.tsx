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

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Zero } from '@rocicorp/zero';
import {
    ZeroProvider as ZeroReactProvider,
    ZeroContext as OriginalZeroContext
} from '@rocicorp/zero/react';
import { useAuth as useClerkAuth } from '@clerk/react-router';
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
    const { getToken } = useClerkAuth();
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const cacheUrl = import.meta.env.VITE_ZERO_CACHE_URL as string | undefined;
    const [zero, setZero] = useState<Zero<Schema> | null>(null);

    // Keep a stable ref to getToken so the needs-auth handler never goes stale.
    const getTokenRef = useRef(getToken);
    getTokenRef.current = getToken;

    useEffect(() => {
        if (!cacheUrl) return;

        let z: Zero<Schema> | null = null;
        let unsubscribe: (() => void) | undefined;
        let cancelled = false;

        const init = async () => {
            // For authenticated users, fetch the initial Clerk session token
            // before opening the Zero connection so zero-cache can forward it
            // as an Authorization header to the mutate endpoint.
            let initialAuth: string | undefined;
            if (user?.id) {
                try {
                    const token = await getTokenRef.current();
                    if (cancelled) return;
                    initialAuth = token ?? undefined;
                } catch {
                    // Proceed without auth — the needs-auth handler below will
                    // recover when zero-cache reports a 401.
                    if (cancelled) return;
                }
            }

            try {
                z = new Zero<Schema>({
                    userID: user?.id || 'anonymous',
                    auth: initialAuth,
                    schema,
                    server: cacheUrl,
                    mutators,
                    context: { userId: user?.id || 'anonymous' },
                    logLevel: import.meta.env.DEV ? 'info' : 'error'
                });

                // When zero-cache returns a 401 from the mutate endpoint (e.g.
                // because the Clerk token expired), the client transitions to
                // "needs-auth". We fetch a fresh token and reconnect.
                unsubscribe = z.connection.state.subscribe(async (state) => {
                    if (state.name === 'needs-auth' && user?.id) {
                        console.log(
                            '[Zero] needs-auth — refreshing Clerk token…'
                        );
                        try {
                            const freshToken =
                                await getTokenRef.current();
                            await z!.connection.connect({
                                auth: freshToken ?? undefined
                            });
                        } catch (err) {
                            console.error(
                                '[Zero] Auth refresh failed:',
                                err
                            );
                        }
                    }
                });

                if (!cancelled) {
                    setZero(z);
                    setIsConnected(true);
                }
            } catch (e) {
                if (!cancelled) {
                    setError(e as Error);
                }
            }
        };

        init();

        return () => {
            cancelled = true;
            unsubscribe?.();
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
