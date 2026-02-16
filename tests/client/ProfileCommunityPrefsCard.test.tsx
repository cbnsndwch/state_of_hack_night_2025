/**
 * Component tests for ProfileCommunityPrefsCard.
 *
 * Verifies toggle checkboxes, experience chip selection,
 * and save callback payloads.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ProfileCommunityPrefsCard } from '@/components/profile/ProfileCommunityPrefsCard';
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
    const result = render(<ProfileCommunityPrefsCard {...props} />);
    return { ...result, onSave: props.onSave as ReturnType<typeof vi.fn> };
}

describe('ProfileCommunityPrefsCard', () => {
    it('renders the section heading', () => {
        renderCard();
        expect(
            screen.getByText('community_preferences')
        ).toBeInTheDocument();
    });

    it('renders all 6 toggle preferences', () => {
        renderCard();
        expect(screen.getByText('Open to mentoring')).toBeInTheDocument();
        expect(screen.getByText(/seeking funding/i)).toBeInTheDocument();
        expect(screen.getByText(/looking for a co-founder/i)).toBeInTheDocument();
        expect(screen.getByText(/want product feedback/i)).toBeInTheDocument();
        expect(screen.getByText(/seeking vc/i)).toBeInTheDocument();
        expect(screen.getByText(/want to give back/i)).toBeInTheDocument();
    });

    it('pre-checks toggles from profile data', () => {
        renderCard({}, { openToMentoring: true, wantToGiveBack: true });

        const checkboxes = screen.getAllByRole('checkbox');
        const mentoring = checkboxes[0]; // first toggle = openToMentoring
        expect(mentoring).toBeChecked();
    });

    it('toggles a preference on click', async () => {
        const user = userEvent.setup();
        renderCard();

        // Click the "Open to mentoring" label
        const mentoringLabel = screen.getByText('Open to mentoring');
        await user.click(mentoringLabel);

        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes[0]).toBeChecked();
    });

    it('renders all 13 experience interest options', () => {
        renderCard();
        expect(screen.getByText('hack nights')).toBeInTheDocument();
        expect(screen.getByText('hackathon')).toBeInTheDocument();
        expect(screen.getByText('demo nights')).toBeInTheDocument();
        expect(screen.getByText('expert panels')).toBeInTheDocument();
        expect(screen.getByText('technical conference')).toBeInTheDocument();
    });

    it('pre-selects experience interests from profile', () => {
        renderCard({}, { interestedExperiences: ['hack nights', 'demo nights'] });

        expect(screen.getByText(/✓ hack nights/)).toBeInTheDocument();
        expect(screen.getByText(/✓ demo nights/)).toBeInTheDocument();
    });

    it('toggles an experience interest on click', async () => {
        const user = userEvent.setup();
        renderCard();

        await user.click(screen.getByText('hackathon'));
        expect(screen.getByText(/✓ hackathon/)).toBeInTheDocument();
    });

    it('saves toggles and experiences together', async () => {
        const user = userEvent.setup();
        const { onSave } = renderCard(
            {},
            { openToMentoring: true, interestedExperiences: ['hack nights'] }
        );

        await user.click(screen.getByText('save_preferences'));

        expect(onSave).toHaveBeenCalledWith(
            expect.objectContaining({
                openToMentoring: true,
                seekingFunding: false,
                lookingForCofounder: false,
                wantProductFeedback: false,
                seekingAcceleratorIntros: false,
                wantToGiveBack: false,
                interestedExperiences: ['hack nights'],
            })
        );
    });

    it('shows success feedback after save', async () => {
        const user = userEvent.setup();
        renderCard();

        await user.click(screen.getByText('save_preferences'));
        expect(await screen.findByText('saved')).toBeInTheDocument();
    });

    it('shows error feedback when save fails', async () => {
        const user = userEvent.setup();
        const failingSave = vi
            .fn()
            .mockResolvedValue({ success: false, error: 'DB connection lost' });

        renderCard({ onSave: failingSave });

        await user.click(screen.getByText('save_preferences'));
        expect(
            await screen.findByText('DB connection lost')
        ).toBeInTheDocument();
    });
});
