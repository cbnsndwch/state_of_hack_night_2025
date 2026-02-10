# Database Setup

This project uses a **hybrid data architecture**:

- **MongoDB** for application data (profiles, projects, badges, attendance, events, surveys)
- **Clerk** for authentication
- **Cloudinary** for file storage (project images)

## MongoDB Collections

### `profiles`
Links to Clerk auth users and stores community-specific data.

```typescript
{
  _id: ObjectId,
  clerkUserId: string | null,  // Links to Clerk user ID
  lumaEmail: string,           // Email used in Luma registration
  verificationStatus: 'pending' | 'verified',
  isAppAdmin: boolean,
  lumaAttendeeId: string | null,
  bio: string | null,
  skills: string[],
  githubUsername: string | null,
  twitterHandle: string | null,
  websiteUrl: string | null,
  role: string | null,
  seekingFunding: boolean,
  openToMentoring: boolean,
  streakCount: number,
  onboardingDismissed: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `clerkUserId` (unique, sparse)
- `lumaEmail` (unique)
- `lumaAttendeeId` (sparse)

### `projects`
Showcase of hacks built by members.

```typescript
{
  _id: ObjectId,
  memberId: ObjectId,          // References profiles._id
  title: string,
  description: string | null,
  tags: string[],
  imageUrls: string[],         // Cloudinary URLs
  githubUrl: string | null,
  publicUrl: string | null,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `memberId`
- `createdAt` (descending)
- `tags` (multikey)

### `badges`
Definitions for ASCII badges.

```typescript
{
  _id: ObjectId,
  name: string,
  iconAscii: string,
  criteria: string,
  createdAt: Date
}
```

### `member_badges`
Assignment of badges to members.

```typescript
{
  _id: ObjectId,
  memberId: ObjectId,          // References profiles._id
  badgeId: ObjectId,           // References badges._id
  awardedAt: Date
}
```

**Indexes:**
- `memberId, badgeId` (unique compound)

### `attendance`
Tracks event participation.

```typescript
{
  _id: ObjectId,
  memberId: ObjectId,          // References profiles._id
  lumaEventId: string,
  status: 'registered' | 'checked-in',
  checkedInAt: Date | null,
  createdAt: Date
}
```

**Indexes:**
- `memberId, lumaEventId` (unique compound)
- `lumaEventId`

### `events`
Synced events from Luma calendar.

```typescript
{
  _id: ObjectId,
  lumaEventId: string,         // Luma event API ID
  name: string,
  description: string | null,
  coverUrl: string | null,
  url: string,
  startAt: Date,
  endAt: Date | null,
  timezone: string,
  location: {
    type: string,
    name: string | null,
    address: string | null,
    lat: number | null,
    lng: number | null
  } | null,
  stats: {
    registered: number,
    checkedIn: number
  },
  isCanceled: boolean,
  lastSyncedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `lumaEventId` (unique)
- `startAt` (descending)

### `surveys`
Survey definitions and questions.

```typescript
{
  _id: ObjectId,
  slug: string,               // e.g., "onboarding-2026"
  title: string,
  description: string,
  type: 'onboarding' | 'annual' | 'event',
  isActive: boolean,
  questions: SurveyQuestion[],
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `slug` (unique)
- `type`

### `survey_responses`
Member responses to surveys.

```typescript
{
  _id: ObjectId,
  surveyId: ObjectId,         // References surveys._id
  memberId: ObjectId,         // References profiles._id
  responses: Record<string, SurveyAnswer>,
  isComplete: boolean,
  submittedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `surveyId, memberId` (unique compound)
- `surveyId`

### `demo_slots`
Demo presentations scheduled for hack nights.

```typescript
{
  _id: ObjectId,
  memberId: ObjectId,         // References profiles._id
  eventId: ObjectId,          // References events._id
  title: string,
  description: string | null,
  requestedTime: string | null,
  durationMinutes: number,
  status: 'pending' | 'confirmed' | 'canceled',
  confirmedByOrganizer: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `memberId`
- `eventId`

### `pending_users`
Users who subscribed to calendar but not yet approved.

```typescript
{
  _id: ObjectId,
  email: string,
  name: string,
  lumaAttendeeId: string,
  subscribedAt: Date,
  approvedAt: Date | null,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `email` (unique)
- `lumaAttendeeId`

### `luma_webhooks`
Raw webhook data for audit/debugging.

```typescript
{
  _id: ObjectId,
  type: string,
  payload: Record<string, unknown>,
  signature?: string,
  receivedAt: Date
}
```

**Indexes:**
- `type`
- `receivedAt` (descending)

## Setup Instructions

### 1. MongoDB

You can use either:
- **MongoDB Atlas** (recommended for production)
- **Local MongoDB** (for development)

Set the connection string in your environment:

```bash
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=hello_miami
```

### 2. Create Indexes

Run this script to create the recommended indexes:

```javascript
// Connect to your MongoDB instance and run:
use hello_miami

// profiles
db.profiles.createIndex({ clerkUserId: 1 }, { unique: true, sparse: true })
db.profiles.createIndex({ lumaEmail: 1 }, { unique: true })
db.profiles.createIndex({ lumaAttendeeId: 1 }, { sparse: true })

// projects
db.projects.createIndex({ memberId: 1 })
db.projects.createIndex({ createdAt: -1 })
db.projects.createIndex({ tags: 1 })

// member_badges
db.member_badges.createIndex({ memberId: 1, badgeId: 1 }, { unique: true })

// attendance
db.attendance.createIndex({ memberId: 1, lumaEventId: 1 }, { unique: true })
db.attendance.createIndex({ lumaEventId: 1 })

// events
db.events.createIndex({ lumaEventId: 1 }, { unique: true })
db.events.createIndex({ startAt: -1 })

// surveys
db.surveys.createIndex({ slug: 1 }, { unique: true })
db.surveys.createIndex({ type: 1 })

// survey_responses
db.survey_responses.createIndex({ surveyId: 1, memberId: 1 }, { unique: true })
db.survey_responses.createIndex({ surveyId: 1 })

// demo_slots
db.demo_slots.createIndex({ memberId: 1 })
db.demo_slots.createIndex({ eventId: 1 })

// pending_users
db.pending_users.createIndex({ email: 1 }, { unique: true })
db.pending_users.createIndex({ lumaAttendeeId: 1 })

// luma_webhooks
db.luma_webhooks.createIndex({ type: 1 })
db.luma_webhooks.createIndex({ receivedAt: -1 })
```

### 3. Clerk (Authentication)

Clerk is used for user authentication (GitHub OAuth).

Set up your Clerk application at https://clerk.com and add the following environment variables:

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### 4. Cloudinary (File Storage)

Cloudinary is used for storing project images.

Set up your Cloudinary account at https://cloudinary.com and add:

```bash
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
```

## Development

The MongoDB connection is handled in `app/utils/mongodb.server.ts`. The `.server.ts` suffix ensures this code only runs on the server.

Data access functions are in `app/lib/db/`:
- `profiles.server.ts` - Profile CRUD
- `projects.server.ts` - Project CRUD
- `badges.server.ts` - Badge management
- `attendance.server.ts` - Event attendance
- `events.server.ts` - Event management
- `surveys.server.ts` - Survey management
- `survey-responses.server.ts` - Survey response handling
- `demo-slots.server.ts` - Demo slot management
- `pending-users.server.ts` - Pending user approvals
- `luma-webhooks.server.ts` - Webhook logging
