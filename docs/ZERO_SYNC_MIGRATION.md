# Zero Sync Migration Plan

**Target**: Migrate from MongoDB to PostgreSQL + Zero Sync for realtime UI capabilities

**Date**: February 10, 2026

---

## Executive Summary

Zero Sync is a sync engine that maintains a local SQLite replica of PostgreSQL data on each client, enabling:

- **Instant UI**: Reads/writes to local storage (effectively instant)
- **Realtime updates**: Continuous sync keeps all clients updated in realtime
- **Offline support**: Read-only access while offline
- **Simplified development**: Abstracts data plumbing, caching, and consistency

### Architecture Overview

```plain
┌─────────────┐         ┌──────────────┐         ┌────────────┐
│   Clients   │────────▶│  zero-cache  │────────▶│ PostgreSQL │
│  (SQLite)   │◀────────│   (SQLite)   │◀────────│  (Source)  │
└─────────────┘         └──────────────┘         └────────────┘
       │                      │                         │
       │                      │                         │
       └──────────────────────┴─────────────────────────┘
                              │
                     ┌────────▼────────┐
                     │   Your API      │
                     │ (query/mutate)  │
                     └─────────────────┘
```

---

## Phase 1: Infrastructure Setup

### 1.1 PostgreSQL Database Setup

**Tasks**:

- [ ] Set up PostgreSQL 16+ (locally via Docker for dev)
- [ ] Configure logical replication (`wal_level=logical`)
- [ ] Create database and enable necessary extensions
- [ ] Set up connection pooling (pgbouncer for production)

**Docker Compose** (Development):

```yaml
services:
    postgres:
        image: postgres:16-alpine
        environment:
            POSTGRES_DB: hello_miami
            POSTGRES_USER: postgres
            POSTGRES_PASSWORD: password
        ports:
            - '5432:5432'
        command: postgres -c wal_level=logical
        volumes:
            - postgres-data:/var/lib/postgresql/data
```

### 1.2 Install Zero Dependencies

**Tasks**:

- [ ] Install Zero packages: `@rocicorp/zero`
- [ ] Install Postgres adapter: `drizzle-orm` + `drizzle-zero`
    - optionally check out `https://github.com/onejs/on-zero` for CRUD helpers

**Command**:

```bash
pnpm add @rocicorp/zero
pnpm add -D drizzle-orm drizzle-kit drizzle-zero @types/pg pg
```

### 1.3 Zero Cache Setup

**Tasks**:

- [ ] Install zero-cache for development: `npx zero-cache-dev`
- [ ] Configure environment variables:
    - `ZERO_UPSTREAM_DB`: PostgreSQL connection string
    - `ZERO_QUERY_URL`: API endpoint for queries
    - `ZERO_MUTATE_URL`: API endpoint for mutations
    - `ZERO_ADMIN_PASSWORD`: Admin password for inspector

**Example** `.env`:

```bash
ZERO_UPSTREAM_DB="postgresql://postgres:password@localhost:5432/hello_miami"
ZERO_QUERY_URL="http://localhost:5173/api/zero/query"
ZERO_MUTATE_URL="http://localhost:5173/api/zero/mutate"
ZERO_ADMIN_PASSWORD="dev-password"
ZERO_QUERY_FORWARD_COOKIES="true"
ZERO_MUTATE_FORWARD_COOKIES="true"
```

---

## Phase 2: Schema Migration

### 2.1 Design PostgreSQL Schema

**Tasks**:

- [ ] Map MongoDB collections to PostgreSQL tables
- [ ] Define relationships and foreign keys
- [ ] Handle MongoDB-specific features (embedded documents → JSON columns)
- [ ] Design indexes for query performance

**Collections to Migrate**:

| MongoDB Collection | PostgreSQL Table   | Notes                                                        |
| ------------------ | ------------------ | ------------------------------------------------------------ |
| `profiles`         | `profiles`         | Add `user_id` (Clerk), indexes on `email`, `github_username` |
| `projects`         | `projects`         | Foreign key to `profiles.id`                                 |
| `badges`           | `badges`           | Separate table, not embedded                                 |
| `user_badges`      | `user_badges`      | Junction table for many-to-many                              |
| `events`           | `events`           | Add `luma_event_id` unique index                             |
| `event_attendance` | `event_attendance` | Composite primary key `(user_id, event_id)`                  |
| `surveys`          | `surveys`          | Store questions as JSONB                                     |
| `survey_responses` | `survey_responses` | Store answers as JSONB                                       |
| `demo_slots`       | `demo_slots`       | Related to events                                            |

