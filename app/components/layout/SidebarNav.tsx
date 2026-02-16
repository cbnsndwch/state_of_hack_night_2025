import * as Tooltip from '@radix-ui/react-tooltip';
import {
    BarChart3,
    Calendar,
    ChevronDown,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Flame,
    FolderOpen,
    LayoutDashboard,
    LogOut,
    Shield,
    Sparkles,
    Star,
    User,
    Video
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';

import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/utils/cn';

import { NotificationBell } from './NotificationBell';
import { Button } from '../ui/button';

interface SidebarNavProps {
    isAdmin?: boolean;
    className?: string;
    onNavigate?: () => void;
    collapsed?: boolean;
    onCollapsedChange?: (collapsed: boolean) => void;
    shortcuts?: NavItem[];
    onNavItemClick?: (item: { href: string; label: string }) => void;
}

interface NavItem {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
    title?: string;
    items: NavItem[];
    adminOnly?: boolean;
    collapsible?: boolean;
    defaultExpanded?: boolean;
    priority?: 'primary' | 'secondary';
}

/**
 * SidebarNav - Persistent left navigation for logged-in users
 *
 * Features:
 * - Logo/brand section at top
 * - Main navigation items (Dashboard, Profile, Projects, Check-ins, Demo Slots)
 * - Discover section (collapsible, secondary priority)
 * - Admin section (conditionally visible)
 * - Sidebar collapse/expand with icon-only mode
 * - Active state highlighting
 * - Hover states and transitions
 * - Dark theme styling
 * - LocalStorage persistence for collapsed state
 */
export function SidebarNav({
    isAdmin = false,
    className,
    onNavigate,
    collapsed: controlledCollapsed,
    onCollapsedChange,
    shortcuts = [],
    onNavItemClick
}: SidebarNavProps) {
    const { user, signOut } = useAuth();

    const getUserInitials = () => {
        if (!user?.email) return '??';
        const emailName = user.email.split('@')[0];
        return emailName.slice(0, 2).toUpperCase();
    };
    const location = useLocation();
    const [discoverExpanded, setDiscoverExpanded] = useState(true);
    const [internalCollapsed, setInternalCollapsed] = useState(() => {
        // Load from localStorage on initial render (client-side only)
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('sidebar-collapsed');
            return stored === 'true';
        }
        return false;
    });

    // Use controlled or internal state
    const collapsed =
        controlledCollapsed !== undefined
            ? controlledCollapsed
            : internalCollapsed;

    // Persist to localStorage whenever collapsed state changes
    useEffect(() => {
        if (controlledCollapsed === undefined) {
            localStorage.setItem(
                'sidebar-collapsed',
                String(internalCollapsed)
            );
        }
    }, [internalCollapsed, controlledCollapsed]);

    const toggleCollapsed = () => {
        const newCollapsedState = !collapsed;

        // Track collapse/expand
        onNavItemClick?.({
            href: '_sidebar_toggle',
            label: newCollapsedState ? 'collapse_sidebar' : 'expand_sidebar'
        });

        if (onCollapsedChange) {
            onCollapsedChange(newCollapsedState);
        } else {
            setInternalCollapsed(newCollapsedState);
        }
    };

    const mainNavSections: NavSection[] = [
        {
            items: [
                {
                    href: '/dashboard',
                    label: 'Dashboard',
                    icon: LayoutDashboard
                },
                {
                    href: '/dashboard/projects',
                    label: 'My Projects',
                    icon: FolderOpen
                },
                {
                    href: '/dashboard/check-ins',
                    label: 'Hack Night Streak',
                    icon: Flame
                },
                {
                    href: '/dashboard/demo-slots',
                    label: 'Demo Slots',
                    icon: Video
                }
            ],
            priority: 'primary'
        }
    ];

    const discoverSection: NavSection = {
        title: 'Discover',
        collapsible: true,
        defaultExpanded: true,
        priority: 'secondary',
        items: [
            {
                href: '/events',
                label: 'Events',
                icon: Calendar
            },
            {
                href: '/showcase',
                label: 'Showcase',
                icon: Sparkles
            },
            {
                href: '/reports/2025',
                label: 'State of Hack Night',
                icon: BarChart3
            }
        ]
    };

    const adminSection: NavSection = {
        title: 'Admin',
        adminOnly: true,
        collapsible: true,
        defaultExpanded: true,
        items: [
            {
                href: '/admin/surveys',
                label: 'Surveys',
                icon: Shield
            },
            {
                href: '/admin/demo-slots',
                label: 'Demo Slots',
                icon: Video
            }
        ],
        priority: 'primary'
    };

    // Manage admin section expand state — auto-open when on an admin route
    const isOnAdminRoute = location.pathname.startsWith('/admin');
    const [adminManualExpanded, setAdminManualExpanded] = useState(false);
    // Show expanded if user manually expanded OR currently on an admin route
    const adminExpanded = adminManualExpanded || isOnAdminRoute;

    // Check if a path is active
    const isActive = (path: string) => {
        if (path.includes('#')) {
            const [pathname, hash] = path.split('#');
            return (
                location.pathname === pathname && location.hash === `#${hash}`
            );
        }
        if (path === '/dashboard') {
            return location.pathname === '/dashboard';
        }
        return location.pathname.startsWith(path);
    };

    // Helper to render a section title
    const renderSectionTitle = (section: NavSection, isExpanded: boolean) => {
        if (!section.title || collapsed) return null;
        return (
            <div className="px-6 mb-3">
                {section.collapsible ? (
                    <button
                        onClick={() => {
                            if (section.title === 'Discover') {
                                setDiscoverExpanded(!discoverExpanded);
                            }
                            if (section.title === 'Admin') {
                                setAdminManualExpanded(!adminExpanded);
                            }
                        }}
                        className={cn(
                            'flex items-center gap-2 w-full',
                            'text-xs font-mono uppercase tracking-wider',
                            'transition-colors hover:text-zinc-400',
                            section.priority === 'secondary'
                                ? 'text-zinc-700'
                                : 'text-zinc-600'
                        )}
                    >
                        {isExpanded ? (
                            <ChevronDown className="h-3 w-3" />
                        ) : (
                            <ChevronRight className="h-3 w-3" />
                        )}
                        <span>[{section.title}]</span>
                    </button>
                ) : (
                    <h3 className="text-xs font-mono text-zinc-600 uppercase tracking-wider">
                        [{section.title}]
                    </h3>
                )}
            </div>
        );
    };

    // Helper to render section nav items
    const renderSectionItems = (section: NavSection, isExpanded: boolean) => {
        if (!isExpanded && !collapsed) return null;
        return (
            <div className="space-y-1 px-3">
                {section.items.map(item => {
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    const handleClick = () => {
                        onNavigate?.();
                        onNavItemClick?.({
                            href: item.href,
                            label: item.label
                        });
                    };

                    const linkContent = (
                        <Link
                            key={item.href}
                            to={item.href}
                            onClick={handleClick}
                            className={cn(
                                'flex items-center gap-3 rounded-md',
                                'font-sans text-sm tracking-wide',
                                'transition-all duration-200',
                                'group',
                                collapsed
                                    ? 'px-2 py-2.5 justify-center'
                                    : 'px-3 py-2.5',
                                active
                                    ? 'bg-primary/10 text-primary border-l-4 border-primary pl-2'
                                    : section.priority === 'secondary'
                                      ? 'text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-300 border-l-4 border-transparent'
                                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border-l-4 border-transparent'
                            )}
                        >
                            <Icon
                                className={cn(
                                    'h-5 w-5 shrink-0 transition-colors',
                                    active
                                        ? 'text-primary'
                                        : section.priority === 'secondary'
                                          ? 'text-zinc-700 group-hover:text-zinc-500'
                                          : 'text-zinc-600 group-hover:text-zinc-400'
                                )}
                            />
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    );

                    if (collapsed) {
                        return (
                            <Tooltip.Root key={item.href}>
                                <Tooltip.Trigger asChild>
                                    {linkContent}
                                </Tooltip.Trigger>
                                <Tooltip.Portal>
                                    <Tooltip.Content
                                        side="right"
                                        sideOffset={10}
                                        className="bg-zinc-900 text-zinc-100 px-3 py-2 rounded-md text-sm border-2 border-zinc-700 shadow-lg z-50"
                                    >
                                        {item.label}
                                        <Tooltip.Arrow className="fill-zinc-700" />
                                    </Tooltip.Content>
                                </Tooltip.Portal>
                            </Tooltip.Root>
                        );
                    }

                    return linkContent;
                })}
            </div>
        );
    };

    return (
        <Tooltip.Provider delayDuration={300}>
            <aside
                className={cn(
                    'flex flex-col h-full bg-zinc-950 border-r-2 border-primary/30',
                    'transition-all duration-300',
                    collapsed ? 'min-w-20 max-w-20' : 'min-w-60 max-w-60',
                    className
                )}
            >
                {/* Logo/Brand Section with Collapse Toggle */}
                <div className="p-6 border-b-2 border-primary/30 flex items-center justify-between">
                    {!collapsed ? (
                        <>
                            <img
                                src="/logo_horizontal.svg"
                                alt="hello_miami"
                                className="h-6 w-auto"
                            />
                            <Button
                                size="icon"
                                variant="ghost"
                                title="Collapse sidebar"
                                className="text-primary transition-colors"
                                onClick={toggleCollapsed}
                            >
                                <ChevronsLeft className="h-5 w-5" />
                            </Button>
                        </>
                    ) : (
                        <Button
                            size="icon"
                            variant="ghost"
                            title="Expand sidebar"
                            className="text-primary transition-colors mx-auto"
                            onClick={toggleCollapsed}
                        >
                            <ChevronsRight className="h-5 w-5" />
                        </Button>
                    )}
                </div>

                {/* Search Input - hidden until global search story is defined */}

                {/* Navigation Sections */}
                <nav className="flex-1 overflow-y-auto py-6">
                    {/* Quick Access Shortcuts */}
                    {shortcuts.length > 0 && !collapsed && (
                        <div className="mb-8 px-6">
                            <div className="flex items-center gap-2 mb-3">
                                <Star className="h-3 w-3 text-yellow-500" />
                                <h3 className="text-xs font-mono text-zinc-600 uppercase tracking-wider">
                                    [quick_access]
                                </h3>
                            </div>
                            <div className="space-y-1">
                                {shortcuts.map(item => {
                                    const Icon = item.icon;
                                    const active = isActive(item.href);

                                    return (
                                        <Link
                                            key={item.href}
                                            to={item.href}
                                            onClick={() => {
                                                onNavigate?.();
                                                onNavItemClick?.({
                                                    href: item.href,
                                                    label: item.label
                                                });
                                            }}
                                            className={cn(
                                                'flex items-center gap-3 px-3 py-2 rounded-md',
                                                'font-sans text-sm tracking-wide',
                                                'transition-all duration-200',
                                                'group',
                                                active
                                                    ? 'bg-yellow-500/10 text-yellow-500 border-l-4 border-yellow-500 pl-2'
                                                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-yellow-400 border-l-4 border-transparent'
                                            )}
                                        >
                                            <Icon
                                                className={cn(
                                                    'h-5 w-5 shrink-0 transition-colors',
                                                    active
                                                        ? 'text-yellow-500'
                                                        : 'text-zinc-600 group-hover:text-yellow-500'
                                                )}
                                            />
                                            <span>{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {mainNavSections.map((section, sectionIdx) => {
                        const isExpanded = !collapsed;

                        return (
                            <div key={sectionIdx} className="mb-8">
                                {renderSectionTitle(section, isExpanded)}
                                {renderSectionItems(section, isExpanded)}
                            </div>
                        );
                    })}
                </nav>

                {/* Bottom-pinned area: Discover + Admin + User controls */}
                <div className="mt-auto border-t border-zinc-800/50">
                    {/* Discover Section */}
                    <div className="py-4">
                        {renderSectionTitle(
                            discoverSection,
                            (discoverExpanded || collapsed)
                        )}
                        {renderSectionItems(
                            discoverSection,
                            (discoverExpanded || collapsed)
                        )}
                    </div>

                    {/* Admin Section - pinned to bottom */}
                    {isAdmin && (
                        <div className="py-4">
                            {renderSectionTitle(
                                adminSection,
                                adminExpanded || collapsed
                            )}
                            {renderSectionItems(
                                adminSection,
                                adminExpanded || collapsed
                            )}
                        </div>
                    )}

                    {/* User controls: name/email left, notifications + avatar right */}
                    {user && (
                        <div
                            className={cn(
                                'border-t border-zinc-800/50 p-3',
                                collapsed
                                    ? 'flex flex-col items-center gap-2'
                                    : 'flex items-center gap-2'
                            )}
                        >
                            {/* User info - left side */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="grow relative px-2 py-6 flex items-center gap-3 rounded-md hover:bg-zinc-900/50 transition-colors"
                                        aria-label="User menu"
                                    >
                                        <Avatar className="h-8 w-8 border-2 border-zinc-800 hover:border-primary transition-colors">
                                            <AvatarImage
                                                src={undefined}
                                                alt={user.email}
                                            />
                                            <AvatarFallback className="bg-zinc-900 text-primary font-mono text-xs">
                                                {getUserInitials()}
                                            </AvatarFallback>
                                        </Avatar>

                                        {!collapsed && (
                                            <div className="flex-1 min-w-0 flex flex-col items-start">
                                                <p className="text-sm font-medium text-zinc-200 truncate">
                                                    {user.email?.split('@')[0]}
                                                </p>
                                                <p className="text-xs text-zinc-500 font-mono truncate">
                                                    {user.email}
                                                </p>
                                            </div>
                                        )}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className="w-56 bg-zinc-900 border-zinc-800"
                                    side={collapsed ? 'right' : 'top'}
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
                                    <DropdownMenuItem asChild className="text-zinc-300 focus:bg-zinc-800 focus:text-primary cursor-pointer">
                                        <Link to="/dashboard/profile">
                                            <User className="mr-2 h-4 w-4" />
                                            <span>My Profile</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className="text-zinc-300 focus:bg-zinc-800 focus:text-primary cursor-pointer"
                                        onClick={() => signOut()}
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Logout</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Notifications */}
                            <div
                                className={cn(
                                    'flex items-center',
                                    collapsed
                                        ? 'flex-col gap-2'
                                        : 'gap-1.5 shrink-0'
                                )}
                            >
                                <NotificationBell />
                            </div>
                        </div>
                    )}
                </div>
            </aside>
        </Tooltip.Provider>
    );
}
