import { data, type ActionFunctionArgs } from 'react-router';
import { uploadToCloudinary } from '@/utils/cloudinary.server';
import { getAuth } from '@clerk/react-router/server';

/**
 * API endpoint for uploading images to Cloudinary
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

        // Convert file to base64 for Cloudinary upload
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

        // Upload to Cloudinary
        const imageUrl = await uploadToCloudinary(base64, userId);

        return data({ success: true, imageUrl });
    } catch (error) {
        console.error('Error uploading image:', error);
        return data({ error: 'Failed to upload image' }, { status: 500 });
    }
}
