# Zero Sync Offline Testing Guide

This document provides a comprehensive guide to testing offline behavior with Zero Sync.

## Overview

Zero Sync provides automatic offline support with the following features:

- **Local Caching**: All data cached in IndexedDB
- **Offline Queries**: Queries work seamlessly with cached data
- **Mutation Queueing**: Mutations queue locally and sync when online
- **Optimistic UI**: Instant updates before server confirmation
- **Automatic Reconciliation**: Conflict resolution on reconnection

## Running Offline Tests

### Automated Test Script

We provide an automated test that verifies offline infrastructure:

```bash
pnpm test:offline
```

This script tests:

1. Zero client initialization
2. Zero cache configuration
3. Offline behavior patterns
4. Connection state management
5. Data persistence strategy
6. Query reactivity
7. Error handling

### Manual Browser Testing

To thoroughly test offline behavior in a browser environment:

#### Step 1: Start Development Environment

```bash
# Terminal 1: Start PostgreSQL
docker-compose up -d postgres

# Terminal 2: Start zero-cache
npx zero-cache-dev

# Terminal 3: Start development server
pnpm dev
```

#### Step 2: Open Browser DevTools

1. Open the application in Chrome/Edge
2. Press `F12` to open DevTools
3. Go to the **Network** tab

#### Step 3: Test Offline Queries

1. Navigate to a page with data (e.g., `/showcase`, `/events`, `/dashboard`)
2. Wait for data to load and cache
3. Enable "Offline" mode in Network tab
4. Refresh the page or navigate to another page
5. **Expected Result**: Data still displays from cache

#### Step 4: Test Offline Mutations

1. While still offline, try to create/update data:
    - Update your profile
    - Create a new project
    - Submit a form
2. **Expected Result**:
    - UI updates immediately (optimistic update)
    - Changes are queued locally
    - You may see a "Syncing..." indicator

#### Step 5: Test Reconnection & Sync

1. Disable "Offline" mode in Network tab
2. **Expected Result**:
    - Queued mutations sync automatically
    - You may see a "Synced" confirmation
    - All changes appear in the database

#### Step 6: Test Conflict Resolution

1. Open the app in two browser windows (Window A and Window B)
2. Go offline in Window A
3. Make a change in Window A (e.g., update profile)
4. While Window A is still offline, make a different change in Window B
5. Bring Window A back online
6. **Expected Result**:
    - Last write wins (Window A's changes overwrite Window B's)
    - Or custom conflict resolution logic applies

## Testing Scenarios

### Scenario 1: Temporary Network Loss

**Setup**: User is actively using the app when network drops

**Test Steps**:

1. Load data while online
2. Simulate network loss (offline mode)
3. Continue using the app
4. Restore network connection

**Expected Behavior**:

- App continues functioning normally
- Cached data remains accessible
- New mutations queue locally
- Automatic sync on reconnection

### Scenario 2: App Load While Offline

**Setup**: User opens app without network connection

**Test Steps**:

1. Clear browser cache
2. Enable offline mode
3. Navigate to the app
4. Try to access data

**Expected Behavior**:

- App shell loads (if using service worker)
- No cached data available (first visit)
- User sees "offline" indicator
- Graceful error messages for missing data

### Scenario 3: Intermittent Connection

**Setup**: Network connection is unstable

**Test Steps**:

1. Load data while online
2. Toggle offline/online mode rapidly
3. Make mutations during both states

**Expected Behavior**:

- Zero handles connection state changes gracefully
- Mutations queue during offline periods
- Automatic retry with exponential backoff
- All mutations eventually sync

### Scenario 4: Long Offline Period

**Setup**: User is offline for extended time

**Test Steps**:

1. Go offline for 30+ minutes
2. Make multiple mutations
3. Come back online

**Expected Behavior**:

- All mutations queued locally
- Data persists in IndexedDB
- Mutations sync in order on reconnection
- No data loss

## Monitoring Offline Behavior

### Browser Console Logs

Zero provides detailed logging in development mode:

```javascript
// Enable verbose logging
const zero = new Zero({
    userID: 'user-123',
    schema,
    server: cacheUrl,
    logLevel: 'debug' // Change to 'debug' for more details
});
```

Look for these log messages:

- `Connecting...`: Attempting connection to zero-cache
- `Connected`: Successfully connected
- `Disconnected`: Connection lost
- `Queuing mutation`: Mutation queued while offline
- `Syncing mutation`: Sending queued mutation

