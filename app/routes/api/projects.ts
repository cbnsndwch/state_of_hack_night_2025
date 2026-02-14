import { data, type ActionFunctionArgs } from 'react-router';
import { createProject } from '@/lib/db/projects.server';
import { getProfileByClerkUserId } from '@/lib/db/profiles.server';

export async function action({ request }: ActionFunctionArgs) {
    const formData = await request.formData();

    const clerkUserId = formData.get('clerkUserId') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string | null;
    const githubUrl = formData.get('githubUrl') as string | null;
    const publicUrl = formData.get('publicUrl') as string | null;
    const tagsString = formData.get('tags') as string | null;
    const imageUrlsString = formData.get('imageUrls') as string | null;

    if (!clerkUserId) {
        return data({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!title) {
        return data({ error: 'Title is required' }, { status: 400 });
    }

    // Get the profile for this Clerk user
    const profile = await getProfileByClerkUserId(clerkUserId);
    if (!profile) {
        return data({ error: 'Profile not found' }, { status: 404 });
    }

    const tags = tagsString
        ? tagsString
              .split(',')
              .map(t => t.trim())
              .filter(Boolean)
        : [];

    const imageUrls = imageUrlsString ? JSON.parse(imageUrlsString) : [];

    const project = await createProject({
        memberId: profile.id,
        title,
        description: description || null,
        githubUrl: githubUrl || null,
        publicUrl: publicUrl || null,
        tags,
        imageUrls
    });

    return data({ success: true, project });
}
