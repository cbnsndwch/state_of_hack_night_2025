import { v2 as cloudinary } from 'cloudinary';

/**
 * Server-side Cloudinary utility for uploading images.
 * Used for project image uploads.
 */

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload a file to Cloudinary
 * @param fileData - File buffer or base64 string
 * @param userId - User ID for organizing uploads
 * @returns Public URL of the uploaded image
 */
export async function uploadToCloudinary(
    fileData: string,
    userId: string
): Promise<string> {
    try {
        const result = await cloudinary.uploader.upload(fileData, {
            folder: `hello_miami/projects/${userId}`,
            resource_type: 'image'
        });

        return result.secure_url;
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw new Error('Failed to upload image');
    }
}

/**
 * Delete a file from Cloudinary
 * @param publicId - Public ID of the image to delete
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        throw new Error('Failed to delete image');
    }
}