### 2.2 Create Drizzle Schema

**Tasks**:

- [ ] Create `drizzle/schema.ts` with table definitions
- [ ] Use Drizzle's PostgreSQL types
- [ ] Define relationships explicitly
- [ ] Generate migrations with `drizzle-kit`

**Example** (`drizzle/schema.ts`):

```typescript
import {
    pgTable,
    text,
    timestamp,
    boolean,
    integer,
    jsonb,
    uuid,
    primaryKey
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const profiles = pgTable('profiles', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull().unique(), // Clerk user ID
    email: text('email').notNull().unique(),
    name: text('name').notNull(),
    githubUsername: text('github_username'),
    bio: text('bio'),
    avatarUrl: text('avatar_url'),
    zipCode: text('zip_code'),
    interests: jsonb('interests').$type<string[]>(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const projects = pgTable('projects', {
    id: uuid('id').primaryKey().defaultRandom(),
    profileId: uuid('profile_id')
        .notNull()
        .references(() => profiles.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description').notNull(),
    imageUrl: text('image_url'),
    githubUrl: text('github_url'),
    liveUrl: text('live_url'),
    tags: jsonb('tags').$type<string[]>(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    featured: boolean('featured').default(false)
});

export const badges = pgTable('badges', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull().unique(),
    description: text('description').notNull(),
    icon: text('icon').notNull(),
    category: text('category').notNull()
});

export const userBadges = pgTable(
    'user_badges',
    {
        userId: uuid('user_id')
            .notNull()
            .references(() => profiles.id, { onDelete: 'cascade' }),
        badgeId: uuid('badge_id')
            .notNull()
            .references(() => badges.id, { onDelete: 'cascade' }),
        earnedAt: timestamp('earned_at').notNull().defaultNow()
    },
    table => ({
        pk: primaryKey({ columns: [table.userId, table.badgeId] })
    })
);

export const events = pgTable('events', {
    id: uuid('id').primaryKey().defaultRandom(),
    lumaEventId: text('luma_event_id').notNull().unique(),
    name: text('name').notNull(),
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date'),
    location: text('location'),
    description: text('description'),
    coverImageUrl: text('cover_image_url')
});

export const eventAttendance = pgTable(
    'event_attendance',
    {
        userId: uuid('user_id')
            .notNull()
            .references(() => profiles.id, { onDelete: 'cascade' }),
        eventId: uuid('event_id')
            .notNull()
            .references(() => events.id, { onDelete: 'cascade' }),
        checkedInAt: timestamp('checked_in_at').notNull().defaultNow(),
        status: text('status').notNull().default('attended') // 'attended', 'registered', 'no-show'
    },
    table => ({
        pk: primaryKey({ columns: [table.userId, table.eventId] })
    })
);

// Relations
export const profilesRelations = relations(profiles, ({ many }) => ({
    projects: many(projects),
    badges: many(userBadges),
    attendance: many(eventAttendance)
}));

export const projectsRelations = relations(projects, ({ one }) => ({
    profile: one(profiles, {
        fields: [projects.profileId],
        references: [profiles.id]
    })
}));
```

### 2.3 Generate Zero Schema

**Tasks**:

- [ ] Run `npx drizzle-zero generate` to create `zero/schema.ts`
- [ ] Configure type-safe schema for Zero queries
- [ ] Register schema with Zero's type system

**Command**:

```bash
npx drizzle-zero generate
```

**Output**: `app/zero/schema.ts` (auto-generated, type-safe)

---

## Phase 3: Data Migration

### 3.1 Write Migration Script

**Tasks**:

- [ ] Create script to read from MongoDB
- [ ] Transform data to PostgreSQL format
- [ ] Handle ID mapping (MongoDB ObjectId → UUID)
- [ ] Batch insert into PostgreSQL
- [ ] Validate data integrity

