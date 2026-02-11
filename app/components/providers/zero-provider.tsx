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
};

const ZeroContext = createContext<ZeroContextValue>({
    zero: null,
    isConnected: false
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

    useEffect(() => {
        // Only initialize Zero if we have environment variables set
        const cacheUrl = import.meta.env.VITE_ZERO_CACHE_URL;
        if (!cacheUrl) {
            console.warn(
                'VITE_ZERO_CACHE_URL not configured, Zero Sync disabled'
            );
            return;
        }

        // Create Zero instance
        const zeroInstance = new Zero({
            userID: user?.id || 'anonymous',
            schema,
            server: cacheUrl,
            // Enable dev mode logging if in development
            logLevel: import.meta.env.DEV ? 'info' : 'error'
        });

        setZero(zeroInstance);
        setIsConnected(true); // Assume connected once Zero is initialized

        // Cleanup on unmount
        return () => {
            // Zero handles cleanup automatically
        };
    }, [user?.id]);

    return (
        <ZeroContext.Provider value={{ zero, isConnected }}>
            {children}
        </ZeroContext.Provider>
    );
}
