# Email Notifications System

## Overview

The hello_miami platform includes an email notification system for demo slot bookings using [Resend](https://resend.com/).

## Features

### Demo Slot Notifications

1. **Member Booking Confirmation**
   - Sent when a member books a demo slot
   - Includes demo details, event info, and tips
   - Confirms the booking is pending organizer approval

2. **Status Update Notifications**
   - Sent when organizers confirm or cancel a demo slot
   - Includes updated status and next steps
   - Different styling for confirmed vs. canceled

3. **Organizer Notifications**
   - Sent to all organizers when a new demo is booked
   - Includes member info and demo details
   - Link to admin dashboard for quick review

## Setup

### 1. Get a Resend API Key

1. Sign up at [resend.com](https://resend.com/)
2. Create a new API key in your dashboard
3. Add the API key to your `.env` file:

```bash
RESEND_API_KEY=re_your_resend_api_key
```

### 2. Configure Organizer Emails

Organizer notification emails are sent to all addresses listed in `APP_ADMIN_EMAILS`:

```bash
APP_ADMIN_EMAILS=organizer1@example.com,organizer2@example.com,organizer3@example.com
```

### 3. Domain Configuration (Production)

For production use, you'll need to:

1. Add and verify your domain in Resend dashboard
2. Update the `from` address in `app/utils/email.server.ts`:

```typescript
from = 'hello_miami <noreply@hellomiami.community>'
```

During development, Resend allows sending to verified email addresses without domain verification.

## Technical Details

### Architecture

- **Email Utility**: `app/utils/email.server.ts`
  - Resend client initialization
  - Email sending function
  - HTML email templates

- **Demo Slot Notifications**: `app/lib/notifications/demo-slots.server.ts`
  - `sendDemoBookingConfirmation()` - Member booking confirmation
  - `sendDemoStatusUpdate()` - Status change notifications
  - `notifyOrganizersOfNewDemo()` - Organizer alerts

### Integration Points

Notifications are triggered at these locations:

1. **POST /api/demo-slots** (`app/routes/api/demo-slots.server.ts`)
   - Sends booking confirmation to member
   - Notifies organizers of new demo

2. **PUT /api/demo-slots** (`app/routes/api/demo-slots.server.ts`)
   - Sends status update when status changes to confirmed/canceled

3. **POST /admin/demo-slots** (`app/routes/admin.demo-slots.tsx`)
   - Sends status update when admin confirms/cancels

### Fire-and-Forget Pattern

All email notifications use a fire-and-forget pattern:

```typescript
sendDemoBookingConfirmation(demoSlot).catch(error => {
    console.error('Failed to send email:', error);
});
```

This ensures that:
- API responses are not delayed by email sending
- Email failures don't block core functionality
- Errors are logged for debugging

## Email Templates

All email templates follow the hello_miami design system:

- **Colors**: Black background (`#0a0a0a`), primary green (`#22c55e`)
- **Typography**: System fonts for readability
- **Layout**: Centered, mobile-responsive design
- **Branding**: hello_miami header with status indicator

### Template Customization

To customize email templates, edit the generator functions in `app/utils/email.server.ts`:

- `generateDemoBookingConfirmationEmail()`
- `generateDemoStatusUpdateEmail()`
- `generateNewDemoNotificationEmail()`

## Testing

### Development Testing

During development, you can test emails by:

1. Setting up a Resend account (free tier: 100 emails/day)
2. Using your own email for testing
3. Checking Resend dashboard for sent emails

### Email Preview

To preview email templates without sending:

```typescript
import { generateDemoBookingConfirmationEmail } from '@/utils/email.server';

const html = generateDemoBookingConfirmationEmail({
    memberName: 'Test User',
    demoTitle: 'My Awesome Project',
    eventName: 'Hack Night - The DOCK',
    eventDate: 'Tuesday, January 30, 2026',
    requestedTime: '8:30 PM',
    durationMinutes: 5
});

console.log(html); // Copy to HTML file to preview
```

## Troubleshooting

### Emails Not Sending

1. **Check API Key**
   ```bash
   # Verify RESEND_API_KEY is set
   echo $RESEND_API_KEY
   ```

2. **Check Server Logs**
   - Look for "Email send error:" messages
   - Verify MongoDB connection for profile/event data

3. **Verify Resend Dashboard**
   - Check for rate limits
   - View sent/failed emails
   - Check API key permissions

### Email Delivery Issues

1. **Spam Folder**: Check recipient spam folders
2. **Domain Verification**: Ensure domain is verified in production
3. **Email Format**: Test with different email clients

## Future Enhancements

Potential improvements to the notification system:

- [ ] Email preferences (opt-in/opt-out)
- [ ] Digest emails (daily/weekly summary)
- [ ] SMS notifications via Twilio
- [ ] Push notifications for mobile
- [ ] Reminder emails before demo time
- [ ] Slack integration for organizers
- [ ] Email tracking and analytics

## Resources

- [Resend Documentation](https://resend.com/docs)
- [Resend React Email](https://react.email/) - For advanced templates
- [Email Testing Tools](https://www.mail-tester.com/)
