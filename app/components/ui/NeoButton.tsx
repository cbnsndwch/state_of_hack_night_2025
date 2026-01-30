import * as React from 'react';
import { cn } from '@/utils/cn';

interface NeoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary';
}

export const NeoButton = React.forwardRef<HTMLButtonElement, NeoButtonProps>(
    ({ children, className, variant = 'primary', ...props }, ref) => {
        const variantClasses = {
            primary:
                'bg-primary text-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
            secondary:
                'bg-black text-white border-2 border-white shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]'
        };

        return (
            <button
                ref={ref}
                className={cn(
                    'px-6 py-3 font-sans font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed',
                    variantClasses[variant],
                    className
                )}
                {...props}
            >
                {children}
            </button>
        );
    }
);

NeoButton.displayName = 'NeoButton';
