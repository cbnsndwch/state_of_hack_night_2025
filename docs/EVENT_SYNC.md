# Event Sync Documentation

## Overview

The event sync system automatically syncs upcoming events from the Luma calendar to the MongoDB database. This allows the Hello Miami portal to display events without making real-time API calls to Luma.

## Architecture

### Components

1. **Luma API Client** (`app/utils/luma-api.server.ts`)
   - `listCalendarEvents()` - Fetches events from Luma with pagination support
   - `fetchAllUpcomingEvents()` - Convenience function that handles pagination automatically

2. **Event Database Operations** (`app/lib/db/events.server.ts`)
   - `getEvents()` - Retrieves events with filtering options
   - `getEventById()` - Get event by MongoDB ID
   - `getEventByLumaId()` - Get event by Luma event ID
   - `upsertEvent()` - Create or update event (uses Luma event ID as unique key)

3. **Event Sync Service** (`app/lib/services/event-sync.server.ts`)
   - `syncUpcomingEvents()` - Main sync function that fetches and upserts all upcoming events
   - `syncSingleEvent()` - Sync a single event by Luma ID

4. **Sync API Endpoint** (`app/routes/api/sync-events.ts`)
   - `POST /api/sync-events` - Triggers event sync

### MongoDB Schema

```typescript
interface Event {
    _id: ObjectId;
    lumaEventId: string;           // Luma API ID (e.g., "evt-xxxxxxxxxxxxx")
    name: string;
    description: string | null;
    coverUrl: string | null;
    url: string;                   // lu.ma URL
    startAt: Date;
    endAt: Date | null;
    timezone: string;
    location: {
        type: string;              // "in_person", "online", "tbd"
        name: string | null;       // Venue name
        address: string | null;
        lat: number | null;
        lng: number | null;
    } | null;
    stats: {
        registered: number;        // Number of RSVPs
        checkedIn: number;         // Number of check-ins
    };
    isCanceled: boolean;
    lastSyncedAt: Date;            // When this event was last synced
    createdAt: Date;
    updatedAt: Date;
}
```

## Usage

### Manual Sync

You can manually trigger a sync by sending a POST request:

```bash
curl -X POST http://localhost:5173/api/sync-events
```

Response:
```json
{
  "success": true,
  "message": "Successfully synced 8 events",
  "synced": 8
}
```

### Programmatic Sync

```typescript
import { syncUpcomingEvents } from '@/lib/services/event-sync.server';

const result = await syncUpcomingEvents();
console.log(`Synced ${result.synced} events`);
if (result.errors.length > 0) {
    console.error('Errors:', result.errors);
}
```

### Querying Events

```typescript
import { getEvents } from '@/lib/db/events.server';

// Get all upcoming events
const upcoming = await getEvents({ upcomingOnly: true });

// Get past events, sorted descending
const past = await getEvents({ 
    pastOnly: true, 
    sortOrder: -1,
    limit: 10 
});

// Get specific event by Luma ID
import { getEventByLumaId } from '@/lib/db/events.server';
const event = await getEventByLumaId('evt-abc123');
```

## Automation

### Recommended Setup

For production, you should set up a scheduled job to sync events periodically:

#### Option 1: Vercel Cron Jobs

If deploying to Vercel, add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/sync-events",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

This will sync events every 6 hours.

#### Option 2: External Cron Service

Use a service like [cron-job.org](https://cron-job.org) or [EasyCron](https://www.easycron.com) to send POST requests to your sync endpoint:

```
POST https://yourdomain.com/api/sync-events
Schedule: 0 */6 * * * (every 6 hours)
```

#### Option 3: GitHub Actions

Create `.github/workflows/sync-events.yml`:

```yaml
name: Sync Events
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:        # Allow manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger sync
        run: |
          curl -X POST ${{ secrets.SITE_URL }}/api/sync-events
```

## Environment Variables

Make sure these are set:

```env
LUMA_API_KEY=your_luma_api_key_here
MONGODB_URI=mongodb://...
MONGODB_DB_NAME=hello_miami
```

## Webhook Alternative

Instead of polling with cron, you can also use Luma webhooks to sync events when they're created or updated:

1. Register webhook endpoints in Luma dashboard for:
   - `event.created`
   - `event.updated`
   - `event.canceled`

2. Create webhook handler in `app/routes/api/webhooks/luma-events.ts`

3. Use `syncSingleEvent()` to sync the specific event from the webhook payload

This is more real-time but requires handling webhook signatures and edge cases.

## Troubleshooting

### Sync fails with "LUMA_API_KEY not set"

Make sure your `.env` file has the API key:
```
LUMA_API_KEY=luma_sk_...
```

### Events not showing up after sync

Check the sync response for errors:
```bash
curl -X POST http://localhost:5173/api/sync-events
```

Look for:
- Network errors (can't reach Luma API)
- Authentication errors (invalid API key)
- Database errors (MongoDB connection issues)

### Duplicate events

The sync uses `upsertEvent()` which automatically deduplicates based on `lumaEventId`. If you're seeing duplicates, check that the Luma event ID is being set correctly.

## Future Enhancements

- [ ] Add support for syncing past events (for historical data)
- [ ] Implement incremental sync (only fetch events updated since last sync)
- [ ] Add webhook-based real-time sync
- [ ] Cache event data with TTL for faster page loads
- [ ] Add event notification system when new events are added
