# Streak Calculation Logic - Test Cases

## Overview

The streak calculation logic tracks consecutive weeks of hack night attendance.

## Algorithm

1. Get all checked-in attendance records for a member
2. Get all past events (sorted most recent first)
3. Count backwards from most recent event:
    - If member attended → increment streak
    - If member missed → BREAK (stop counting)
4. Return streak count

## Test Cases

### Case 1: No Attendance

**Setup:**

- Member has never checked in

**Expected Result:**

- Streak count: 0

---

### Case 2: Perfect Attendance (3 events)

**Setup:**

- 3 events have occurred: Jan 1, Jan 8, Jan 15
- Member checked in to all 3 events

**Expected Result:**

- Streak count: 3

---

### Case 3: Missed Most Recent Event

**Setup:**

- 3 events have occurred: Jan 1, Jan 8, Jan 15
- Member checked in to: Jan 1, Jan 8 (missed Jan 15)

**Expected Result:**

- Streak count: 0 (streak broken by missing most recent event)

---

### Case 4: Current Streak After Missing Earlier Event

**Setup:**

- 5 events have occurred: Jan 1, Jan 8, Jan 15, Jan 22, Jan 29
- Member checked in to: Jan 1, Jan 8 (missed Jan 15), Jan 22, Jan 29

**Expected Result:**

- Streak count: 2 (only counts Jan 22 and Jan 29)

---

### Case 5: Single Check-In (Most Recent Event)

**Setup:**

- 3 events have occurred: Jan 1, Jan 8, Jan 15
- Member checked in to: Jan 15 only

**Expected Result:**

- Streak count: 1

---

### Case 6: No Events Yet

**Setup:**

- 0 events have occurred

**Expected Result:**

- Streak count: 0

---

### Case 7: Registered But Not Checked In

**Setup:**

- 2 events have occurred: Jan 1, Jan 8
- Member registered for both but status is 'registered' (not 'checked-in')

**Expected Result:**

- Streak count: 0 (only check-ins count)

---

## Edge Cases

### Events in the Future

- Future events are NOT considered for streak calculation
- Only events where `startAt <= now` are counted

### Duplicate Check-Ins

- The system prevents duplicate check-ins
- Each event can only be checked in once per member

### Timezone Considerations

- Events have a `timezone` field
- Check-ins use UTC timestamps (`checkedInAt`)
- Streak calculation uses event `startAt` dates

---

## API Integration

### After Check-In

When a member checks in via `POST /api/check-in`:

1. Create/update attendance record
2. Call `updateMemberStreak(memberId)` to recalculate
3. Return updated streak count in response

### Manual Recalculation

Admin endpoint `POST /api/recalculate-streaks`:

- Recalculates streaks for ALL members
- Requires admin authentication
- Returns count of updated profiles

---

## Performance Notes

- Streak calculation queries:
    1. Get member's attendance records
    2. Get all past events (sorted)
    3. Single loop through events

- Complexity: O(E) where E = number of events
- Typically E < 100, so performance is acceptable

- For batch recalculation of all members:
    - Complexity: O(M × E) where M = members
    - Consider adding a background job for large datasets

---

## Future Enhancements

1. **Streak Freeze** - Allow members to "freeze" their streak for legitimate absences
2. **Longest Streak** - Track both current and all-time longest streak
3. **Streak Badges** - Award badges for milestone streaks (4 weeks, 12 weeks, 52 weeks)
4. **Weekly Digest** - Email members when they're at risk of breaking their streak
5. **Leaderboard** - Show top streaks on community page
