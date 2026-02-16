import { useState, useEffect } from 'react';
import { TopBar } from './TopBar';
import { SidebarNav } from './SidebarNav';
import { UserProfilePreview } from './UserProfilePreview';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/utils/cn';
import { trackNavClick } from '@/utils/analytics';

interface AppLayoutProps {
    children: React.ReactNode;
    isAdmin?: boolean;
}

/**
 * AppLayout - Main wrapper for logged-in dashboard pages
 *
 * Architecture:
 * - TopBar at top (full width) with search, notifications, user menu
 * - SidebarNav on left (desktop) / hamburger menu (mobile)
 * - Content area (flex-1) with proper spacing
 * - NO footer (footer only on public site)
 * - UserProfilePreview at bottom of sidebar
 *
 * Responsive:
 * - Desktop (1024px+): Sidebar visible, full layout
 * - Mobile (<1024px): Hamburger menu, sidebar slides in from left
 */
export function AppLayout({ children, isAdmin = false }: AppLayoutProps) {
    const { user } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Handle navigation clicks for analytics
    const handleNavClick = (item: { href: string; label: string }) => {
        trackNavClick(item.href, item.label);
    };

    // Close mobile menu on Escape key press
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isMobileMenuOpen) {
                setIsMobileMenuOpen(false);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isMobileMenuOpen]);

    // Transform user data for UserProfilePreview
    const userProfile = user
        ? {
              id: user.id,
              email: user.email,
              displayName: user.email.split('@')[0], // Fallback display name
              avatarUrl: undefined, // TODO: Add avatar URL from profile
              affiliation: undefined, // TODO: Add from profile
              role: undefined, // TODO: Add role from profile
              streakCount: undefined, // TODO: Add streak data
              badgeCount: undefined // TODO: Add badge count
          }
        : null;

    return (
        <div className="h-screen flex flex-col bg-black">
            {/* Top Bar */}
            <TopBar
                onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                showMenuButton={true}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar - Desktop */}
                <div className="hidden md:flex md:flex-col">
                    <div className="flex-1 overflow-y-auto">
                        <SidebarNav
                            isAdmin={isAdmin}
                            onNavigate={() => setIsMobileMenuOpen(false)}
                            onNavItemClick={handleNavClick}
                        />
                    </div>
                    {userProfile && (
                        <UserProfilePreview
                            user={userProfile}
                            className="sticky bottom-0"
                        />
                    )}
                </div>

                {/* Sidebar - Mobile (Overlay) */}
                {isMobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 bg-black/80 z-40 md:hidden"
                            onClick={() => setIsMobileMenuOpen(false)}
                            aria-hidden="true"
                        />

                        {/* Sidebar Panel */}
                        <div
                            className={cn(
                                'fixed top-16 left-0 bottom-0 z-50 md:hidden',
                                'w-70 bg-zinc-950',
                                'transform transition-transform duration-300 ease-in-out',
                                'flex flex-col',
                                isMobileMenuOpen
                                    ? 'translate-x-0'
                                    : '-translate-x-full'
                            )}
                        >
                            <div className="flex-1 overflow-y-auto">
                                <SidebarNav
                                    isAdmin={isAdmin}
                                    className="border-r-0"
                                    onNavigate={() =>
                                        setIsMobileMenuOpen(false)
                                    }
                                    onNavItemClick={handleNavClick}
                                />
                            </div>
                            {userProfile && (
                                <UserProfilePreview
                                    user={userProfile}
                                    className="sticky bottom-0"
                                />
                            )}
                        </div>
                    </>
                )}

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto bg-black">
                    <div className="w-full min-h-full p-6 md:p-8 lg:p-12">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