**Script**: `scripts/migrate-mongo-to-postgres.ts`

```typescript
import { MongoClient } from 'mongodb';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../drizzle/schema';

async function migrate() {
    // Connect to MongoDB
    const mongo = new MongoClient(process.env.MONGODB_URI!);
    await mongo.connect();
    const mongodb = mongo.db();

    // Connect to PostgreSQL
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool, { schema });

    // Migrate profiles
    const profiles = await mongodb.collection('profiles').find().toArray();
    for (const profile of profiles) {
        await db.insert(schema.profiles).values({
            userId: profile.userId,
            email: profile.email,
            name: profile.name,
            githubUsername: profile.githubUsername
            // ... map all fields
        });
    }

    // Continue for other collections...

    await mongo.close();
    await pool.end();
}
```

### 3.2 Run Migration

**Tasks**:

- [ ] Backup MongoDB data
- [ ] Test migration on sample data
- [ ] Run full migration
- [ ] Verify data in PostgreSQL

---

## Phase 4: Zero Integration

### 4.1 Define Queries

**Tasks**:

- [ ] Create `app/zero/queries.ts`
- [ ] Define named queries with arguments
- [ ] Implement authorization logic
- [ ] Use ZQL for filtering, sorting, relationships

**Example** (`app/zero/queries.ts`):

```typescript
import { defineQueries, defineQuery } from '@rocicorp/zero';
import { z } from 'zod';
import { zql } from './schema';

export const queries = defineQueries({
    profiles: {
        // Get current user's profile
        current: defineQuery(
            z.object({ userId: z.string() }),
            ({ args: { userId } }) =>
                zql.profiles
                    .where('userId', userId)
                    .related('projects', q => q.orderBy('createdAt', 'desc'))
                    .related('badges', q => q.many())
                    .one()
        ),

        // Get all profiles with pagination
        list: defineQuery(
            z.object({ limit: z.number(), offset: z.number() }),
            ({ args: { limit, offset } }) =>
                zql.profiles
                    .orderBy('createdAt', 'desc')
                    .limit(limit)
                    .offset(offset)
        ),

        // Search profiles by name or username
        search: defineQuery(
            z.object({ query: z.string() }),
            ({ args: { query } }) =>
                zql.profiles.where(({ or, cmp }) =>
                    or(
                        cmp('name', 'ILIKE', `%${query}%`),
                        cmp('githubUsername', 'ILIKE', `%${query}%`)
                    )
                )
        )
    },

    projects: {
        featured: defineQuery(() =>
            zql.projects
                .where('featured', true)
                .related('profile', q => q.one())
                .orderBy('createdAt', 'desc')
                .limit(10)
        ),

        byUser: defineQuery(
            z.object({ userId: z.string() }),
            ({ args: { userId } }) =>
                zql.projects
                    .where('profileId', userId)
                    .orderBy('createdAt', 'desc')
        )
    },

    events: {
        upcoming: defineQuery(() =>
            zql.events
                .where(({ cmp }) => cmp('startDate', '>', new Date()))
                .orderBy('startDate', 'asc')
        )
    }
});
```

### 4.2 Define Mutators

**Tasks**:

- [ ] Create `app/zero/mutators.ts`
- [ ] Define named mutations with arguments
- [ ] Implement authorization logic
- [ ] Use transaction API for writes

**Example** (`app/zero/mutators.ts`):

