import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

import { cn } from '@/utils/cn';

/**
 * Curated suggestions drawn from Luma signup question options
 * plus common tech skills seen in the community.
 */
const SUGGESTED_SKILLS = [
    // From Luma "Select all your specialities"
    'ar/vr',
    'aerospace',
    'chemical/ag/bio',
    'civil/industrial',
    'data/ai',
    'design',
    'firmware',
    'hardware/electrical',
    'mechanical',
    'software',
    // From Luma "Describe yourself"
    'founder',
    'investor',
    'pm',
    // Common tech skills
    'python',
    'typescript',
    'react',
    'node.js',
    'rust',
    'go',
    'swift',
    'kotlin',
    'flutter',
    'next.js',
    'vue',
    'angular',
    'tailwind',
    'docker',
    'kubernetes',
    'aws',
    'gcp',
    'azure',
    'postgresql',
    'mongodb',
    'redis',
    'graphql',
    'solidity',
    'web3',
    'machine learning',
    'computer vision',
    'nlp',
    'robotics',
    '3d printing',
    'CAD',
    'PCB design',
    'embedded systems',
    'IoT',
    'light mapping',
    'figma',
    'blender',
    'unity',
    'unreal engine',
    'lovable',
    'v0',
    'cursor',
];

const TAG_COLOR = 'bg-primary/20 text-primary border-primary/40';

interface SkillTagInputProps {
    value: string[];
    onChange: (skills: string[]) => void;
    placeholder?: string;
    className?: string;
}

export function SkillTagInput({
    value,
    onChange,
    placeholder = 'Type a skill and press Enter...',
    className,
}: SkillTagInputProps) {
    const [input, setInput] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Filter suggestions based on current input, excluding already-added skills
    const filteredSuggestions = input.trim()
        ? SUGGESTED_SKILLS.filter(
              skill =>
                  skill.toLowerCase().includes(input.toLowerCase()) &&
                  !value.some(v => v.toLowerCase() === skill.toLowerCase())
          )
        : SUGGESTED_SKILLS.filter(
              skill =>
                  !value.some(v => v.toLowerCase() === skill.toLowerCase())
          );

    const addSkill = useCallback(
        (skill: string) => {
            const trimmed = skill.trim();
            if (
                trimmed &&
                !value.some(v => v.toLowerCase() === trimmed.toLowerCase())
            ) {
                onChange([...value, trimmed]);
            }
            setInput('');
            setHighlightIndex(-1);
            inputRef.current?.focus();
        },
        [value, onChange]
    );

    const removeSkill = useCallback(
        (index: number) => {
            onChange(value.filter((_, i) => i !== index));
        },
        [value, onChange]
    );

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            if (highlightIndex >= 0 && highlightIndex < filteredSuggestions.length) {
                addSkill(filteredSuggestions[highlightIndex]);
            } else if (input.trim()) {
                addSkill(input);
            }
        } else if (e.key === 'Backspace' && !input && value.length > 0) {
            removeSkill(value.length - 1);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightIndex(prev =>
                prev < filteredSuggestions.length - 1 ? prev + 1 : prev
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightIndex(prev => (prev > 0 ? prev - 1 : -1));
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
            setHighlightIndex(-1);
        }
    };

    // Close suggestions when clicking outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className={cn('relative', className)}>
            {/* Tag display + input */}
            <div
                className={cn(
                    'flex flex-wrap items-center gap-2 min-h-12 px-3 py-2',
                    'bg-black border-2 border-zinc-700 cursor-text',
                    'focus-within:border-primary transition-colors'
                )}
                onClick={() => inputRef.current?.focus()}
            >
                {value.map((skill, i) => (
                    <span
                        key={skill}
                        className={cn(
                            'inline-flex items-center gap-1 px-2.5 py-1 text-sm font-sans border rounded-sm',
                            TAG_COLOR
                        )}
                    >
                        {skill}
                        <button
                            type="button"
                            onClick={e => {
                                e.stopPropagation();
                                removeSkill(i);
                            }}
                            className="ml-0.5 hover:opacity-70 transition-opacity"
                            aria-label={`Remove ${skill}`}
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => {
                        setInput(e.target.value);
                        setHighlightIndex(-1);
                        setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={value.length === 0 ? placeholder : 'Add more...'}
                    className="flex-1 min-w-30 bg-transparent text-white font-sans text-sm outline-none placeholder:text-zinc-500"
                />
            </div>

            {/* Suggestions dropdown */}
            {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto bg-zinc-900 border-2 border-zinc-700 shadow-lg">
                    {filteredSuggestions.slice(0, 12).map((skill, i) => (
                        <button
                            key={skill}
                            type="button"
                            className={cn(
                                'w-full text-left px-3 py-2 text-sm font-sans transition-colors',
                                i === highlightIndex
                                    ? 'bg-primary/20 text-primary'
                                    : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                            )}
                            onMouseDown={e => {
                                e.preventDefault();
                                addSkill(skill);
                            }}
                            onMouseEnter={() => setHighlightIndex(i)}
                        >
                            {skill}
                        </button>
                    ))}
                    {filteredSuggestions.length > 12 && (
                        <div className="px-3 py-1.5 text-xs text-zinc-500 font-sans">
                            +{filteredSuggestions.length - 12} more — keep typing to narrow down
                        </div>
                    )}
                </div>
            )}

            <p className="mt-1.5 text-xs text-zinc-500 font-sans">
                Type to search or pick from suggestions. Press{' '}
                <kbd className="px-1 py-0.5 bg-zinc-800 border border-zinc-600 rounded text-[10px]">
                    Enter
                </kbd>{' '}
                or{' '}
                <kbd className="px-1 py-0.5 bg-zinc-800 border border-zinc-600 rounded text-[10px]">
                    ,
                </kbd>{' '}
                to add.
            </p>
        </div>
    );
}
