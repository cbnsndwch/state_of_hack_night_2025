/**
 * Demo slot notification functions
 * Handles email notifications for demo booking events
 */

import { format } from 'date-fns';
import {
    sendEmail,
    generateDemoBookingConfirmationEmail,
    generateDemoStatusUpdateEmail,
    generateNewDemoNotificationEmail
} from '@/utils/email.server';
import { getProfileById } from '@/lib/db/profiles.server';
import { getEventById } from '@/lib/db/events.server';
import type { DemoSlot } from '@/types/adapters';

/**
 * Get list of organizer emails from environment variable
 */
function getOrganizerEmails(): string[] {
    const emails = process.env.APP_ADMIN_EMAILS || '';
    return emails
        .split(',')
        .map(email => email.trim())
        .filter(Boolean);
}

/**
 * Send confirmation email to member after booking demo slot
 */
export async function sendDemoBookingConfirmation(
    demoSlot: DemoSlot
): Promise<{ success: boolean; error?: string }> {
    try {
        // Get member and event details
        const member = await getProfileById(demoSlot.memberId.toString());
        const event = await getEventById(demoSlot.eventId.toString());

        if (!member || !event) {
            return {
                success: false,
                error: 'Member or event not found'
            };
        }

        // Format event date
        const eventDate = event.startAt
            ? format(new Date(event.startAt), 'EEEE, MMMM d, yyyy')
            : 'Date TBD';

        // Get member display name
        const memberName =
            member.githubUsername || member.lumaEmail.split('@')[0] || 'Member';

        // Generate email HTML
        const html = generateDemoBookingConfirmationEmail({
            memberName,
            demoTitle: demoSlot.title,
            eventName: event.name || 'Hack Night',
            eventDate,
            requestedTime: demoSlot.requestedTime,
            durationMinutes: demoSlot.durationMinutes || 5
        });

        // Send email
        return await sendEmail({
            to: member.lumaEmail,
            subject: `Demo Slot Received: ${demoSlot.title}`,
            html
        });
    } catch (error) {
        console.error('Failed to send demo booking confirmation:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Send status update email to member when demo is confirmed or canceled
 */
export async function sendDemoStatusUpdate(
    demoSlot: DemoSlot,
    status: 'confirmed' | 'canceled'
): Promise<{ success: boolean; error?: string }> {
    try {
        // Get member and event details
        const member = await getProfileById(demoSlot.memberId.toString());
        const event = await getEventById(demoSlot.eventId.toString());

        if (!member || !event) {
            return {
                success: false,
                error: 'Member or event not found'
            };
        }

        // Format event date
        const eventDate = event.startAt
            ? format(new Date(event.startAt), 'EEEE, MMMM d, yyyy')
            : 'Date TBD';

        // Get member display name
        const memberName =
            member.githubUsername || member.lumaEmail.split('@')[0] || 'Member';

        // Generate email HTML
        const html = generateDemoStatusUpdateEmail({
            memberName,
            demoTitle: demoSlot.title,
            eventName: event.name || 'Hack Night',
            eventDate,
            status,
            requestedTime: demoSlot.requestedTime,
            durationMinutes: demoSlot.durationMinutes || 5
        });

        // Send email
        const statusText = status === 'confirmed' ? 'Confirmed' : 'Canceled';
        return await sendEmail({
            to: member.lumaEmail,
            subject: `Demo Slot ${statusText}: ${demoSlot.title}`,
            html
        });
    } catch (error) {
        console.error('Failed to send demo status update:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Notify organizers of new demo booking
 */
export async function notifyOrganizersOfNewDemo(
    demoSlot: DemoSlot
): Promise<{ success: boolean; error?: string }> {
    try {
        const organizerEmails = getOrganizerEmails();

        if (organizerEmails.length === 0) {
            console.warn('No organizer emails configured');
            return {
                success: false,
                error: 'No organizer emails configured'
            };
        }

        // Get member and event details
        const member = await getProfileById(demoSlot.memberId.toString());
        const event = await getEventById(demoSlot.eventId.toString());

        if (!member || !event) {
            return {
                success: false,
                error: 'Member or event not found'
            };
        }

        // Format event date
        const eventDate = event.startAt
            ? format(new Date(event.startAt), 'EEEE, MMMM d, yyyy')
            : 'Date TBD';

        // Get member display name
        const memberName =
            member.githubUsername || member.lumaEmail.split('@')[0] || 'Member';

        // Send to each organizer
        const results = await Promise.all(
            organizerEmails.map(email => {
                const html = generateNewDemoNotificationEmail({
                    organizerName: 'Organizer',
                    memberName,
                    demoTitle: demoSlot.title,
                    demoDescription: demoSlot.description,
                    eventName: event.name || 'Hack Night',
                    eventDate,
                    requestedTime: demoSlot.requestedTime,
                    durationMinutes: demoSlot.durationMinutes || 5
                });

                return sendEmail({
                    to: email,
                    subject: `New Demo Booking: ${demoSlot.title}`,
                    html
                });
            })
        );

        // Check if all emails were sent successfully
        const allSuccess = results.every(result => result.success);

        if (!allSuccess) {
            const failedCount = results.filter(r => !r.success).length;
            return {
                success: false,
                error: `Failed to send ${failedCount} of ${results.length} organizer notifications`
            };
        }

        return { success: true };
    } catch (error) {
        console.error('Failed to notify organizers:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