```typescript
import { defineMutators, defineMutator } from '@rocicorp/zero';
import { z } from 'zod';
import { nanoid } from 'nanoid';

export const mutators = defineMutators({
    profiles: {
        update: defineMutator(
            z.object({
                userId: z.string(),
                name: z.string().optional(),
                bio: z.string().optional(),
                interests: z.array(z.string()).optional()
            }),
            async ({ args, tx, ctx }) => {
                // Authorization: users can only update their own profile
                if (ctx.userId !== args.userId) {
                    throw new Error('Unauthorized');
                }

                await tx.mutate.profiles.update({
                    where: { userId: args.userId },
                    set: {
                        name: args.name,
                        bio: args.bio,
                        interests: args.interests,
                        updatedAt: new Date()
                    }
                });
            }
        )
    },

    projects: {
        create: defineMutator(
            z.object({
                title: z.string(),
                description: z.string(),
                imageUrl: z.string().optional(),
                githubUrl: z.string().optional(),
                tags: z.array(z.string())
            }),
            async ({ args, tx, ctx }) => {
                const id = nanoid();
                await tx.mutate.projects.insert({
                    id,
                    profileId: ctx.userId,
                    title: args.title,
                    description: args.description,
                    imageUrl: args.imageUrl,
                    githubUrl: args.githubUrl,
                    tags: args.tags
                });
                return { id };
            }
        ),

        update: defineMutator(
            z.object({
                id: z.string(),
                title: z.string().optional(),
                description: z.string().optional()
            }),
            async ({ args, tx, ctx }) => {
                // Check ownership
                const project = await tx.run(
                    zql.projects.where('id', args.id).one()
                );

                if (!project || project.profileId !== ctx.userId) {
                    throw new Error('Unauthorized');
                }

                await tx.mutate.projects.update({
                    where: { id: args.id },
                    set: {
                        title: args.title,
                        description: args.description,
                        updatedAt: new Date()
                    }
                });
            }
        )
    }
});
```

### 4.3 Setup Zero Client

**Tasks**:

- [ ] Configure `ZeroProvider` in `app/root.tsx`
- [ ] Set `userID` from Clerk auth
- [ ] Configure `cacheURL`, `queryURL`, `mutateURL`
- [ ] Register schema and mutators

**Example** (`app/root.tsx`):

```typescript
import { ZeroProvider } from '@rocicorp/zero/react';
import type { ZeroOptions } from '@rocicorp/zero';
import { schema } from './zero/schema';
import { mutators } from './zero/mutators';
import { useAuth } from './hooks/use-auth';

export default function Root() {
  const { user } = useAuth();

  const zeroOpts: ZeroOptions = {
    userID: user?.id || 'anon',
    schema,
    mutators,
    cacheURL: import.meta.env.VITE_ZERO_CACHE_URL || 'http://localhost:4848',
    queryURL: '/api/zero/query',
    mutateURL: '/api/zero/mutate',
    // Cookie-based auth (forwarded by zero-cache)
    // Token-based auth: auth: userToken
  };

  return (
    <ZeroProvider {...zeroOpts}>
      <Outlet />
    </ZeroProvider>
  );
}
```

### 4.4 Implement API Endpoints

**Tasks**:

- [ ] Create `/api/zero/query` endpoint (React Router action)
- [ ] Create `/api/zero/mutate` endpoint (React Router action)
- [ ] Handle authentication (Clerk cookies)
- [ ] Call Zero's handler functions

**Example** (`app/routes/api/zero.query.tsx`):

```typescript
import { handleQueryRequest } from '@rocicorp/zero/server';
import { mustGetQuery } from '@rocicorp/zero';
import { queries } from '~/zero/queries';
import { schema } from '~/zero/schema';
import { getAuth } from '@clerk/remix/ssr.server';
import type { ActionFunctionArgs } from 'react-router';

export async function action({ request }: ActionFunctionArgs) {
    const { userId } = await getAuth(request);

    const result = await handleQueryRequest(
        (name, args) => {
            const query = mustGetQuery(queries, name);
            return query.fn({
                args,
                ctx: { userId: userId || 'anon', role: 'user' }
            });
        },
        schema,
        request
    );

    return Response.json(result);
}
```

**Example** (`app/routes/api/zero.mutate.tsx`):

```typescript
import { handleMutateRequest } from '@rocicorp/zero/server';
import { mustGetMutator } from '@rocicorp/zero';
import { mutators } from '~/zero/mutators';
import { dbProvider } from '~/lib/db/provider.server';
import { getAuth } from '@clerk/remix/ssr.server';
import type { ActionFunctionArgs } from 'react-router';

export async function action({ request }: ActionFunctionArgs) {
    const { userId } = await getAuth(request);

    const result = await handleMutateRequest(
        dbProvider,
        (tx, name, args) => {
            const mutator = mustGetMutator(mutators, name);
            return mutator.fn({
                tx,
                args,
                ctx: { userId: userId || 'anon', role: 'user' }
            });
        },
        request
    );

    return Response.json(result);
}
```

