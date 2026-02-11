/**
 * Zero Sync Provider
 *
 * Wraps the application with Zero's realtime sync capabilities.
 * This provider manages the Zero client connection and makes queries available throughout the app.
 */

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Zero } from '@rocicorp/zero';
import { ZeroProvider as ZeroReactProvider } from '@rocicorp/zero/react';
import { useAuth } from '@/hooks/use-auth';
import { schema } from '@/zero/schema';
import type { Schema } from '@/zero/schema';

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
    const zero = useMemo(() => {
        if (!cacheUrl) {
            return null;
        }

        try {
            return new Zero<Schema>({
                userID: user?.id || 'anonymous',
                schema,
                server: cacheUrl,
                logLevel: import.meta.env.DEV ? 'info' : 'error'
                // Optional: Configure auth token if using authenticated endpoints
                // auth: () => user?.getToken().then(token => token || '')
            });
        } catch (err) {
            console.error('[Zero] Failed to initialize client:', err);
            return null;
        }
    }, [cacheUrl, user?.id]);

    useEffect(() => {
        if (!cacheUrl) {
            setError(
                new Error('VITE_ZERO_CACHE_URL not configured, Zero Sync disabled')
            );
            setIsConnected(false);
            return;
        }

        if (!zero) {
            setError(new Error('Zero client failed to initialize'));
            setIsConnected(false);
            return;
        }

        setIsConnected(true);
        setError(null);

        if (typeof window !== 'undefined') {
            (window as any).__zero = zero;

            import('@/zero/schema').then(({ builder }) => {
                (window as any).__builder = builder;
            });
        }

        console.log('[Zero] Client initialized', {
            userID: user?.id || 'anonymous',
            server: cacheUrl,
            inspectorAvailable: typeof window !== 'undefined'
        });

        return () => {
            console.log('[Zero] Cleaning up client');
            void zero.close();
            setIsConnected(false);
        };
    }, [cacheUrl, zero, user?.id]);

    return (
        <ZeroContext.Provider value={{ zero, isConnected, error }}>
            {zero ? (
                <ZeroReactProvider zero={zero}>{children}</ZeroReactProvider>
            ) : null}
        </ZeroContext.Provider>
    );
}
