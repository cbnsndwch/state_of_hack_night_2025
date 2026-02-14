/**
 * API route for managing demo slots.
 * POST /api/demo-slots - Create a new demo slot booking
 * PUT /api/demo-slots - Update an existing demo slot
 * DELETE /api/demo-slots - Delete a demo slot
 * GET /api/demo-slots?eventId=xxx - Get demo slots for an event
 */

import {
    data,
    type LoaderFunctionArgs,
    type ActionFunctionArgs
} from 'react-router';
import { getProfileByClerkUserId } from '@/lib/db/profiles.server';
import {
    createDemoSlot,
    getDemoSlotsWithMembers,
    getDemoSlots,
    updateDemoSlot,
    deleteDemoSlot,
    getDemoSlotById
} from '@/lib/db/demo-slots.server';
import {
    sendDemoBookingConfirmation,
    notifyOrganizersOfNewDemo,
    sendDemoStatusUpdate
} from '@/lib/notifications/demo-slots.server';

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
                id: slot.id.toString(),
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
                    id: slot.member.id.toString(),
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
            id: slot.id.toString(),
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
 * Action handler - Create, update, or delete demo slot
 */
export async function action({ request }: ActionFunctionArgs) {
    const method = request.method;

    // POST - Create a new demo slot
    if (method === 'POST') {
        try {
            const formData = await request.formData();
            const clerkUserId = formData.get('clerkUserId')?.toString();
            const eventId = formData.get('eventId')?.toString();
            const title = formData.get('title')?.toString();
            const description = formData.get('description')?.toString() || null;
            const requestedTime =
                formData.get('requestedTime')?.toString() || null;
            const durationMinutes = parseInt(
                formData.get('durationMinutes')?.toString() || '5',
                10
            );

            // Validate required fields
            if (!clerkUserId || !eventId || !title) {
                return data(
                    { error: 'Missing required fields' },
                    { status: 400 }
                );
            }

            // Get the profile for this user
            const profile = await getProfileByClerkUserId(clerkUserId);
            if (!profile) {
                return data({ error: 'Profile not found' }, { status: 404 });
            }

            // Create the demo slot
            const demoSlot = await createDemoSlot({
                memberId: profile.id,
                eventId: eventId,
                title,
                description,
                requestedTime,
                durationMinutes,
                status: 'pending',
                confirmedByOrganizer: false
            });

            // Send confirmation email to member (fire and forget - don't block response)
            sendDemoBookingConfirmation(demoSlot).catch(error => {
                console.error(
                    'Failed to send demo booking confirmation:',
                    error
                );
            });

            // Notify organizers of new demo (fire and forget)
            notifyOrganizersOfNewDemo(demoSlot).catch(error => {
                console.error(
                    'Failed to notify organizers of new demo:',
                    error
                );
            });

            return data({
                success: true,
                demoSlot: {
                    id: demoSlot.id.toString(),
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
            return data(
                { error: 'Failed to create demo slot' },
                { status: 500 }
            );
        }
    }

    // PUT - Update an existing demo slot
    if (method === 'PUT') {
        try {
            const formData = await request.formData();
            const demoSlotId = formData.get('demoSlotId')?.toString();
            const clerkUserId = formData.get('clerkUserId')?.toString();
            const title = formData.get('title')?.toString();
            const description = formData.get('description')?.toString();
            const requestedTime = formData.get('requestedTime')?.toString();
            const durationMinutesStr = formData
                .get('durationMinutes')
                ?.toString();
            const status = formData.get('status')?.toString() as
                | 'pending'
                | 'confirmed'
                | 'canceled'
                | undefined;
            const confirmedByOrganizerStr = formData
                .get('confirmedByOrganizer')
                ?.toString();

            // Validate required fields
            if (!demoSlotId || !clerkUserId) {
                return data(
                    { error: 'Missing required fields' },
                    { status: 400 }
                );
            }

            // Get the profile for this user
            const profile = await getProfileByClerkUserId(clerkUserId);
            if (!profile) {
                return data({ error: 'Profile not found' }, { status: 404 });
            }

            // Check if the demo slot exists and belongs to this user or if user is admin
            const existingSlot = await getDemoSlotById(demoSlotId);
            if (!existingSlot) {
                return data({ error: 'Demo slot not found' }, { status: 404 });
            }

            // Only the owner or an admin can update the slot
            const isOwner =
                existingSlot.memberId.toString() === profile.id.toString();
            if (!isOwner && !profile.isAppAdmin) {
                return data({ error: 'Unauthorized' }, { status: 403 });
            }

            // Build update object with only provided fields
            const updateData: {
                title?: string;
                description?: string | null;
                requestedTime?: string | null;
                durationMinutes?: number;
                status?: 'pending' | 'confirmed' | 'canceled';
                confirmedByOrganizer?: boolean;
            } = {};

            if (title !== undefined) updateData.title = title;
            if (description !== undefined) {
                updateData.description = description || null;
            }
            if (requestedTime !== undefined) {
                updateData.requestedTime = requestedTime || null;
            }
            if (durationMinutesStr !== undefined) {
                updateData.durationMinutes = parseInt(durationMinutesStr, 10);
            }
            if (status !== undefined) updateData.status = status;
            if (confirmedByOrganizerStr !== undefined) {
                updateData.confirmedByOrganizer =
                    confirmedByOrganizerStr === 'true';
            }

            // Update the demo slot
            const success = await updateDemoSlot(demoSlotId, updateData);

            if (!success) {
                return data(
                    { error: 'Failed to update demo slot' },
                    { status: 500 }
                );
            }

            // Fetch the updated slot
            const updatedSlot = await getDemoSlotById(demoSlotId);

            // If status was updated to confirmed or canceled, send notification
            if (updatedSlot && status && status !== existingSlot.status) {
                if (status === 'confirmed' || status === 'canceled') {
                    sendDemoStatusUpdate(updatedSlot, status).catch(error => {
                        console.error(
                            'Failed to send demo status update:',
                            error
                        );
                    });
                }
            }

            return data({
                success: true,
                demoSlot: updatedSlot
                    ? {
                          id: updatedSlot.id.toString(),
                          memberId: updatedSlot.memberId.toString(),
                          eventId: updatedSlot.eventId.toString(),
                          title: updatedSlot.title,
                          description: updatedSlot.description,
                          requestedTime: updatedSlot.requestedTime,
                          durationMinutes: updatedSlot.durationMinutes,
                          status: updatedSlot.status,
                          confirmedByOrganizer:
                              updatedSlot.confirmedByOrganizer,
                          createdAt: updatedSlot.createdAt.toISOString(),
                          updatedAt: updatedSlot.updatedAt.toISOString()
                      }
                    : null
            });
        } catch (error) {
            console.error('Error updating demo slot:', error);
            return data(
                { error: 'Failed to update demo slot' },
                { status: 500 }
            );
        }
    }

    // DELETE - Delete a demo slot
    if (method === 'DELETE') {
        try {
            const formData = await request.formData();
            const demoSlotId = formData.get('demoSlotId')?.toString();
            const clerkUserId = formData.get('clerkUserId')?.toString();

            // Validate required fields
            if (!demoSlotId || !clerkUserId) {
                return data(
                    { error: 'Missing required fields' },
                    { status: 400 }
                );
            }

            // Get the profile for this user
            const profile = await getProfileByClerkUserId(clerkUserId);
            if (!profile) {
                return data({ error: 'Profile not found' }, { status: 404 });
            }

            // Check if the demo slot exists and belongs to this user or if user is admin
            const existingSlot = await getDemoSlotById(demoSlotId);
            if (!existingSlot) {
                return data({ error: 'Demo slot not found' }, { status: 404 });
            }

            // Only the owner or an admin can delete the slot
            const isOwner =
                existingSlot.memberId.toString() === profile.id.toString();
            if (!isOwner && !profile.isAppAdmin) {
                return data({ error: 'Unauthorized' }, { status: 403 });
            }

            // Delete the demo slot
            const success = await deleteDemoSlot(demoSlotId);

            if (!success) {
                return data(
                    { error: 'Failed to delete demo slot' },
                    { status: 500 }
                );
            }

            return data({ success: true });
        } catch (error) {
            console.error('Error deleting demo slot:', error);
            return data(
                { error: 'Failed to delete demo slot' },
                { status: 500 }
            );
        }
    }

    return data({ error: 'Method not allowed' }, { status: 405 });
}
