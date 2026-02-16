import * as Tooltip from '@radix-ui/react-tooltip';
import {
    BarChart3,
    Calendar,
    CalendarCheck,
    ChevronDown,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    FolderOpen,
    LayoutDashboard,
    Shield,
    Sparkles,
    Star,
    User,
    Video
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';

import { cn } from '@/utils/cn';

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

    const navSections: NavSection[] = [
        {
            items: [
                {
                    href: '/dashboard',
                    label: 'Dashboard',
                    icon: LayoutDashboard
                },
                {
                    href: '/dashboard/profile',
                    label: 'My Profile',
                    icon: User
                },
                {
                    href: '/dashboard/projects',
                    label: 'My Projects',
                    icon: FolderOpen
                },
                {
                    href: '/dashboard/check-ins',
                    label: 'Check-ins/Streaks',
                    icon: CalendarCheck
                },
                {
                    href: '/dashboard/demo-slots',
                    label: 'Demo Slots',
                    icon: Video
                }
            ],
            priority: 'primary'
        },
        {
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
                    label: 'State of 2025',
                    icon: BarChart3
                }
            ]
        },
        {
            title: 'Admin',
            adminOnly: true,
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
        }
    ];

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

                    {navSections.map((section, sectionIdx) => {
                        // Skip admin section if user is not admin
                        if (section.adminOnly && !isAdmin) {
                            return null;
                        }

                        // Handle section expansion state
                        const isExpanded =
                            !collapsed &&
                            (section.collapsible
                                ? section.title === 'Discover'
                                    ? discoverExpanded
                                    : true
                                : true);

                        return (
                            <div key={sectionIdx} className="mb-8">
                                {/* Section Title (hidden when collapsed) */}
                                {section.title && !collapsed && (
                                    <div className="px-6 mb-3">
                                        {section.collapsible ? (
                                            <button
                                                onClick={() => {
                                                    if (
                                                        section.title ===
                                                        'Discover'
                                                    ) {
                                                        setDiscoverExpanded(
                                                            !discoverExpanded
                                                        );
                                                    }
                                                }}
                                                className={cn(
                                                    'flex items-center gap-2 w-full',
                                                    'text-xs font-mono uppercase tracking-wider',
                                                    'transition-colors hover:text-zinc-400',
                                                    section.priority ===
                                                        'secondary'
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
                                )}

                                {/* Nav Items */}
                                {(isExpanded || collapsed) && (
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
                                                            : section.priority ===
                                                                'secondary'
                                                              ? 'text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-300 border-l-4 border-transparent'
                                                              : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border-l-4 border-transparent'
                                                    )}
                                                >
                                                    <Icon
                                                        className={cn(
                                                            'h-5 w-5 shrink-0 transition-colors',
                                                            active
                                                                ? 'text-primary'
                                                                : section.priority ===
                                                                    'secondary'
                                                                  ? 'text-zinc-700 group-hover:text-zinc-500'
                                                                  : 'text-zinc-600 group-hover:text-zinc-400'
                                                        )}
                                                    />
                                                    {!collapsed && (
                                                        <span>
                                                            {item.label}
                                                        </span>
                                                    )}
                                                </Link>
                                            );

                                            // Wrap with tooltip when collapsed
                                            if (collapsed) {
                                                return (
                                                    <Tooltip.Root
                                                        key={item.href}
                                                    >
                                                        <Tooltip.Trigger
                                                            asChild
                                                        >
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
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Footer/Bottom Section */}
                <div className="p-4 border-t-2 border-primary/30">
                    {!collapsed ? (
                        <p className="text-xs text-zinc-600 font-mono text-center">
                            hello_miami
                        </p>
                    ) : (
                        <p className="text-xs text-zinc-600 font-mono text-center">
                            hm
                        </p>
                    )}
                </div>
            </aside>
        </Tooltip.Provider>
    );
}
