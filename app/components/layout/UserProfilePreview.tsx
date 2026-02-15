import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';
import { Flame, Award } from 'lucide-react';

interface UserProfilePreviewProps {
    user: {
        id: string;
        email: string;
        displayName?: string;
        avatarUrl?: string;
        affiliation?: string;
        role?: string;
        streakCount?: number;
        badgeCount?: number;
    };
    className?: string;
}

/**
 * UserProfilePreview - Compact user card for sidebar
 *
 * Features:
 * - User avatar (from Supabase or fallback)
 * - Display name/email
 * - Affiliation or role badge
 * - Optional hover expansion (shows badges, streak count)
 * - Matches sidebar theme styling
 */
export function UserProfilePreview({
    user,
    className
}: UserProfilePreviewProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Get user initials for avatar fallback
    const getUserInitials = () => {
        if (user.displayName) {
            return user.displayName
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
        }
        if (user.email) {
            const emailName = user.email.split('@')[0];
            return emailName.slice(0, 2).toUpperCase();
        }
        return '??';
    };

    const displayName = user.displayName || user.email.split('@')[0];

    return (
        <div
            className={cn(
                'p-4 border-t-2 border-primary/30 bg-zinc-950',
                'transition-all duration-200',
                className
            )}
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
        >
            {/* Main Profile Card */}
            <div className="flex items-center gap-3">
                {/* Avatar */}
                <Avatar className="h-10 w-10 border-2 border-zinc-800">
                    <AvatarImage src={user.avatarUrl} alt={displayName} />
                    <AvatarFallback className="bg-zinc-900 text-primary font-mono text-sm">
                        {getUserInitials()}
                    </AvatarFallback>
                </Avatar>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate">
                        {displayName}
                    </p>
                    {user.affiliation && (
                        <p className="text-xs text-zinc-500 truncate">
                            {user.affiliation}
                        </p>
                    )}
                    {!user.affiliation && user.role && (
                        <Badge
                            variant="secondary"
                            className="text-xs px-1.5 py-0 h-5 bg-primary/10 text-primary border-primary/20"
                        >
                            {user.role}
                        </Badge>
                    )}
                </div>
            </div>

            {/* Expanded Section (on hover) */}
            {isExpanded &&
                (user.streakCount !== undefined ||
                    user.badgeCount !== undefined) && (
                    <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center justify-around">
                        {user.streakCount !== undefined &&
                            user.streakCount > 0 && (
                                <div className="flex items-center gap-1.5">
                                    <Flame className="h-4 w-4 text-orange-500" />
                                    <span className="text-xs font-mono text-zinc-400">
                                        {user.streakCount}
                                    </span>
                                </div>
                            )}
                        {user.badgeCount !== undefined &&
                            user.badgeCount > 0 && (
                                <div className="flex items-center gap-1.5">
                                    <Award className="h-4 w-4 text-primary" />
                                    <span className="text-xs font-mono text-zinc-400">
                                        {user.badgeCount}
                                    </span>
                                </div>
                            )}
                    </div>
                )}
        </div>
    );
}
