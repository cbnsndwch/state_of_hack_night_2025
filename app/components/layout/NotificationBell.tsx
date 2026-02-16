import { Bell } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface NotificationBellProps {
    className?: string;
    iconSize?: string;
    buttonSize?: string;
}

/**
 * NotificationBell — reusable notification bell icon with badge counter.
 * Placeholder for future notifications implementation.
 */
export function NotificationBell({
    className,
    iconSize = 'h-4 w-4',
    buttonSize = 'h-8 w-8'
}: NotificationBellProps) {
    const [notificationCount] = useState(0);

    return (
        <Button
            variant="ghost"
            size="icon"
            className={`relative text-zinc-400 hover:text-primary ${buttonSize} ${className ?? ''}`}
            aria-label="Notifications"
        >
            <Bell className={iconSize} />
            {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-black text-[10px] font-bold flex items-center justify-center">
                    {notificationCount > 9 ? '9+' : notificationCount}
                </span>
            )}
        </Button>
    );
}