**Create DB Provider** (`app/lib/db/provider.server.ts`):

```typescript
import { zeroDrizzle } from '@rocicorp/zero/server/adapters/drizzle';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { schema } from '~/zero/schema';
import * as drizzleSchema from '../../../drizzle/schema';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const drizzleClient = drizzle(pool, { schema: drizzleSchema });

export const dbProvider = zeroDrizzle(schema, drizzleClient);

// Register for type safety
declare module '@rocicorp/zero' {
    interface DefaultTypes {
        dbProvider: typeof dbProvider;
        schema: typeof schema;
        context: { userId: string; role: 'admin' | 'user' };
    }
}
```

---

## Phase 5: Refactor Components

### 5.1 Replace MongoDB Queries with Zero Queries

**Tasks**:

- [ ] Replace React Router `loader` functions with `useQuery`
- [ ] Update components to use Zero's `useQuery` hook
- [ ] Handle loading/error states
- [ ] Remove manual data fetching logic

**Before** (MongoDB via loader):

```typescript
// app/routes/dashboard.profile.tsx
import type { LoaderFunctionArgs } from 'react-router';
import { getProfile } from '~/lib/db/profiles.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const { userId } = await getAuth(request);
  const profile = await getProfile(userId);
  return json({ profile });
}

export default function ProfilePage() {
  const { profile } = useLoaderData<typeof loader>();
  return <div>{profile.name}</div>;
}
```

**After** (Zero Sync):

```typescript
// app/routes/dashboard.profile.tsx
import { useQuery } from '@rocicorp/zero/react';
import { queries } from '~/zero/queries';
import { useAuth } from '~/hooks/use-auth';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile] = useQuery(queries.profiles.current({ userId: user.id }));

  if (!profile) return <div>Loading...</div>;

  return <div>{profile.name}</div>;
}
```

### 5.2 Replace MongoDB Mutations with Zero Mutators

**Before** (MongoDB via action):

```typescript
export async function action({ request }: ActionFunctionArgs) {
    const { userId } = await getAuth(request);
    const data = await request.json();
    await updateProfile(userId, data);
    return json({ success: true });
}
```

**After** (Zero Sync):

```typescript
import { useZero } from '@rocicorp/zero/react';
import { mutators } from '~/zero/mutators';

function ProfileForm() {
  const zero = useZero();

  const handleSubmit = async (data) => {
    const result = await zero.mutate(
      mutators.profiles.update({ userId: user.id, ...data })
    );

    const clientResult = await result.client;
    if (clientResult.type === 'error') {
      console.error(clientResult.error);
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### 5.3 Add Realtime Features

**Tasks**:

- [ ] Add realtime project updates on showcase page
- [ ] Add realtime check-in updates on events page
- [ ] Add realtime profile updates
- [ ] Show connection status indicator

**Example** (Connection Status):

```typescript
import { useConnectionState } from '@rocicorp/zero/react';

