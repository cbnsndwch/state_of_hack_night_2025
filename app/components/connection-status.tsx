/**
 * Connection Status Indicator
 *
 * Displays the current connection status of the Zero Sync client.
 * Shows a visual indicator when connected, disconnected, or experiencing errors.
 */

import { useZeroConnection } from '@/components/providers/zero-provider';
import { cn } from '@/utils/cn';
import { WifiOff, Wifi } from 'lucide-react';
import { useEffect, useState } from 'react';

type ConnectionStatusProps = {
    /** Whether to show as a compact icon or full status text */
    variant?: 'compact' | 'full';
    /** Additional CSS classes */
    className?: string;
};

export function ConnectionStatus({
    variant = 'compact',
    className
}: ConnectionStatusProps) {
    const { isConnected, error } = useZeroConnection();
    const [showStatus, setShowStatus] = useState(false);

    // Only show the status indicator after initial mount to avoid hydration issues
    useEffect(() => {
        const timeout = setTimeout(() => {
            setShowStatus(true);
        }, 0);
        return () => clearTimeout(timeout);
    }, []);

    if (!showStatus) {
        return null;
    }

    // Don't show anything if connected and no errors
    if (isConnected && !error && variant === 'compact') {
        return null;
    }

    const statusConfig = {
        connected: {
            icon: Wifi,
            text: 'Connected',
            color: 'text-green-500',
            bgColor: 'bg-green-500/10',
            borderColor: 'border-green-500/20'
        },
        disconnected: {
            icon: WifiOff,
            text: 'Offline',
            color: 'text-yellow-500',
            bgColor: 'bg-yellow-500/10',
            borderColor: 'border-yellow-500/20'
        },
        error: {
            icon: WifiOff,
            text: 'Connection Error',
            color: 'text-red-500',
            bgColor: 'bg-red-500/10',
            borderColor: 'border-red-500/20'
        }
    };

    const status = error ? 'error' : isConnected ? 'connected' : 'disconnected';
    const config = statusConfig[status];
    const Icon = config.icon;

    if (variant === 'compact') {
        return (
            <div
                className={cn(
                    'flex items-center gap-1.5 px-2 py-1 rounded-md border',
                    config.bgColor,
                    config.borderColor,
                    className
                )}
                title={error ? `Error: ${error.message}` : config.text}
            >
                <Icon className={cn('h-3.5 w-3.5', config.color)} />
                {status !== 'connected' && (
                    <span className={cn('text-xs font-mono', config.color)}>
                        {config.text}
                    </span>
                )}
            </div>
        );
    }

    return (
        <div
            className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg border',
                config.bgColor,
                config.borderColor,
                className
            )}
        >
            <Icon className={cn('h-4 w-4', config.color)} />
            <div className="flex flex-col">
                <span className={cn('text-sm font-medium', config.color)}>
                    {config.text}
                </span>
                {error && (
                    <span className="text-xs text-gray-400 font-mono">
                        {error.message}
                    </span>
                )}
            </div>
        </div>
    );
}

/**
 * Live Update Indicator
 *
 * Shows a pulsing dot to indicate that data is being updated in realtime.
 * Use this near data displays that are using Zero queries.
 */
export function LiveIndicator({ className }: { className?: string }) {
    const { isConnected } = useZeroConnection();

    if (!isConnected) {
        return null;
    }

    return (
        <div
            className={cn('flex items-center gap-1.5', className)}
            title="Live updates enabled"
        >
            <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </div>
            <span className="text-xs font-mono text-green-500">LIVE</span>
        </div>
    );
}
