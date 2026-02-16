/**
 * Component tests for ProfileBasicInfoCard.
 *
 * Tests the form rendering, field binding, and save callback lifecycle.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ProfileBasicInfoCard } from '@/components/profile/ProfileBasicInfoCard';
import type { ProfileLike, ProfileSectionProps } from '@/components/profile/types';

/** Minimal profile fixture satisfying ProfileLike */
function makeProfile(overrides: Partial<Record<string, unknown>> = {}): ProfileLike {
    return {
        id: 'test-uuid',
        clerkUserId: 'user_test',
        lumaEmail: 'test@hello.miami',
        lumaAttendeeId: 'att_123',
        verificationStatus: 'verified' as const,
        isAppAdmin: false,
        bio: '',
        skills: [],
        githubUsername: '',
        twitterHandle: '',
        websiteUrl: '',
        linkedinUrl: '',
        role: '',
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
    const result = render(<ProfileBasicInfoCard {...props} />);
    return { ...result, onSave: props.onSave as ReturnType<typeof vi.fn> };
}

describe('ProfileBasicInfoCard', () => {
    it('renders the section heading', () => {
        renderCard();
        expect(screen.getByText('basic_info')).toBeInTheDocument();
    });

    it('displays the read-only Luma email', () => {
        renderCard({}, { lumaEmail: 'sergio@cbnsndwch.io' });
        expect(screen.getByDisplayValue('sergio@cbnsndwch.io')).toBeInTheDocument();
    });

    it('displays the read-only Luma attendee ID', () => {
        renderCard({}, { lumaAttendeeId: 'att_abc123' });
        expect(screen.getByDisplayValue('att_abc123')).toBeInTheDocument();
    });

    it('pre-fills bio from profile data', () => {
        renderCard({}, { bio: 'Builder of things' });
        expect(screen.getByDisplayValue('Builder of things')).toBeInTheDocument();
    });

    it('pre-fills role from profile data', () => {
        renderCard({}, { role: 'Founder' });
        expect(screen.getByDisplayValue('Founder')).toBeInTheDocument();
    });

    it('calls onSave with bio and role when save is clicked', async () => {
        const user = userEvent.setup();
        const { onSave } = renderCard();

        // Type into bio
        const bioInput = screen.getByPlaceholderText(/tell the community/i);
        await user.type(bioInput, 'Hello world');

        // Type into role
        const roleInput = screen.getByPlaceholderText(/software engineer/i);
        await user.type(roleInput, 'Engineer');

        // Click save
        await user.click(screen.getByText('save_basic_info'));

        expect(onSave).toHaveBeenCalledWith({
            bio: 'Hello world',
            role: 'Engineer',
        });
    });

    it('shows "saving..." when saving prop is true', () => {
        renderCard({ saving: true });
        expect(screen.getByText('saving...')).toBeInTheDocument();
    });

    it('shows success feedback after save', async () => {
        const user = userEvent.setup();
        const { onSave } = renderCard();

        await user.click(screen.getByText('save_basic_info'));

        expect(onSave).toHaveBeenCalled();
        // The "saved" text should appear after successful save
        expect(await screen.findByText('saved')).toBeInTheDocument();
    });

    it('shows error feedback when save fails', async () => {
        const user = userEvent.setup();
        const failingSave = vi
            .fn()
            .mockResolvedValue({ success: false, error: 'Network error' });

        renderCard({ onSave: failingSave });

        await user.click(screen.getByText('save_basic_info'));

        expect(await screen.findByText('Network error')).toBeInTheDocument();
    });
});
