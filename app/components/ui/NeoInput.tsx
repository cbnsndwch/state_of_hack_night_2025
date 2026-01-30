import * as React from 'react';
import { cn } from '@/utils/cn';

export const NeoInput = React.forwardRef<
    HTMLInputElement,
    React.ComponentProps<'input'>
>(({ className, ...props }, ref) => {
    return (
        <input
            ref={ref}
            className={cn(
                'w-full px-4 py-3 bg-black text-white border-2 border-zinc-700 font-sans',
                'focus:border-primary focus:outline-none',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'placeholder:text-zinc-500',
                className
            )}
            {...props}
        />
    );
});

NeoInput.displayName = 'NeoInput';
