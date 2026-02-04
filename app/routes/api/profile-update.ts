import { data, type ActionFunctionArgs } from 'react-router';
import { updateProfile } from '@/lib/db/profiles.server';

export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== 'POST') {
        return data({ error: 'Method not allowed' }, { status: 405 });
    }

    try {
        const formData = await request.formData();

        const profileId = formData.get('profileId') as string;
        const bio = formData.get('bio') as string;
        const lumaAttendeeId = formData.get('lumaAttendeeId') as string;
        const skillsJson = formData.get('skills') as string;
        const githubUsername = formData.get('githubUsername') as string;
        const twitterHandle = formData.get('twitterHandle') as string;
        const websiteUrl = formData.get('websiteUrl') as string;
        const role = formData.get('role') as string;
        const seekingFunding = formData.get('seekingFunding') === 'true';
        const openToMentoring = formData.get('openToMentoring') === 'true';

        if (!profileId) {
            return data({ error: 'Profile ID is required' }, { status: 400 });
        }

        // Parse skills from JSON
        let skills: string[] = [];
        if (skillsJson) {
            try {
                skills = JSON.parse(skillsJson);
            } catch (e) {
                return data(
                    { error: 'Invalid skills format' },
                    { status: 400 }
                );
            }
        }

        // Build update object with only non-empty values
        const updateData: Record<string, any> = {};

        if (bio !== null && bio !== undefined) {
            updateData.bio = bio.trim() || null;
        }

        if (lumaAttendeeId !== null && lumaAttendeeId !== undefined) {
            updateData.lumaAttendeeId = lumaAttendeeId.trim() || null;
        }

        if (skills.length > 0) {
            updateData.skills = skills;
        } else {
            updateData.skills = [];
        }

        if (githubUsername !== null && githubUsername !== undefined) {
            updateData.githubUsername = githubUsername.trim() || null;
        }

        if (twitterHandle !== null && twitterHandle !== undefined) {
            updateData.twitterHandle = twitterHandle.trim() || null;
        }

        if (websiteUrl !== null && websiteUrl !== undefined) {
            updateData.websiteUrl = websiteUrl.trim() || null;
        }

        if (role !== null && role !== undefined) {
            updateData.role = role.trim() || null;
        }

        updateData.seekingFunding = seekingFunding;
        updateData.openToMentoring = openToMentoring;

        // Update the profile
        const updatedProfile = await updateProfile(profileId, updateData);

        if (!updatedProfile) {
            return data({ error: 'Profile not found' }, { status: 404 });
        }

        return data({
            success: true,
            profile: {
                id: updatedProfile._id.toString(),
                bio: updatedProfile.bio,
                lumaAttendeeId: updatedProfile.lumaAttendeeId,
                skills: updatedProfile.skills,
                githubUsername: updatedProfile.githubUsername,
                twitterHandle: updatedProfile.twitterHandle,
                websiteUrl: updatedProfile.websiteUrl,
                role: updatedProfile.role,
                seekingFunding: updatedProfile.seekingFunding,
                openToMentoring: updatedProfile.openToMentoring
            }
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        return data({ error: 'Failed to update profile' }, { status: 500 });
    }
}
