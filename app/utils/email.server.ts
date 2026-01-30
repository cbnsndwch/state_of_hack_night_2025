/**
 * Email utility using Resend
 * Server-side only
 */

import { Resend } from 'resend';

let resendClient: Resend | null = null;

/**
 * Get or create Resend client instance
 */
function getResendClient(): Resend {
    if (!resendClient) {
        const apiKey = process.env.RESEND_API_KEY;

        if (!apiKey) {
            throw new Error(
                'RESEND_API_KEY is not set. Please add it to your .env file.'
            );
        }

        resendClient = new Resend(apiKey);
    }

    return resendClient;
}

/**
 * Send an email using Resend
 */
export async function sendEmail({
    to,
    subject,
    html,
    from = 'hello_miami <noreply@hellomiami.community>'
}: {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
}): Promise<{ success: boolean; error?: string }> {
    try {
        const resend = getResendClient();

        const { data, error } = await resend.emails.send({
            from,
            to,
            subject,
            html
        });

        if (error) {
            console.error('Email send error:', error);
            return { success: false, error: error.message };
        }

        console.log('Email sent successfully:', data);
        return { success: true };
    } catch (error) {
        console.error('Failed to send email:', error);
        return {
            success: false,
            error:
                error instanceof Error ? error.message : 'Unknown email error'
        };
    }
}

/**
 * Email template: Demo slot booking confirmation (for member)
 */
export function generateDemoBookingConfirmationEmail({
    memberName,
    demoTitle,
    eventName,
    eventDate,
    requestedTime,
    durationMinutes
}: {
    memberName: string;
    demoTitle: string;
    eventName: string;
    eventDate: string;
    requestedTime?: string | null;
    durationMinutes: number;
}): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #0a0a0a;
            color: #22c55e;
            padding: 20px;
            text-align: center;
            border-radius: 4px;
            margin-bottom: 20px;
        }
        .content {
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 4px;
            border: 2px solid #22c55e;
        }
        .demo-details {
            background-color: white;
            padding: 15px;
            margin: 20px 0;
            border-left: 4px solid #22c55e;
        }
        .demo-details p {
            margin: 8px 0;
        }
        .footer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 0.9em;
            color: #666;
        }
        .button {
            display: inline-block;
            background-color: #22c55e;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>hello_miami</h1>
        <p>Demo Slot Confirmed! 🎉</p>
    </div>
    
    <div class="content">
        <p>Hey ${memberName},</p>
        
        <p>Your demo slot request has been received! Our organizers will review it and confirm the final time slot.</p>
        
        <div class="demo-details">
            <p><strong>Demo Title:</strong> ${demoTitle}</p>
            <p><strong>Event:</strong> ${eventName}</p>
            <p><strong>Date:</strong> ${eventDate}</p>
            ${requestedTime ? `<p><strong>Requested Time:</strong> ${requestedTime}</p>` : ''}
            <p><strong>Duration:</strong> ${durationMinutes} minutes</p>
            <p><strong>Status:</strong> Pending Organizer Confirmation</p>
        </div>
        
        <p>You'll receive another email once an organizer confirms your demo slot. You can also check your demo status anytime on your dashboard.</p>
        
        <p style="text-align: center;">
            <a href="https://hellomiami.community/dashboard" class="button">View My Dashboard</a>
        </p>
        
        <p><strong>Demo Tips:</strong></p>
        <ul>
            <li>Keep your demo concise and focused</li>
            <li>Show, don't just tell</li>
            <li>Prepare for Q&A time</li>
            <li>Share what you learned along the way</li>
        </ul>
    </div>
    
    <div class="footer">
        <p>hello_miami - Miami's no-ego builder community</p>
        <p>The DOCK (Wynwood) • Tuesdays | Moonlighter FabLab (South Beach) • Thursdays</p>
    </div>
</body>
</html>
    `.trim();
}

/**
 * Email template: Demo slot status update (confirmed/canceled)
 */
export function generateDemoStatusUpdateEmail({
    memberName,
    demoTitle,
    eventName,
    eventDate,
    status,
    requestedTime,
    durationMinutes
}: {
    memberName: string;
    demoTitle: string;
    eventName: string;
    eventDate: string;
    status: 'confirmed' | 'canceled';
    requestedTime?: string | null;
    durationMinutes: number;
}): string {
    const isConfirmed = status === 'confirmed';
    const statusColor = isConfirmed ? '#22c55e' : '#ef4444';
    const statusEmoji = isConfirmed ? '✅' : '❌';
    const statusText = isConfirmed ? 'Confirmed' : 'Canceled';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #0a0a0a;
            color: ${statusColor};
            padding: 20px;
            text-align: center;
            border-radius: 4px;
            margin-bottom: 20px;
        }
        .content {
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 4px;
            border: 2px solid ${statusColor};
        }
        .demo-details {
            background-color: white;
            padding: 15px;
            margin: 20px 0;
            border-left: 4px solid ${statusColor};
        }
        .demo-details p {
            margin: 8px 0;
        }
        .footer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 0.9em;
            color: #666;
        }
        .button {
            display: inline-block;
            background-color: #22c55e;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>hello_miami</h1>
        <p>Demo Slot ${statusText} ${statusEmoji}</p>
    </div>
    
    <div class="content">
        <p>Hey ${memberName},</p>
        
        ${
            isConfirmed
                ? '<p>Great news! Your demo slot has been confirmed by an organizer.</p>'
                : '<p>Your demo slot has been canceled. If you have questions, feel free to reach out to the organizers at the next event.</p>'
        }
        
        <div class="demo-details">
            <p><strong>Demo Title:</strong> ${demoTitle}</p>
            <p><strong>Event:</strong> ${eventName}</p>
            <p><strong>Date:</strong> ${eventDate}</p>
            ${requestedTime ? `<p><strong>Time:</strong> ${requestedTime}</p>` : ''}
            <p><strong>Duration:</strong> ${durationMinutes} minutes</p>
            <p><strong>Status:</strong> <span style="color: ${statusColor};">${statusText}</span></p>
        </div>
        
        ${
            isConfirmed
                ? `
        <p><strong>Next Steps:</strong></p>
        <ul>
            <li>Make sure to arrive on time for your demo</li>
            <li>Test any equipment/projector setup beforehand</li>
            <li>Have a backup plan (screenshots, recording) in case of tech issues</li>
            <li>Bring enthusiasm and be ready to answer questions!</li>
        </ul>
        
        <p>See you at the event! 🚀</p>
        `
                : `
        <p>You can still attend the event and book a demo for a future hack night.</p>
        `
        }
        
        <p style="text-align: center;">
            <a href="https://hellomiami.community/dashboard" class="button">View Dashboard</a>
        </p>
    </div>
    
    <div class="footer">
        <p>hello_miami - Miami's no-ego builder community</p>
        <p>The DOCK (Wynwood) • Tuesdays | Moonlighter FabLab (South Beach) • Thursdays</p>
    </div>
</body>
</html>
    `.trim();
}

