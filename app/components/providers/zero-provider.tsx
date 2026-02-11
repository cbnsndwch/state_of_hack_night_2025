/**
 * Zero Sync Provider
 *
 * Wraps the application with Zero's realtime sync capabilities.
 * This provider manages the Zero client connection and makes queries available throughout the app.
 */

import { createContext, useContext, useEffect, useState } from 'react';
import { Zero } from '@rocicorp/zero';
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
    const [zero, setZero] = useState<Zero<Schema> | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        // Only initialize Zero if we have environment variables set
        const cacheUrl = import.meta.env.VITE_ZERO_CACHE_URL;
        if (!cacheUrl) {
            console.warn(
                'VITE_ZERO_CACHE_URL not configured, Zero Sync disabled'
            );
            return;
        }

        let zeroInstance: Zero<Schema> | null = null;

        try {
            // Create Zero instance with proper configuration
            zeroInstance = new Zero({
                userID: user?.id || 'anonymous',
                schema,
                server: cacheUrl,
                // Enable dev mode logging if in development
                logLevel: import.meta.env.DEV ? 'info' : 'error'
                // Optional: Configure auth token if using authenticated endpoints
                // auth: () => user?.getToken().then(token => token || '')
            });

            setZero(zeroInstance);
            setIsConnected(true);
            setError(null);

            console.log('[Zero] Client initialized', {
                userID: user?.id || 'anonymous',
                server: cacheUrl
            });
        } catch (err) {
            console.error('[Zero] Failed to initialize client:', err);
            setError(err instanceof Error ? err : new Error('Unknown error'));
            setIsConnected(false);
        }

        // Cleanup on unmount or when user changes
        return () => {
            if (zeroInstance) {
                console.log('[Zero] Cleaning up client');
                // Zero doesn't expose a cleanup method, but the instance will be GC'd
                setZero(null);
                setIsConnected(false);
            }
        };
    }, [user?.id]);

    return (
        <ZeroContext.Provider value={{ zero, isConnected, error }}>
            {children}
        </ZeroContext.Provider>
    );
}
