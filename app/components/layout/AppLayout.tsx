import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { SidebarNav } from './SidebarNav';
import { cn } from '@/utils/cn';
import { trackNavClick } from '@/utils/analytics';
import { Button } from '@/components/ui/button';

interface AppLayoutProps {
    children: React.ReactNode;
    isAdmin?: boolean;
}

/**
 * AppLayout - Main wrapper for logged-in dashboard pages
 *
 * Architecture:
 * - SidebarNav on left (desktop) with search, nav, admin, user controls
 * - Mobile: hamburger button in content header, sidebar slides in as overlay
 * - Content area (flex-1) with proper spacing
 * - NO footer (footer only on public site)
 *
 * Responsive:
 * - Desktop (768px+): Sidebar visible, full layout
 * - Mobile (<768px): Hamburger menu, sidebar slides in from left
 */
export function AppLayout({ children, isAdmin = false }: AppLayoutProps) {
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

    return (
        <div className="h-screen flex overflow-hidden bg-black">
            {/* Sidebar - Desktop */}
            <div className="hidden md:flex md:flex-col">
                <SidebarNav
                    isAdmin={isAdmin}
                    onNavigate={() => setIsMobileMenuOpen(false)}
                    onNavItemClick={handleNavClick}
                />
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
                            'fixed top-0 left-0 bottom-0 z-50 md:hidden',
                            'w-70 bg-zinc-950',
                            'transform transition-transform duration-300 ease-in-out',
                            'flex flex-col',
                            isMobileMenuOpen
                                ? 'translate-x-0'
                                : '-translate-x-full'
                        )}
                    >
                        <SidebarNav
                            isAdmin={isAdmin}
                            className="border-r-0"
                            onNavigate={() => setIsMobileMenuOpen(false)}
                            onNavItemClick={handleNavClick}
                        />
                    </div>
                </>
            )}

            {/* Content Area */}
            <main className="flex-1 overflow-y-auto bg-black">
                {/* Mobile menu button - only visible on small screens */}
                <div className="md:hidden sticky top-0 z-30 bg-black/95 backdrop-blur-md border-b border-zinc-800/50 px-4 py-3 flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-zinc-400 hover:text-primary shrink-0"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                    <img
                        src="/logo_horizontal.svg"
                        alt="hello_miami"
                        className="h-5 w-auto"
                    />
                </div>
                <div className="w-full min-h-full px-4 py-4 md:px-8 md:py-6 lg:px-12 lg:py-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
