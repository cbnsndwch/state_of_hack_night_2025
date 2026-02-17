/**
 * Server-side Cloudflare Images utility for uploading images.
 * Used for project image uploads.
 *
 * Required env vars:
 *   CLOUDFLARE_ACCOUNT_ID  — Cloudflare account ID
 *   CLOUDFLARE_IMAGES_TOKEN — API token with "Cloudflare Images" write permission
 *
 * @see https://developers.cloudflare.com/images/upload-images/upload-via-url/
 */

const CF_IMAGES_BASE = 'https://api.cloudflare.com/client/v4/accounts';

function getConfig() {
    // Strip surrounding quotes if present (some .env parsers might leave them)
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.replace(/^['"]|['"]$/g, '');
    const apiToken = process.env.CLOUDFLARE_IMAGES_TOKEN?.replace(/^['"]|['"]$/g, '');

    if (!accountId || !apiToken) {
        throw new Error(
            'Missing Cloudflare Images configuration. ' +
                'Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_IMAGES_TOKEN env vars.'
        );
    }

    return { accountId, apiToken };
}

interface CloudflareUploadResult {
    result: {
        id: string;
        filename: string;
        uploaded: string;
        variants: string[];
    };
    success: boolean;
    errors: Array<{ code: number; message: string }>;
    messages: Array<{ code: number; message: string }>;
}

/**
 * Upload a file to Cloudflare Images
 * @param file - The File object from the form submission
 * @param metadata - Optional metadata to attach to the image (e.g. userId, projectId)
 * @returns Public delivery URL of the uploaded image
 */
export async function uploadToCloudflareImages(
    file: File,
    metadata?: Record<string, string>
): Promise<string> {
    const { accountId, apiToken } = getConfig();

    const formData = new FormData();
    formData.append('file', file);

    if (metadata) {
        formData.append('metadata', JSON.stringify(metadata));
    }

    const response = await fetch(
        `${CF_IMAGES_BASE}/${accountId}/images/v1`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiToken}`
            },
            body: formData
        }
    );

    if (!response.ok) {
        const text = await response.text();
        console.error('Cloudflare Images upload failed:', response.status, text);
        throw new Error(`Cloudflare upload failed: ${response.status} ${text}`);
    }

    const json = (await response.json()) as CloudflareUploadResult;

    if (!json.success) {
        console.error('Cloudflare Images upload errors:', json.errors);
        const errorMessages = json.errors.map(e => e.message).join(', ');
        throw new Error(`Cloudflare upload failed: ${errorMessages}`);
    }

    // Return the "public" variant — the first variant URL is the default delivery URL
    const deliveryUrl = json.result.variants[0];
    if (!deliveryUrl) {
        throw new Error('Upload succeeded but no delivery URL returned');
    }

    return deliveryUrl;
}

/**
 * Delete an image from Cloudflare Images
 * @param imageId - The Cloudflare Images image ID to delete
 */
export async function deleteFromCloudflareImages(
    imageId: string
): Promise<void> {
    const { accountId, apiToken } = getConfig();

    const response = await fetch(
        `${CF_IMAGES_BASE}/${accountId}/images/v1/${imageId}`,
        {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${apiToken}`
            }
        }
    );

    if (!response.ok) {
        const text = await response.text();
        console.error('Cloudflare Images delete failed:', response.status, text);
        throw new Error('Failed to delete image');
    }
}