### React Connection Status Hook

Use the `useZeroConnection()` hook to display connection status:

```typescript
import { useZeroConnection } from '@/components/providers/zero-provider';

function ConnectionIndicator() {
  const { isConnected, error } = useZeroConnection();

  if (error) {
    return <div className="error">Connection error: {error.message}</div>;
  }

  if (!isConnected) {
    return <div className="warning">Offline - Changes will sync when online</div>;
  }

  return <div className="success">Connected</div>;
}
```

### IndexedDB Inspection

View cached data in Chrome DevTools:

1. Open DevTools (F12)
2. Go to **Application** tab
3. Expand **IndexedDB** in the left sidebar
4. Look for Zero's database (e.g., `zero-cache`)
5. Inspect tables and cached data

## Common Issues & Solutions

### Issue: Data Not Caching

**Symptoms**: Data disappears when offline

**Solutions**:

1. Verify IndexedDB is enabled in browser
2. Check browser storage quota
3. Ensure queries are properly subscribed
4. Check for schema mismatches

### Issue: Mutations Not Syncing

**Symptoms**: Changes made offline don't appear after reconnecting

**Solutions**:

1. Check browser console for errors
2. Verify zero-cache is running
3. Check authentication token validity
4. Inspect network requests for failures

### Issue: Stale Data After Reconnect

**Symptoms**: Old data shown after coming back online

**Solutions**:

1. Implement proper cache invalidation
2. Use query refetch on reconnection
3. Check for schema version mismatches
4. Clear IndexedDB and resync

## Best Practices

### 1. Always Show Connection Status

Display an indicator so users know their offline status:

```typescript
<ConnectionIndicator />
```

### 2. Provide Feedback for Queued Actions

Show when mutations are queued vs synced:

```typescript
{isPending && <span>Syncing...</span>}
{isSuccess && <span>Synced ✓</span>}
```

### 3. Handle Sync Failures Gracefully

Allow users to retry failed mutations:

```typescript
{isError && (
  <button onClick={() => retry()}>
    Retry Sync
  </button>
)}
```

### 4. Implement Conflict Resolution

Define how conflicts should be resolved:

```typescript
// In app/zero/mutators.ts
export const updateProfile = {
    args: z.object({
        id: z.string(),
        data: profileUpdateSchema,
        version: z.number() // For optimistic concurrency control
    }),
    async mutate(tx, { id, data, version }) {
        // Check version to detect conflicts
        const existing = await tx.profiles.findOne({ id });
        if (existing.version !== version) {
            throw new Error('Conflict: Profile was modified by another client');
        }
        // Apply update with new version
        await tx.profiles.update({
            ...data,
            version: version + 1
        });
    }
};
```

### 5. Test Offline Scenarios Regularly

Include offline testing in your QA process:

- Test during development
- Include in PR review checklist
- Run automated tests in CI/CD

## Performance Considerations

### IndexedDB Storage Limits

- Chrome: ~60% of available disk space
- Firefox: ~10% of available disk space
- Safari: ~1GB

Monitor storage usage and implement cleanup:

```typescript
// Clear old data periodically
async function cleanupOldCache() {
    const threshold = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days
    await zero.clear({ before: threshold });
}
```

### Query Optimization

Cache only necessary data:

```typescript
// Good: Specific query
const myProjects = await zero.query(projectQueries.byMemberId(userId));

// Bad: Over-fetching
const allProjects = await zero.query(projectQueries.all());
```

## Additional Resources

- [Zero Sync Documentation](https://github.com/rocicorp/zero)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Progressive Web Apps](https://web.dev/progressive-web-apps/)

## Troubleshooting Commands

```bash
# Run offline test suite
pnpm test:offline

# Check zero-cache health
curl http://localhost:4848/health

# View PostgreSQL connections
docker-compose exec postgres psql -U postgres -c "SELECT * FROM pg_stat_activity;"

# Clear local IndexedDB (in browser console)
indexedDB.deleteDatabase('zero-cache');
```

## Next Steps

1. [ ] Implement connection status indicator in app shell
2. [ ] Add sync status to forms and mutations
3. [ ] Create e2e tests for offline scenarios
4. [ ] Monitor offline usage in production analytics
5. [ ] Document conflict resolution strategy for team
