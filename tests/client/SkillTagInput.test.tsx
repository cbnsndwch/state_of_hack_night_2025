/**
 * Component tests for SkillTagInput.
 *
 * Renders the component in jsdom and exercises the keyboard-driven
 * interaction model: type → suggest → select → remove.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SkillTagInput } from '@/components/profile/SkillTagInput';

describe('SkillTagInput', () => {
    it('renders with placeholder when empty', () => {
        render(<SkillTagInput value={[]} onChange={() => {}} />);
        expect(
            screen.getByPlaceholderText(/type a skill/i)
        ).toBeInTheDocument();
    });

    it('renders existing tags', () => {
        render(
            <SkillTagInput
                value={['React', 'Rust']}
                onChange={() => {}}
            />
        );

        expect(screen.getByText('React')).toBeInTheDocument();
        expect(screen.getByText('Rust')).toBeInTheDocument();
    });

    it('shows "Add more..." placeholder when tags exist', () => {
        render(
            <SkillTagInput value={['React']} onChange={() => {}} />
        );
        expect(screen.getByPlaceholderText('Add more...')).toBeInTheDocument();
    });

    it('calls onChange when adding a skill via Enter', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<SkillTagInput value={[]} onChange={onChange} />);

        const input = screen.getByPlaceholderText(/type a skill/i);
        await user.click(input);
        await user.type(input, 'GraphQL{Enter}');

        expect(onChange).toHaveBeenCalledWith(['GraphQL']);
    });

    it('calls onChange when adding a skill via comma', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<SkillTagInput value={[]} onChange={onChange} />);

        const input = screen.getByPlaceholderText(/type a skill/i);
        await user.click(input);
        await user.type(input, 'Docker,');

        expect(onChange).toHaveBeenCalledWith(['Docker']);
    });

    it('does not add duplicate skills (case-insensitive)', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(
            <SkillTagInput value={['react']} onChange={onChange} />
        );

        const input = screen.getByPlaceholderText('Add more...');
        await user.click(input);
        await user.type(input, 'React{Enter}');

        // onChange should NOT be called because "React" ≈ "react"
        expect(onChange).not.toHaveBeenCalled();
    });

    it('removes last tag on Backspace when input is empty', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(
            <SkillTagInput
                value={['React', 'Rust']}
                onChange={onChange}
            />
        );

        const input = screen.getByPlaceholderText('Add more...');
        await user.click(input);
        await user.keyboard('{Backspace}');

        // Should remove the last item ("Rust")
        expect(onChange).toHaveBeenCalledWith(['React']);
    });

    it('removes a specific tag when its X button is clicked', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(
            <SkillTagInput
                value={['React', 'Rust', 'Go']}
                onChange={onChange}
            />
        );

        // Find the remove button for "Rust"
        const removeBtn = screen.getByRole('button', {
            name: /remove rust/i,
        });
        await user.click(removeBtn);

        expect(onChange).toHaveBeenCalledWith(['React', 'Go']);
    });

    it('shows suggestions dropdown on focus', async () => {
        const user = userEvent.setup();
        render(<SkillTagInput value={[]} onChange={() => {}} />);

        const input = screen.getByPlaceholderText(/type a skill/i);
        await user.click(input);

        // Suggestions should be visible — at least one button in the dropdown
        const suggestions = screen.getAllByRole('button');
        // There are suggestion buttons + the tag remove buttons (0 tags = 0)
        expect(suggestions.length).toBeGreaterThan(0);
    });

    it('filters suggestions as user types', async () => {
        const user = userEvent.setup();
        render(<SkillTagInput value={[]} onChange={() => {}} />);

        const input = screen.getByPlaceholderText(/type a skill/i);
        await user.click(input);
        await user.type(input, 'reac');

        // "react" should appear in suggestions
        const reactSuggestion = screen.getByRole('button', {
            name: /^react$/i,
        });
        expect(reactSuggestion).toBeInTheDocument();
    });

    it('does not show already-selected skills in suggestions', async () => {
        const user = userEvent.setup();
        render(
            <SkillTagInput value={['react']} onChange={() => {}} />
        );

        const input = screen.getByPlaceholderText('Add more...');
        await user.click(input);
        await user.type(input, 'reac');

        // "react" should NOT appear since it's already selected
        const buttons = screen.queryAllByRole('button', {
            name: /^react$/i,
        });
        expect(buttons).toHaveLength(0);
    });

    it('accepts a custom placeholder', () => {
        render(
            <SkillTagInput
                value={[]}
                onChange={() => {}}
                placeholder="Enter tech..."
            />
        );
        expect(
            screen.getByPlaceholderText('Enter tech...')
        ).toBeInTheDocument();
    });
});
