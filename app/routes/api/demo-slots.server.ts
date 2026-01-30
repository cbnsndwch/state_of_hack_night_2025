/**
 * API route for managing demo slots.
 * POST /api/demo-slots - Create a new demo slot booking
 * GET /api/demo-slots?eventId=xxx - Get demo slots for an event
 */

import {
    data,
    type LoaderFunctionArgs,
    type ActionFunctionArgs
} from 'react-router';
import { ObjectId } from 'mongodb';
import { getProfileBySupabaseUserId } from '@/lib/db/profiles.server';
import {
    createDemoSlot,
    getDemoSlotsWithMembers,
    getDemoSlots
} from '@/lib/db/demo-slots.server';

/**
 * GET handler - Fetch demo slots
 */
export async function loader({ request }: LoaderFunctionArgs) {
    try {
        const url = new URL(request.url);
        const eventId = url.searchParams.get('eventId');
        const memberId = url.searchParams.get('memberId');
        const status = url.searchParams.get('status') as
            | 'pending'
            | 'confirmed'
            | 'canceled'
            | null;

        // If we have an event ID, get slots with member info
        if (eventId) {
            const demoSlots = await getDemoSlotsWithMembers({
                eventId,
                status: status ?? undefined
            });

            // Serialize for JSON
            const serialized = demoSlots.map(slot => ({
                id: slot._id.toString(),
                eventId: slot.eventId.toString(),
                title: slot.title,
                description: slot.description,
                requestedTime: slot.requestedTime,
                durationMinutes: slot.durationMinutes,
                status: slot.status,
                confirmedByOrganizer: slot.confirmedByOrganizer,
                createdAt: slot.createdAt.toISOString(),
                updatedAt: slot.updatedAt.toISOString(),
                member: {
                    id: slot.member._id.toString(),
                    lumaEmail: slot.member.lumaEmail,
                    githubUsername: slot.member.githubUsername
                }
            }));

            return data({ demoSlots: serialized });
        }

        // Otherwise, get basic slots
        const demoSlots = await getDemoSlots({
            memberId: memberId ?? undefined,
            status: status ?? undefined
        });

        const serialized = demoSlots.map(slot => ({
            id: slot._id.toString(),
            memberId: slot.memberId.toString(),
            eventId: slot.eventId.toString(),
            title: slot.title,
            description: slot.description,
            requestedTime: slot.requestedTime,
            durationMinutes: slot.durationMinutes,
            status: slot.status,
            confirmedByOrganizer: slot.confirmedByOrganizer,
            createdAt: slot.createdAt.toISOString(),
            updatedAt: slot.updatedAt.toISOString()
        }));

        return data({ demoSlots: serialized });
    } catch (error) {
        console.error('Error fetching demo slots:', error);
        return data({ error: 'Failed to fetch demo slots' }, { status: 500 });
    }
}

/**
 * POST handler - Create a new demo slot booking
 */
export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== 'POST') {
        return data({ error: 'Method not allowed' }, { status: 405 });
    }

    try {
        const formData = await request.formData();
        const supabaseUserId = formData.get('supabaseUserId')?.toString();
        const eventId = formData.get('eventId')?.toString();
        const title = formData.get('title')?.toString();
        const description = formData.get('description')?.toString() || null;
        const requestedTime = formData.get('requestedTime')?.toString() || null;
        const durationMinutes = parseInt(
            formData.get('durationMinutes')?.toString() || '5',
            10
        );

        // Validate required fields
        if (!supabaseUserId || !eventId || !title) {
            return data({ error: 'Missing required fields' }, { status: 400 });
        }

        // Get the profile for this user
        const profile = await getProfileBySupabaseUserId(supabaseUserId);
        if (!profile) {
            return data({ error: 'Profile not found' }, { status: 404 });
        }

        // Validate eventId is a valid ObjectId
        if (!ObjectId.isValid(eventId)) {
            return data({ error: 'Invalid event ID' }, { status: 400 });
        }

        // Create the demo slot
        const demoSlot = await createDemoSlot({
            memberId: profile._id,
            eventId: new ObjectId(eventId),
            title,
            description,
            requestedTime,
            durationMinutes,
            status: 'pending',
            confirmedByOrganizer: false
        });

        return data({
            success: true,
            demoSlot: {
                id: demoSlot._id.toString(),
                memberId: demoSlot.memberId.toString(),
                eventId: demoSlot.eventId.toString(),
                title: demoSlot.title,
                description: demoSlot.description,
                requestedTime: demoSlot.requestedTime,
                durationMinutes: demoSlot.durationMinutes,
                status: demoSlot.status,
                confirmedByOrganizer: demoSlot.confirmedByOrganizer,
                createdAt: demoSlot.createdAt.toISOString(),
                updatedAt: demoSlot.updatedAt.toISOString()
            }
        });
    } catch (error) {
        console.error('Error creating demo slot:', error);
        return data({ error: 'Failed to create demo slot' }, { status: 500 });
    }
}
