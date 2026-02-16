/**
 * Component tests for ProfileSocialsCard.
 *
 * Verifies social field rendering, URL prefix hints, validation feedback,
 * and save callback payloads.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ProfileSocialsCard } from '@/components/profile/ProfileSocialsCard';
import type { ProfileLike, ProfileSectionProps } from '@/components/profile/types';

function makeProfile(overrides: Partial<Record<string, unknown>> = {}): ProfileLike {
    return {
        id: 'test-uuid',
        clerkUserId: 'user_test',
        lumaEmail: 'test@hello.miami',
        lumaAttendeeId: null,
        verificationStatus: 'verified' as const,
        isAppAdmin: false,
        bio: null,
        skills: [],
        githubUsername: null,
        twitterHandle: null,
        websiteUrl: null,
        linkedinUrl: null,
        role: null,
        seekingFunding: false,
        openToMentoring: false,
        lookingForCofounder: false,
        wantProductFeedback: false,
        seekingAcceleratorIntros: false,
        wantToGiveBack: false,
        specialties: [],
        interestedExperiences: [],
        streakCount: 0,
        onboardingDismissed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    } as ProfileLike;
}

function renderCard(
    overrides: Partial<ProfileSectionProps> = {},
    profileOverrides: Partial<Record<string, unknown>> = {}
) {
    const defaultOnSave = vi.fn().mockResolvedValue({ success: true });
    const props: ProfileSectionProps = {
        profile: makeProfile(profileOverrides),
        onSave: overrides.onSave ?? defaultOnSave,
        saving: overrides.saving ?? false,
    };
    const result = render(<ProfileSocialsCard {...props} />);
    return { ...result, onSave: props.onSave as ReturnType<typeof vi.fn> };
}

describe('ProfileSocialsCard', () => {
    it('renders the section heading', () => {
        renderCard();
        expect(screen.getByText('socials')).toBeInTheDocument();
    });

    it('renders all 4 social field labels', () => {
        renderCard();
        expect(screen.getByText('GitHub')).toBeInTheDocument();
        expect(screen.getByText('Twitter / X')).toBeInTheDocument();
        expect(screen.getByText('LinkedIn')).toBeInTheDocument();
        expect(screen.getByText('Website / Portfolio')).toBeInTheDocument();
    });

    it('shows URL prefix hints', () => {
        renderCard();
        expect(screen.getByText('github.com/')).toBeInTheDocument();
        expect(screen.getByText('x.com/')).toBeInTheDocument();
        expect(screen.getByText('linkedin.com/in/')).toBeInTheDocument();
    });

    it('pre-fills social values from profile data', () => {
        renderCard(
            {},
            {
                githubUsername: 'octocat',
                twitterHandle: 'jack',
                linkedinUrl: 'sergio-miami',
                websiteUrl: 'https://example.com',
            }
        );

        expect(screen.getByDisplayValue('octocat')).toBeInTheDocument();
        expect(screen.getByDisplayValue('jack')).toBeInTheDocument();
        expect(screen.getByDisplayValue('sergio-miami')).toBeInTheDocument();
        expect(
            screen.getByDisplayValue('https://example.com')
        ).toBeInTheDocument();
    });

    it('strips @ from twitter handle input', async () => {
        renderCard({}, { twitterHandle: '@jack' });

        // Should display without the @
        expect(screen.getByDisplayValue('jack')).toBeInTheDocument();
    });

    it('calls onSave with social fields when save is clicked', async () => {
        const user = userEvent.setup();
        const { onSave } = renderCard(
            {},
            { githubUsername: 'octocat' }
        );

        await user.click(screen.getByText('save_socials'));

        expect(onSave).toHaveBeenCalledWith(
            expect.objectContaining({
                githubUsername: 'octocat',
            })
        );
    });

    it('shows "saving..." when saving prop is true', () => {
        renderCard({ saving: true });
        expect(screen.getByText('saving...')).toBeInTheDocument();
    });

    it('shows success feedback after save', async () => {
        const user = userEvent.setup();
        renderCard();

        await user.click(screen.getByText('save_socials'));
        expect(await screen.findByText('saved')).toBeInTheDocument();
    });

    it('shows validation error for invalid GitHub username', async () => {
        const user = userEvent.setup();
        const failingSave = vi
            .fn()
            .mockResolvedValue({ success: false, error: 'Save blocked' });

        renderCard({ onSave: failingSave });

        // Type an invalid username (spaces aren't allowed)
        const githubInput = screen.getByPlaceholderText('username');
        await user.type(githubInput, 'invalid user name!!');

        // Trigger save — should show validation error
        await user.click(screen.getByText('save_socials'));

        expect(
            await screen.findByText(/fix the validation errors/i)
        ).toBeInTheDocument();
    });
});
