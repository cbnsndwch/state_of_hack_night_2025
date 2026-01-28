# Database Setup

This project uses a **hybrid data architecture**:

- **MongoDB** for application data (profiles, projects, badges, attendance)
- **Supabase** for authentication and file storage only

## MongoDB Collections

### `profiles`
Links to Supabase auth users and stores community-specific data.

```typescript
{
  _id: ObjectId,
  supabaseUserId: string,      // Links to Supabase auth.users.id
  githubUid: string | null,
  lumaAttendeeId: string | null,
  bio: string | null,
  streakCount: number,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `supabaseUserId` (unique)
- `githubUid` (sparse)

### `projects`
Showcase of hacks built by members.

```typescript
{
  _id: ObjectId,
  memberId: ObjectId,          // References profiles._id
  title: string,
  description: string | null,
  tags: string[],
  imageUrls: string[],         // Supabase Storage URLs
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
db.profiles.createIndex({ supabaseUserId: 1 }, { unique: true })
db.profiles.createIndex({ githubUid: 1 }, { sparse: true })

// projects
db.projects.createIndex({ memberId: 1 })
db.projects.createIndex({ createdAt: -1 })
db.projects.createIndex({ tags: 1 })

// member_badges
db.member_badges.createIndex({ memberId: 1, badgeId: 1 }, { unique: true })

// attendance
db.attendance.createIndex({ memberId: 1, lumaEventId: 1 }, { unique: true })
db.attendance.createIndex({ lumaEventId: 1 })
```

### 3. Supabase (Auth & Storage Only)

Supabase is used ONLY for:
- **Authentication** (GitHub OAuth)
- **File Storage** (project images)

Apply the storage migration in `supabase/migrations/` to set up the storage bucket and RLS policies.

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Development

The MongoDB connection is handled in `app/utils/mongodb.server.ts`. The `.server.ts` suffix ensures this code only runs on the server.

Data access functions are in `app/lib/db/`:
- `profiles.server.ts` - Profile CRUD
- `projects.server.ts` - Project CRUD
- `badges.server.ts` - Badge management
- `attendance.server.ts` - Event attendance