function ConnectionIndicator() {
  const state = useConnectionState();

  if (state.name === 'connected') {
    return <div className="text-green-500">● Live</div>;
  }

  if (state.name === 'connecting') {
    return <div className="text-yellow-500">● Connecting...</div>;
  }

  if (state.name === 'needs-auth') {
    return <div className="text-red-500">● Please log in</div>;
  }

  return <div className="text-gray-500">● Offline</div>;
}
```

---

## Phase 6: Testing & Deployment

### 6.1 Testing

**Tasks**:

- [ ] Test queries in isolation
- [ ] Test mutators with authorization
- [ ] Test realtime sync across multiple clients
- [ ] Test offline behavior
- [ ] Load test with multiple concurrent users
- [ ] Test schema migrations

### 6.2 Deployment

**Infrastructure**:

- [ ] Set up PostgreSQL on production (e.g., Neon, Supabase, or AWS RDS)
- [ ] Deploy zero-cache (Docker container)
    - Single-node for MVP
    - Multi-node for scale
- [ ] Configure subdomain for zero-cache (e.g., `sync.hellomiami.co`)
- [ ] Set up cookie forwarding (SameSite=Lax)
- [ ] Configure environment variables
- [ ] Set up monitoring and alerting

**Deployment Strategy**:

1. Deploy PostgreSQL
2. Run migrations
3. Deploy zero-cache
4. Deploy application with Zero client
5. Monitor for errors

**Docker Compose** (Production - Single Node):

```yaml
services:
    postgres:
        image: postgres:16-alpine
        environment:
            POSTGRES_DB: hello_miami
            POSTGRES_USER: ${DB_USER}
            POSTGRES_PASSWORD: ${DB_PASSWORD}
        volumes:
            - postgres-data:/var/lib/postgresql/data
        command: postgres -c wal_level=logical

    zero-cache:
        image: rocicorp/zero:latest
        ports:
            - '4848:4848'
        environment:
            ZERO_UPSTREAM_DB: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/hello_miami
            ZERO_REPLICA_FILE: /data/zero.db
            ZERO_ADMIN_PASSWORD: ${ZERO_ADMIN_PASSWORD}
            ZERO_QUERY_URL: https://hellomiami.co/api/zero/query
            ZERO_MUTATE_URL: https://hellomiami.co/api/zero/mutate
            ZERO_QUERY_FORWARD_COOKIES: 'true'
            ZERO_MUTATE_FORWARD_COOKIES: 'true'
        volumes:
            - zero-cache-data:/data
        depends_on:
            - postgres
```

---

## Phase 7: Monitoring & Optimization

### 7.1 Monitoring

**Tools**:

- [ ] Zero Inspector (`http://localhost:4848/inspector`)
- [ ] PostgreSQL query monitoring
- [ ] Application performance monitoring (APM)
- [ ] Error tracking (Sentry)

### 7.2 Optimization

**Tasks**:

- [ ] Optimize slow queries (use Zero Inspector)
- [ ] Add database indexes
- [ ] Configure query caching and TTL
- [ ] Optimize SQLite replica disk IOPS
- [ ] Scale zero-cache horizontally if needed

---

## Rollback Plan

If migration encounters issues:

1. **Keep MongoDB running** in parallel during initial deployment
2. **Dual-write** to both databases during transition
3. **Feature flag** to switch between MongoDB and Zero Sync
4. **Database backups** before migration
5. **Revert deployment** if critical issues arise

---

## Timeline Estimate

| Phase                        | Duration       | Dependencies |
| ---------------------------- | -------------- | ------------ |
| 1. Infrastructure Setup      | 1-2 days       | -            |
| 2. Schema Migration          | 2-3 days       | Phase 1      |
| 3. Data Migration            | 1-2 days       | Phase 2      |
| 4. Zero Integration          | 3-5 days       | Phase 3      |
| 5. Refactor Components       | 5-7 days       | Phase 4      |
| 6. Testing & Deployment      | 3-5 days       | Phase 5      |
| 7. Monitoring & Optimization | Ongoing        | Phase 6      |
| **Total**                    | **15-24 days** |              |

---

## Success Criteria

✅ All MongoDB data migrated to PostgreSQL  
✅ All queries work with Zero Sync  
✅ All mutations work with Zero Sync  
✅ Realtime updates work across clients  
✅ Authentication and authorization functional  
✅ Zero downtime during deployment  
✅ Performance meets or exceeds current system  
✅ Monitoring and alerting in place

---

## Resources

- **Zero Docs**: https://zero.rocicorp.dev/docs
- **Drizzle ORM**: https://orm.drizzle.team/
- **React Router 7**: https://reactrouter.com/
- **Clerk Auth**: https://clerk.com/docs

---

## Notes

- Zero Sync uses **server reconciliation** for conflict resolution (like video games)
- **No RLS needed** - permissions are implemented in query/mutator code
- **Client-generated IDs** (nanoid, uuid) work better than auto-increment
- **Schema migrations** follow expand/migrate/contract pattern
- **Cookie auth** requires subdomain setup (e.g., `sync.hellomiami.co`)
- **Realtime updates** are essentially free once Zero is integrated