/**
 * Email template: New demo booking notification (for organizers)
 */
export function generateNewDemoNotificationEmail({
    organizerName,
    memberName,
    demoTitle,
    demoDescription,
    eventName,
    eventDate,
    requestedTime,
    durationMinutes
}: {
    organizerName: string;
    memberName: string;
    demoTitle: string;
    demoDescription?: string | null;
    eventName: string;
    eventDate: string;
    requestedTime?: string | null;
    durationMinutes: number;
}): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #0a0a0a;
            color: #22c55e;
            padding: 20px;
            text-align: center;
            border-radius: 4px;
            margin-bottom: 20px;
        }
        .content {
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 4px;
            border: 2px solid #22c55e;
        }
        .demo-details {
            background-color: white;
            padding: 15px;
            margin: 20px 0;
            border-left: 4px solid #22c55e;
        }
        .demo-details p {
            margin: 8px 0;
        }
        .footer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 0.9em;
            color: #666;
        }
        .button {
            display: inline-block;
            background-color: #22c55e;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>hello_miami</h1>
        <p>New Demo Booking 📝</p>
    </div>
    
    <div class="content">
        <p>Hey ${organizerName},</p>
        
        <p>A new demo slot has been requested and needs your review.</p>
        
        <div class="demo-details">
            <p><strong>Member:</strong> ${memberName}</p>
            <p><strong>Demo Title:</strong> ${demoTitle}</p>
            ${demoDescription ? `<p><strong>Description:</strong> ${demoDescription}</p>` : ''}
            <p><strong>Event:</strong> ${eventName}</p>
            <p><strong>Date:</strong> ${eventDate}</p>
            ${requestedTime ? `<p><strong>Requested Time:</strong> ${requestedTime}</p>` : ''}
            <p><strong>Duration:</strong> ${durationMinutes} minutes</p>
        </div>
        
        <p>Please review and confirm this demo slot in the admin dashboard.</p>
        
        <p style="text-align: center;">
            <a href="https://hellomiami.community/admin/demo-slots" class="button">Review Demo Slots</a>
        </p>
    </div>
    
    <div class="footer">
        <p>hello_miami - Organizer Tools</p>
    </div>
</body>
</html>
    `.trim();
}
