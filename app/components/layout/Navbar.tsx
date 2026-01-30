import { GithubIcon, Menu, X, LogOut, LayoutDashboard } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { useState } from 'react';

import { useAuth } from '@/hooks/use-auth';
import { LoginDialog } from '@/components/auth/LoginDialog';

import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { Button } from '../ui/button';

export function Navbar() {
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { user, signOut } = useAuth();

    const navLinks = [
        { href: '/', label: 'home' },
        { href: '/ethos', label: 'ethos' },
        { href: '/reports/2025', label: '2025 report' }
    ];

    const isActive = (path: string) => {
        if (path === '/' && location.pathname !== '/') return false;
        return location.pathname.startsWith(path);
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b-2 border-primary/30 bg-black/80 backdrop-blur-md">
            <div className="mx-auto px-4 h-16 max-w-7xl flex items-center justify-between">
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

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8">
                    {navLinks.map(link => (
                        <Link
                            key={link.href}
                            to={link.href}
                            className={`font-sans text-sm tracking-widest hover:text-primary transition-colors ${
                                isActive(link.href)
                                    ? 'text-primary'
                                    : 'text-zinc-400'
                            }`}
                        >
                            {link.label}
                        </Link>
                    ))}

                    <div className="h-4 w-px bg-zinc-800" />

                    {user ? (
                        <div className="flex items-center gap-4">
                            <Link
                                to="/dashboard"
                                className="font-sans text-sm text-primary flex items-center gap-2 hover:opacity-80"
                            >
                                <LayoutDashboard className="size-4" />
                                dashboard
                            </Link>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        title="logout"
                                        className="text-zinc-500 hover:text-white transition-colors"
                                        onClick={() => signOut()}
                                    >
                                        <LogOut className="w-4 h-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-primary text-black font-sans border-2 border-black">
                                    logout
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    ) : (
                        <LoginDialog
                            trigger={
                                <Button
                                    variant="primary"
                                    className="px-4 py-1.5 text-xs h-auto"
                                >
                                    member_login
                                </Button>
                            }
                        />
                    )}

                    {/* <div className="h-4 w-px bg-zinc-800" />

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <a
                                href="https://github.com/cbnsndwch/state-of-the-hack-night-2025"
                                target="_blank"
                                rel="noreferrer"
                                className="text-zinc-400 hover:text-primary transition-colors"
                            >
                                <GithubIcon size={20} />
                            </a>
                        </TooltipTrigger>
                        <TooltipContent className="bg-primary text-black font-sans border-2 border-black">
                            Open Source
                        </TooltipContent>
                    </Tooltip> */}
                </nav>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 text-zinc-400 hover:text-primary"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Nav */}
            {isMenuOpen && (
                <div className="md:hidden bg-black border-b-2 border-primary/30 p-4 space-y-4 font-sans uppercase tracking-widest text-sm">
                    {navLinks.map(link => (
                        <Link
                            key={link.href}
                            to={link.href}
                            onClick={() => setIsMenuOpen(false)}
                            className={`block py-2 ${
                                isActive(link.href)
                                    ? 'text-primary'
                                    : 'text-zinc-400'
                            }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                    <a
                        href="https://github.com/cbnsndwch/state-of-the-hack-night-2025"
                        target="_blank"
                        rel="noreferrer"
                        className="block py-2 text-zinc-400"
                    >
                        GitHub <GithubIcon size={16} className="inline ml-1" />
                    </a>
                </div>
            )}
        </header>
    );
}
