import type { Profile } from '@/types/adapters';

/**
 * Minimal profile shape expected by section cards.
 * Accepts both the app-level `Profile` and Zero's readonly row type.
 */
export type ProfileLike = Profile | {
    readonly id: string;
    readonly lumaEmail: string;
    readonly lumaAttendeeId: string | null;
    readonly bio: string | null;
    readonly skills: readonly string[] | string[] | null;
    readonly role: string | null;
    readonly githubUsername: string | null;
    readonly twitterHandle: string | null;
    readonly websiteUrl: string | null;
    readonly linkedinUrl: string | null;
    readonly seekingFunding: boolean | null;
    readonly openToMentoring: boolean | null;
    readonly lookingForCofounder: boolean | null;
    readonly wantProductFeedback: boolean | null;
    readonly seekingAcceleratorIntros: boolean | null;
    readonly wantToGiveBack: boolean | null;
    readonly specialties: readonly string[] | string[] | null;
    readonly interestedExperiences: readonly string[] | string[] | null;
    readonly isAppAdmin: boolean | null;
    [key: string]: unknown;
};

/**
 * Common props shared by all profile section cards.
 */
export interface ProfileSectionProps {
    profile: ProfileLike;
    onSave: (
        fields: Record<string, unknown>
    ) => Promise<{ success: boolean; error?: string }>;
    saving: boolean;
}
