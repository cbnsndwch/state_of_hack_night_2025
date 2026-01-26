import { GithubIcon, Menu, X, LogOut, LayoutDashboard } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';

import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';

export function Navbar() {
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { user, signInWithGitHub, signOut } = useAuth();

    const navLinks = [
        { href: '/', label: 'home' },
        { href: '/manifesto', label: 'manifesto' },
        { href: '/reports/2025', label: '2025 report' }
    ];

    const isActive = (path: string) => {
        if (path === '/' && location.pathname !== '/') return false;
        return location.pathname.startsWith(path);
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b-2 border-[#22c55e]/30 bg-black/80 backdrop-blur-md">
            <div className="mx-auto px-4 h-16 max-w-7xl flex items-center justify-between">
                <Link
                    to="/"
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity font-mono"
                >
                    <div className="w-8 h-8 bg-[#22c55e] flex items-center justify-center font-bold text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                        H
                    </div>
                    <span className="font-bold hidden sm:block tracking-tighter">
                        hello_miami
                    </span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8">
                    {navLinks.map(link => (
                        <Link
                            key={link.href}
                            to={link.href}
                            className={`font-mono text-sm tracking-widest hover:text-[#22c55e] transition-colors ${
                                isActive(link.href)
                                    ? 'text-[#22c55e]'
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
                                className="font-mono text-xs text-[#22c55e] flex items-center gap-2 hover:opacity-80"
                            >
                                <LayoutDashboard className="w-3 h-3" />
                                dashboard
                            </Link>
                            <button
                                onClick={() => signOut()}
                                className="text-zinc-500 hover:text-white transition-colors"
                                title="logout"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => signInWithGitHub()}
                            className="bg-[#22c55e] text-black px-4 py-1.5 font-mono text-xs font-bold border-2 border-black shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all"
                        >
                            member_login
                        </button>
                    )}

                    <div className="h-4 w-px bg-zinc-800" />

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <a
                                href="https://github.com/cbnsndwch/state-of-the-hack-night-2025"
                                target="_blank"
                                rel="noreferrer"
                                className="text-zinc-400 hover:text-[#22c55e] transition-colors"
                            >
                                <GithubIcon size={20} />
                            </a>
                        </TooltipTrigger>
                        <TooltipContent className="bg-[#22c55e] text-black font-mono border-2 border-black">
                            Open Source
                        </TooltipContent>
                    </Tooltip>
                </nav>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 text-zinc-400 hover:text-[#22c55e]"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Nav */}
            {isMenuOpen && (
                <div className="md:hidden bg-black border-b-2 border-[#22c55e]/30 p-4 space-y-4 font-mono uppercase tracking-widest text-sm">
                    {navLinks.map(link => (
                        <Link
                            key={link.href}
                            to={link.href}
                            onClick={() => setIsMenuOpen(false)}
                            className={`block py-2 ${
                                isActive(link.href)
                                    ? 'text-[#22c55e]'
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
