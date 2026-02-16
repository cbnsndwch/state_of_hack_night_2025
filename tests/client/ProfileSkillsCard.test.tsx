/**
 * Component tests for ProfileSkillsCard.
 *
 * Verifies specialty chip selection, skill tag input rendering,
 * and save callback payloads.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ProfileSkillsCard } from '@/components/profile/ProfileSkillsCard';
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
    const result = render(<ProfileSkillsCard {...props} />);
    return { ...result, onSave: props.onSave as ReturnType<typeof vi.fn> };
}

describe('ProfileSkillsCard', () => {
    it('renders the section heading', () => {
        renderCard();
        expect(screen.getByText('skills_and_interests')).toBeInTheDocument();
    });

    it('renders all 10 specialty options', () => {
        renderCard();
        const SPECIALTIES = [
            'ar/vr', 'aerospace', 'chemical/ag/bio', 'civil/industrial',
            'data/ai', 'design', 'firmware', 'hardware/electrical',
            'mechanical', 'software',
        ];
        for (const s of SPECIALTIES) {
            expect(screen.getByText(s)).toBeInTheDocument();
        }
    });

    it('pre-selects specialties from profile data', () => {
        renderCard({}, { specialties: ['software', 'data/ai'] });

        // The selected chips should show the checkmark prefix
        expect(screen.getByText(/✓ software/)).toBeInTheDocument();
        expect(screen.getByText(/✓ data\/ai/)).toBeInTheDocument();
    });

    it('toggles a specialty on click', async () => {
        const user = userEvent.setup();
        renderCard();

        const softwareChip = screen.getByText('software');
        await user.click(softwareChip);

        // After clicking, it should now show the checkmark
        expect(screen.getByText(/✓ software/)).toBeInTheDocument();
    });

    it('deselects a previously selected specialty', async () => {
        const user = userEvent.setup();
        renderCard({}, { specialties: ['software'] });

        // Currently selected
        const chip = screen.getByText(/✓ software/);
        await user.click(chip);

        // Now deselected — no checkmark
        expect(screen.getByText('software')).toBeInTheDocument();
        expect(screen.queryByText(/✓ software/)).not.toBeInTheDocument();
    });

    it('renders the SkillTagInput', () => {
        renderCard();
        expect(
            screen.getByText('Skills & Technologies')
        ).toBeInTheDocument();
    });

    it('pre-fills skills from profile data', () => {
        renderCard({}, { skills: ['React', 'Rust'] });
        expect(screen.getByText('React')).toBeInTheDocument();
        expect(screen.getByText('Rust')).toBeInTheDocument();
    });

    it('saves specialties and skills together', async () => {
        const user = userEvent.setup();
        const { onSave } = renderCard({}, { specialties: ['software'] });

        await user.click(screen.getByTestId('save-skills-button'));

        expect(onSave).toHaveBeenCalledWith({
            skills: undefined, // empty array → undefined
            specialties: ['software'],
        });
    });

    it('shows "saving..." when saving prop is true', () => {
        renderCard({ saving: true });
        expect(screen.getByText('saving...')).toBeInTheDocument();
    });

    it('shows success feedback after save', async () => {
        const user = userEvent.setup();
        renderCard();

        await user.click(screen.getByTestId('save-skills-button'));
        expect(await screen.findByText('saved')).toBeInTheDocument();
    });
});
