# Attendance Streaks

## Overview

The attendance streak system tracks consecutive weeks of hack night participation, gamifying regular attendance and building community engagement.

## How It Works

### Streak Definition

A "streak" is the number of **consecutive hack nights** a member has attended, counting backwards from the most recent event.

**Key Rules:**
- Only `checked-in` status counts (not just registered)
- Streaks are calculated from most recent event backwards
- Missing any event breaks the streak
- Future events don't affect current streak

### Example Scenarios

#### Scenario 1: Perfect Attendance
```
Events:     Jan 1    Jan 8    Jan 15   Jan 22   Jan 29
Attendance:   ✓        ✓        ✓        ✓        ✓

Streak: 5 weeks
```

#### Scenario 2: Missed Most Recent Event
```
Events:     Jan 1    Jan 8    Jan 15   Jan 22   Jan 29
Attendance:   ✓        ✓        ✓        ✓        ✗

Streak: 0 weeks (broken by missing Jan 29)
```

#### Scenario 3: Missed Middle Event
```
Events:     Jan 1    Jan 8    Jan 15   Jan 22   Jan 29
Attendance:   ✓        ✓        ✗        ✓        ✓

Streak: 2 weeks (only Jan 22 and Jan 29 count)
```

## Implementation

### Database Schema

**Profile Collection:**
```typescript
{
    streakCount: number  // Current consecutive weeks attended
}
```

**Attendance Collection:**
```typescript
{
    memberId: ObjectId,
    lumaEventId: string,
    status: 'registered' | 'checked-in',
    checkedInAt: Date | null
}
```

### Core Functions

#### `calculateStreak(memberId: string): Promise<number>`
Calculates the current streak without updating the database.

**Location:** `app/lib/db/streaks.server.ts`

**Algorithm:**
1. Get all checked-in attendance for member
2. Get all past events (sorted newest first)
3. Loop through events from most recent:
   - If attended → increment streak
   - If missed → break and return streak
4. Return final count

#### `updateMemberStreak(memberId: string): Promise<number>`
Recalculates and updates the member's streak in their profile.

**Location:** `app/lib/db/streaks.server.ts`

**Used By:**
- `POST /api/check-in` - Called after every successful check-in
- `POST /api/recalculate-streaks` - Admin bulk recalculation

#### `recalculateAllStreaks(): Promise<number>`
Recalculates streaks for all members (batch operation).

**Location:** `app/lib/db/streaks.server.ts`

**Returns:** Number of profiles updated

## API Endpoints

### GET /api/streak
Get a member's current streak count.

**Query Parameters:**
- `memberId` (required) - The member's MongoDB _id

**Response:**
```json
{
    "success": true,
    "memberId": "507f1f77bcf86cd799439011",
    "streakCount": 5
}
```

### POST /api/check-in
Check in to an event (automatically updates streak).

**Form Data:**
- `memberId` (required)
- `lumaEventId` (required)
- `lumaAttendeeId` (optional)

**Response:**
```json
{
    "success": true,
    "message": "Checked in successfully",
    "attendance": { ... },
    "streakCount": 5,
    "lumaUpdated": true
}
```

### POST /api/recalculate-streaks
Recalculate streaks for all members (admin only).

**Authentication:** Required (admin privileges)

**Response:**
```json
{
    "success": true,
    "message": "Successfully recalculated streaks for 47 members",
    "updatedCount": 47
}
```

## UI Integration

### Dashboard Display
The member dashboard displays the current streak:

**Location:** `app/routes/dashboard.tsx`

```tsx
<div className="text-xs font-sans text-zinc-500 mb-1">
    attendance streak
</div>
<div className="text-2xl font-sans text-primary">
    {profile?.streakCount || 0} weeks
</div>
```

### Check-In Success Message
After checking in, the ImHereButton shows the updated streak:

**Location:** `app/components/events/ImHereButton.tsx`

```tsx
✓ checked in successfully!
your attendance has been recorded. keep building!
🔥 current streak: 5 weeks
```

## Performance Considerations

### Query Complexity
- **Single member:** O(E) where E = number of events
- **All members:** O(M × E) where M = members
- Typical values: M ≈ 50, E ≈ 50
- Total operations for full recalc: ~2,500 queries

### Optimizations
1. **Automatic Updates:** Streaks update on check-in (no manual refresh needed)
2. **Caching:** Streak count stored in profile (no recalculation on view)
3. **Lazy Calculation:** Only recalculates when needed (check-in or admin action)

### Future Optimizations
- Add database index on `(memberId, status, checkedInAt)` for faster lookups
- Implement background job for nightly streak maintenance
- Cache event list in memory (events change infrequently)

## Testing

### Manual Testing
1. Create test events in MongoDB
2. Check in to consecutive events
3. Verify streak increments after each check-in
4. Miss an event and verify streak resets
5. Check dashboard displays correct streak

### Test Cases
See `app/lib/db/streaks.server.test.md` for comprehensive test scenarios.

## Future Enhancements

### Planned Features
1. **Streak Badges**
   - Award badges for milestone streaks (4, 12, 26, 52 weeks)
   - Display special badge icons in profile
   
2. **Longest Streak Tracking**
   - Track both `currentStreak` and `longestStreak`
   - Show "personal best" achievements

3. **Streak Freeze**
   - Allow 1-2 "freeze days" per quarter for legitimate absences
   - Prevent streak from breaking during freeze

4. **Leaderboard**
   - Community page showing top streaks
   - Friendly competition and motivation

5. **Notifications**
   - Email reminder when at risk of breaking streak
   - Weekly digest with streak progress

### Technical Debt
- Add comprehensive unit tests for streak calculation
- Create database migration for existing members
- Add monitoring/alerts for streak calculation failures
- Consider event-driven architecture for streak updates

## Maintenance

### Admin Operations

**Recalculate all streaks:**
```bash
# Via API (requires admin auth token)
curl -X POST https://hello-miami.com/api/recalculate-streaks \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Check a specific member's streak:**
```bash
curl "https://hello-miami.com/api/streak?memberId=507f1f77bcf86cd799439011"
```

### Troubleshooting

**Problem:** Streak not updating after check-in
- Check API response includes `streakCount` field
- Verify `updateMemberStreak()` is called in check-in action
- Check server logs for errors

**Problem:** Incorrect streak count
- Run `/api/recalculate-streaks` to fix
- Verify event `startAt` dates are correct
- Check for duplicate check-in records

**Problem:** Performance issues with bulk recalculation
- Run during off-hours
- Consider batching (e.g., 10 members at a time)
- Add progress logging

## References

- **Streak Calculation:** `app/lib/db/streaks.server.ts`
- **Check-In API:** `app/routes/api/check-in.server.ts`
- **Attendance Model:** `app/types/mongodb.ts`
- **Dashboard Display:** `app/routes/dashboard.tsx`
- **Test Cases:** `app/lib/db/streaks.server.test.md`
