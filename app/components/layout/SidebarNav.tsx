import {
    LayoutDashboard,
    User,
    FolderOpen,
    CalendarCheck,
    Video,
    Shield
} from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { cn } from '@/utils/cn';

interface SidebarNavProps {
    isAdmin?: boolean;
    className?: string;
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
}

/**
 * SidebarNav - Persistent left navigation for logged-in users
 *
 * Features:
 * - Logo/brand section at top
 * - Main navigation items (Dashboard, Profile, Projects, Check-ins, Demo Slots)
 * - Admin section (conditionally visible)
 * - Active state highlighting
 * - Hover states and transitions
 * - Dark theme styling
 */
export function SidebarNav({ isAdmin = false, className }: SidebarNavProps) {
    const location = useLocation();

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
            ]
        }
    ];

    // Check if a path is active
    const isActive = (path: string) => {
        if (path === '/dashboard') {
            return location.pathname === '/dashboard';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <aside
            className={cn(
                'flex flex-col h-full bg-zinc-950 border-r-2 border-primary/30',
                'min-w-[240px] max-w-[240px]',
                className
            )}
        >
            {/* Logo/Brand Section */}
            <div className="p-6 border-b-2 border-primary/30">
                <Link
                    to="/"
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                    <img
                        src="/logo_horizontal.svg"
                        alt="hello_miami"
                        className="h-8 w-auto"
                    />
                </Link>
            </div>

            {/* Navigation Sections */}
            <nav className="flex-1 overflow-y-auto py-6">
                {navSections.map((section, sectionIdx) => {
                    // Skip admin section if user is not admin
                    if (section.adminOnly && !isAdmin) {
                        return null;
                    }

                    return (
                        <div key={sectionIdx} className="mb-8">
                            {/* Section Title */}
                            {section.title && (
                                <div className="px-6 mb-3">
                                    <h3 className="text-xs font-mono text-zinc-600 uppercase tracking-wider">
                                        [{section.title}]
                                    </h3>
                                </div>
                            )}

                            {/* Nav Items */}
                            <div className="space-y-1 px-3">
                                {section.items.map(item => {
                                    const Icon = item.icon;
                                    const active = isActive(item.href);

                                    return (
                                        <Link
                                            key={item.href}
                                            to={item.href}
                                            className={cn(
                                                'flex items-center gap-3 px-3 py-2.5 rounded-md',
                                                'font-sans text-sm tracking-wide',
                                                'transition-all duration-200',
                                                'group',
                                                active
                                                    ? 'bg-primary/10 text-primary border-l-4 border-primary pl-2'
                                                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border-l-4 border-transparent'
                                            )}
                                        >
                                            <Icon
                                                className={cn(
                                                    'h-5 w-5 shrink-0 transition-colors',
                                                    active
                                                        ? 'text-primary'
                                                        : 'text-zinc-600 group-hover:text-zinc-400'
                                                )}
                                            />
                                            <span>{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* Footer/Bottom Section */}
            <div className="p-4 border-t-2 border-primary/30">
                <p className="text-xs text-zinc-600 font-mono text-center">
                    hello_miami
                </p>
            </div>
        </aside>
    );
}
