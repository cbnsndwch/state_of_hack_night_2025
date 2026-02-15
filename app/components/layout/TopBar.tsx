import { Bell, LogOut, Menu, Search } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { ConnectionStatus } from '@/components/connection-status';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

interface TopBarProps {
    onMenuToggle?: () => void;
    showMenuButton?: boolean;
}

/**
 * TopBar - Minimal header for logged-in application layout
 *
 * Features:
 * - Search input placeholder (no logic yet)
 * - Notifications icon/badge placeholder
 * - User avatar with dropdown
 * - Logout button in dropdown
 * - Connection status indicator
 * - Mobile hamburger menu toggle
 */
export function TopBar({ onMenuToggle, showMenuButton = true }: TopBarProps) {
    const { user, signOut } = useAuth();
    const [notificationCount] = useState(0); // Placeholder for future notifications

    // Get user initials for avatar fallback
    const getUserInitials = () => {
        if (!user?.email) return '??';
        const emailName = user.email.split('@')[0];
        return emailName.slice(0, 2).toUpperCase();
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b-2 border-primary/30 bg-black/95 backdrop-blur-md">
            <div className="flex items-center justify-between h-16 px-4 gap-4">
                {/* Left: Mobile Menu Button */}
                {showMenuButton && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden text-zinc-400 hover:text-primary"
                        onClick={onMenuToggle}
                        aria-label="Toggle menu"
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                )}

                {/* Center: Search Input */}
                <div className="flex-1 max-w-md mx-auto hidden md:flex">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <Input
                            type="search"
                            placeholder="Search..."
                            className="w-full pl-10 bg-zinc-900/50 border-zinc-800 focus:border-primary text-zinc-300 placeholder:text-zinc-600"
                        />
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-4">
                    {/* Connection Status */}
                    <ConnectionStatus
                        variant="compact"
                        className="hidden md:flex"
                    />

                    {/* Notifications Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative text-zinc-400 hover:text-primary"
                        aria-label="Notifications"
                    >
                        <Bell className="h-5 w-5" />
                        {notificationCount > 0 && (
                            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-black text-xs font-bold flex items-center justify-center">
                                {notificationCount > 9
                                    ? '9+'
                                    : notificationCount}
                            </span>
                        )}
                    </Button>

                    {/* User Avatar Dropdown */}
                    {user && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="relative h-10 w-10 rounded-full p-0"
                                    aria-label="User menu"
                                >
                                    <Avatar className="h-10 w-10 border-2 border-zinc-800 hover:border-primary transition-colors">
                                        <AvatarImage
                                            src={undefined}
                                            alt={user.email}
                                        />
                                        <AvatarFallback className="bg-zinc-900 text-primary font-mono">
                                            {getUserInitials()}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-56 bg-zinc-900 border-zinc-800"
                                align="end"
                                forceMount
                            >
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none text-zinc-200">
                                            Account
                                        </p>
                                        <p className="text-xs leading-none text-zinc-500 font-mono">
                                            {user.email}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-zinc-800" />
                                <DropdownMenuItem
                                    className="text-zinc-300 focus:bg-zinc-800 focus:text-primary cursor-pointer"
                                    onClick={() => signOut()}
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Logout</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>
        </header>
    );
}
