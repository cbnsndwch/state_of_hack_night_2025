import { data, type ActionFunctionArgs } from 'react-router';
import { uploadToCloudflareImages } from '@/utils/cloudflare-images.server';
import { getAuth } from '@clerk/react-router/server';

/**
 * API endpoint for uploading images to Cloudflare Images
 * POST /api/upload-image
 */
export async function action(args: ActionFunctionArgs) {
    const { request } = args;

    if (request.method !== 'POST') {
        return data({ error: 'Method not allowed' }, { status: 405 });
    }

    try {
        // Get authenticated user from Clerk
        const auth = await getAuth(args);
        const userId = auth.userId;

        if (!userId) {
            return data({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return data({ error: 'No file provided' }, { status: 400 });
        }

        // Upload to Cloudflare Images (accepts File directly, no base64 needed)
        const imageUrl = await uploadToCloudflareImages(file, {
            userId,
            uploadedAt: new Date().toISOString()
        });

        return data({ success: true, imageUrl });
    } catch (error) {
        console.error('Error uploading image:', error);
        return data({ error: 'Failed to upload image' }, { status: 500 });
    }
}
