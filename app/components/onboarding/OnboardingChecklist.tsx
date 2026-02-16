import { Check, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { NeoCard } from '@/components/ui/NeoCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

interface ChecklistItem {
    id: string;
    label: string;
    description: string;
    completed: boolean;
    action?: {
        label: string;
        href?: string;
        onClick?: () => void;
    };
}

interface OnboardingChecklistProps {
    items: ChecklistItem[];
    onDismiss?: () => void;
}

export function OnboardingChecklist({
    items,
    onDismiss
}: OnboardingChecklistProps) {
    const completedCount = items.filter(item => item.completed).length;
    const totalCount = items.length;
    const allCompleted = completedCount === totalCount;

    return (
        <NeoCard variant="cyan" className="relative">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h3 className="text-xl font-sans text-white mb-1">
                        get_started
                    </h3>
                    <p className="text-sm text-zinc-400">
                        {allCompleted
                            ? 'All set! Welcome to the community.'
                            : `${completedCount} of ${totalCount} steps completed`}
                    </p>
                </div>
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="text-zinc-500 hover:text-white transition-colors"
                        aria-label="Dismiss checklist"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Progress Bar */}
            <div className="mb-6 bg-zinc-900 h-2 border border-zinc-800">
                <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{
                        width: `${(completedCount / totalCount) * 100}%`
                    }}
                />
            </div>

            {/* Checklist Items */}
            <div className="space-y-4">
                {items.map(item => {
                    const cardContent = (
                        <>
                            {/* Checkbox */}
                            <div
                                className={cn(
                                    'shrink-0 w-6 h-6 border-2 flex items-center justify-center transition-colors',
                                    item.completed
                                        ? 'bg-primary border-primary'
                                        : 'border-zinc-600'
                                )}
                            >
                                {item.completed && (
                                    <Check className="w-4 h-4 text-black" />
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div
                                    className={cn(
                                        'font-sans mb-1',
                                        item.completed
                                            ? 'text-zinc-500 line-through'
                                            : 'text-white'
                                    )}
                                >
                                    {item.label}
                                </div>
                                <div className="text-sm text-zinc-400">
                                    {item.description}
                                </div>
                            </div>

                            {/* Action */}
                            {item.action && !item.completed && (
                                <div className="shrink-0 self-center">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-xs font-sans gap-1.5"
                                        tabIndex={-1}
                                        onClick={item.action.href ? undefined : item.action.onClick}
                                    >
                                        {item.action.label}
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            )}
                        </>
                    );

                    const cardClasses = cn(
                        'flex items-center gap-4 p-4 border transition-all',
                        item.completed
                            ? 'bg-zinc-900/30 border-zinc-800'
                            : 'bg-zinc-900/50 border-zinc-700 cursor-pointer hover:border-zinc-600 hover:bg-zinc-900/70'
                    );

                    // Make the entire card clickable
                    if (!item.completed && item.action?.href) {
                        return (
                            <Link
                                key={item.id}
                                to={item.action.href}
                                className={cardClasses}
                            >
                                {cardContent}
                            </Link>
                        );
                    }

                    if (!item.completed && item.action?.onClick) {
                        return (
                            <button
                                key={item.id}
                                type="button"
                                className={cn(cardClasses, 'w-full text-left')}
                                onClick={item.action.onClick}
                            >
                                {cardContent}
                            </button>
                        );
                    }

                    return (
                        <div
                            key={item.id}
                            className={cardClasses}
                        >
                            {cardContent}
                        </div>
                    );
                })}
            </div>

            {/* Completion Message */}
            {allCompleted && (
                <div className="mt-6 p-4 bg-primary/10 border border-primary">
                    <p className="text-sm text-primary font-sans">
                        You're all set! Start exploring the community and
                        sharing your projects.
                    </p>
                </div>
            )}
        </NeoCard>
    );
}
