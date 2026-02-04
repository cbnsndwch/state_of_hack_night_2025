import { data, type ActionFunctionArgs } from 'react-router';
import { storeWebhook } from '@/lib/db/luma-webhooks.server';
import {
    createPendingUser,
    getPendingUserByEmail,
    updatePendingUser
} from '@/lib/db/pending-users.server';
import { createProfile, getProfileByLumaEmail } from '@/lib/db/profiles.server';

// Luma webhook types from their documentation
interface LumaWebhookPayload {
    type: string;
    data: Record<string, unknown>;
}

// Calendar person subscribed webhook
interface CalendarPersonSubscribedData {
    api_id: string; // attendee ID
    email: string;
    name: string;
    avatar_url?: string;
    created_at: string;
}

// Guest updated webhook
interface GuestUpdatedData {
    api_id: string;
    user_api_id: string;
    event_api_id: string;
    approval_status:
        | 'approved'
        | 'declined'
        | 'pending_approval'
        | 'invited'
        | 'waitlist'
        | 'session';
    email: string;
    name: string;
    avatar_url?: string;
    created_at: string;
    check_in_status?: 'checked_in' | 'not_checked_in';
    check_in_at?: string;
    registration_answers?: Record<string, unknown>[];
}

/**
 * Verify Luma webhook signature (if provided)
 * Luma may provide webhook signatures for security
 */
function verifyWebhookSignature(signature?: string): boolean {
    // TODO: Implement signature verification if Luma provides it
    // For now, we'll trust the webhook (in production, implement proper verification)
    const LUMA_WEBHOOK_SECRET = process.env.LUMA_WEBHOOK_SECRET;
    if (!LUMA_WEBHOOK_SECRET) {
        // If no secret configured, accept all webhooks (development only)
        return true;
    }

    if (!signature) {
        return false;
    }

    // Implement HMAC verification here if Luma provides signatures
    // const expectedSignature = crypto.createHmac('sha256', LUMA_WEBHOOK_SECRET)
    //     .update(payload)
    //     .digest('hex');

    return true; // Placeholder
}

export async function action({ request }: ActionFunctionArgs) {
    try {
        // Only accept POST requests
        if (request.method !== 'POST') {
            return data({ error: 'Method not allowed' }, { status: 405 });
        }

        // Get raw payload for signature verification
        const rawPayload = await request.text();
        let payload: LumaWebhookPayload;

        try {
            payload = JSON.parse(rawPayload);
        } catch {
            return data({ error: 'Invalid JSON payload' }, { status: 400 });
        }

        // Verify signature if provided
        const signature = request.headers.get('x-luma-signature') || undefined;
        if (!verifyWebhookSignature(signature)) {
            return data({ error: 'Invalid signature' }, { status: 401 });
        }

        // Store the raw webhook for audit/debugging
        await storeWebhook({
            type: payload.type,
            payload: payload.data,
            signature
        });

        // Handle different webhook types
        switch (payload.type) {
            case 'calendar.person.subscribed':
                await handleCalendarPersonSubscribed(
                    payload.data as unknown as CalendarPersonSubscribedData
                );
                break;

            case 'guest.updated':
                await handleGuestUpdated(
                    payload.data as unknown as GuestUpdatedData
                );
                break;

            default:
                // Log unknown webhook types for debugging
                console.log(`Received unknown webhook type: ${payload.type}`);
                break;
        }

        return data({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Webhook processing error:', error);
        return data({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * Handle calendar.person.subscribed webhook
 * Creates a pending user when someone subscribes to the Hello Miami calendar
 */
async function handleCalendarPersonSubscribed(
    data: CalendarPersonSubscribedData
) {
    const { api_id, email, name, created_at } = data;

    // Check if user already exists in pending or verified
    const existingPending = await getPendingUserByEmail(email);
    const existingProfile = await getProfileByLumaEmail(email);

    if (existingPending || existingProfile) {
        // User already exists, skip
        return;
    }

    // Create pending user
    await createPendingUser({
        email,
        name,
        lumaAttendeeId: api_id,
        subscribedAt: new Date(created_at)
    });

    console.log(`Created pending user for ${email}`);
}

/**
 * Handle guest.updated webhook
 * Promotes pending users to verified when they're approved
 */
async function handleGuestUpdated(data: GuestUpdatedData) {
    const { email, approval_status, api_id } = data;

    if (approval_status === 'approved') {
        // Check if this user is in pending_users
        const pendingUser = await getPendingUserByEmail(email);

        if (pendingUser) {
            // Mark as approved in pending_users
            await updatePendingUser(email, {
                approvedAt: new Date()
            });

            // Check if profile already exists to avoid duplicates
            const existingProfile = await getProfileByLumaEmail(email);
            if (!existingProfile) {
                // Create the profile with pending verification status
                // clerkUserId is null until they complete the auth flow
                await createProfile({
                    clerkUserId: null,
                    lumaEmail: email,
                    lumaAttendeeId: api_id, // Store their Luma ID
                    verificationStatus: 'pending',
                    bio: null, // Can be populated later
                    streakCount: 0
                });
                console.log(`Created profile for approved user ${email}`);
            } else {
                console.log(
                    `Profile already exists for approved user ${email}`
                );
            }

            console.log(`Approved pending user ${email}`);
        }
    }
}
