import { cn } from '@/utils/cn';

interface NeoCardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'cyan' | 'magenta' | 'yellow';
}

export function NeoCard({
    children,
    className,
    variant = 'default',
    ...props
}: NeoCardProps) {
    const shadowClass = {
        default: 'neo-shadow',
        cyan: 'neo-shadow-cyan',
        magenta: 'neo-shadow-magenta',
        yellow: 'neo-shadow-yellow'
    }[variant];

    return (
        <div
            className={cn(
                'bg-zinc-950 border-2 border-white p-6 text-white',
                shadowClass,
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
