import { type ReactNode, type ComponentProps } from 'react';
import { cn } from '../../utils/cn';

interface SectionProps extends ComponentProps<'section'> {
    title?: string;
    subtitle?: string;
    children: ReactNode;
    containerClassName?: string;
}

export function Section({
    title,
    subtitle,
    children,
    className,
    containerClassName,
    ...props
}: SectionProps) {
    return (
        <section className={cn('py-12 md:py-20 px-4', className)} {...props}>
            <div
                className={cn(
                    'max-w-7xl mx-auto border-2 border-white p-8 md:p-12 relative bg-zinc-950 neo-shadow',
                    containerClassName
                )}
            >
                {(title || subtitle) && (
                    <div className="mb-12 border-b-2 border-dashed border-zinc-800 pb-8">
                        {title ? (
                            <div className="inline-block px-4 py-1 mb-4 bg-white text-black font-sans text-sm font-bold lowercase tracking-wider">
                                {props.id || 'Section'}
                            </div>
                        ) : null}
                        {title ? (
                            <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4 tracking-tighter lowercase text-white">
                                {title}
                            </h2>
                        ) : null}
                        {subtitle ? (
                            <p className="text-xl text-zinc-400 max-w-2xl font-heading">
                                {subtitle}
                            </p>
                        ) : null}
                    </div>
                )}
                {children}
            </div>
        </section>
    );
}
