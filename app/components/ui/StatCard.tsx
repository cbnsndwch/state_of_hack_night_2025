import { type ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { NeoCard } from './NeoCard';

interface StatCardProps {
    label: string;
    value: string | number;
    icon?: ReactNode;
    className?: string;
    subtext?: string;
    variant?: 'default' | 'cyan' | 'magenta' | 'yellow';
}

export function StatCard({
    label,
    value,
    icon,
    className,
    subtext,
    variant = 'default'
}: StatCardProps) {
    return (
        <NeoCard
            variant={variant}
            className={cn('flex flex-col gap-2', className)}
        >
            <div className="flex items-center justify-between text-zinc-400 border-b border-zinc-800 pb-2 mb-2">
                <span className="text-sm font-bold uppercase tracking-wider font-mono">
                    {label}
                </span>
                {icon && <div className="text-white">{icon}</div>}
            </div>
            <div className="text-5xl font-black text-white tracking-tighter font-heading">
                {value}
            </div>
            {subtext && (
                <div className="text-xs text-zinc-500 font-mono mt-1">
                    {subtext}
                </div>
            )}
        </NeoCard>
    );
}
