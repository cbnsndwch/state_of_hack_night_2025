# Badge System

The badge system rewards members for their participation in hack nights. Badges are automatically awarded when members check in to events.

## Overview

Badges are awarded based on two main criteria:
- **Check-in Milestones**: Total number of hack nights attended
- **Streak Milestones**: Consecutive weeks of attendance

## Badge Types

### Check-in Milestone Badges

| Badge Name | Criteria | Icon |
|------------|----------|------|
| First Check-in | Check in to your first hack night | 🎯 |
| 5 Check-ins | Check in to 5 hack nights | ⭐ |
| 10 Check-ins | Check in to 10 hack nights | 🌟 |
| 25 Check-ins | Check in to 25 hack nights | 💫 |
| 50 Check-ins | Check in to 50 hack nights | ✨ |

### Streak Milestone Badges

| Badge Name | Criteria | Icon |
|------------|----------|------|
| 3 Week Streak | Maintain a 3 week attendance streak | 🔥 |
| 5 Week Streak | Maintain a 5 week attendance streak | 🔥🔥 |
| 10 Week Streak | Maintain a 10 week attendance streak | 🚀 |
| 25 Week Streak | Maintain a 25 week attendance streak | 💪 |
| 52 Week Streak | Maintain a 52 week attendance streak (1 year!) | 👑 |

## How Badges Work

### Automatic Award on Check-In

When a member checks in to an event:

1. The check-in is recorded in the database
2. The member's attendance streak is recalculated
3. The badge assignment logic checks if the member is eligible for any new badges
4. Eligible badges that haven't been awarded yet are automatically given to the member
5. The check-in response includes any newly awarded badges

### Badge Eligibility Logic

The system checks two counts:
- **Total check-ins**: Count of all events with status "checked-in"
- **Current streak**: Calculated using the streak algorithm (see [STREAKS.md](./STREAKS.md))

For each badge type, the system:
1. Checks if the member meets the minimum threshold
2. Verifies the member doesn't already have the badge
3. Awards the badge if both conditions are met

### Implementation

Badge assignment happens in `app/lib/db/badge-assignment.server.ts`:

```typescript
// Called after check-in and streak update
const badges = await awardCheckInBadges(memberId, streakCount);
```

The function:
1. Gets the member's total check-in count
2. Evaluates all badge criteria against current stats
3. Awards all newly eligible badges
4. Returns list of newly awarded badges

## Database Schema

### Badge Collection

```typescript
interface Badge {
    _id: ObjectId;
    name: string;           // Badge name (e.g., "First Check-in")
    iconAscii: string;      // ASCII art icon for terminal aesthetic
    criteria: string;       // Description of how to earn it
    createdAt: Date;
}
```

### MemberBadge Collection (Join Table)

```typescript
interface MemberBadge {
    _id: ObjectId;
    memberId: ObjectId;     // Reference to Profile._id
    badgeId: ObjectId;      // Reference to Badge._id
    awardedAt: Date;        // When badge was earned
}
```

## Seeding Badges

Initial badge definitions must be seeded into the database before the system can award them.

### Run the Seed Script

```bash
tsx scripts/seed-badges.ts
```

This script:
- Creates all predefined badge definitions
- Skips badges that already exist
- Requires `MONGODB_URI` environment variable to be set

### Badge Definitions

Badge definitions are maintained in `app/lib/db/seed-badges.server.ts`. To add new badges:

1. Add the badge definition to the `BADGE_DEFINITIONS` array
2. Update the badge criteria logic in `app/lib/db/badge-assignment.server.ts`
3. Run the seed script to add the new badges to the database

## API Response

When a member checks in, the response includes any newly awarded badges:

```json
{
    "success": true,
    "message": "Checked in successfully",
    "attendance": { ... },
    "streakCount": 5,
    "awardedBadges": [
        {
            "id": "6789...",
            "name": "5 Check-ins",
            "iconAscii": "⭐",
            "criteria": "Check in to 5 hack nights"
        }
    ],
    "lumaUpdated": true
}
```

## Key Functions

### Badge Data Layer (`app/lib/db/badges.server.ts`)

- `getBadges()` - Get all badge definitions
- `getBadgeById(id)` - Get specific badge by ID
- `getBadgeByName(name)` - Get specific badge by name
- `createBadge(data)` - Create new badge definition
- `getMemberBadges(memberId)` - Get all badges for a member
- `awardBadge(data)` - Award a badge to a member
- `hasBadge(memberId, badgeId)` - Check if member has badge
- `removeBadge(memberId, badgeId)` - Remove badge from member

### Badge Assignment (`app/lib/db/badge-assignment.server.ts`)

- `awardCheckInBadges(memberId, streakCount)` - Main function called from check-in endpoint
- `checkAndAwardBadges(memberId, checkInCount, streakCount)` - Core logic for badge eligibility

### Attendance Helpers (`app/lib/db/attendance.server.ts`)

- `getCheckedInCountByMember(memberId)` - Count total check-ins for badge calculations

## Future Enhancements

Potential additions to the badge system:

- **Project Submission Badges**: Awards for shipping projects
- **Demo Night Badges**: Rewards for presenting demos
- **Community Badges**: Recognition for helping others
- **Special Event Badges**: One-time awards for special occasions
- **Badge Tiers**: Bronze, Silver, Gold variants of existing badges
- **Badge Display**: UI component to showcase member badges
- **Badge Notifications**: Toast/modal when a new badge is earned

## Related Documentation

- [STREAKS.md](./STREAKS.md) - How attendance streaks are calculated
- [PRD.md](./PRD.md) - Product requirements and feature roadmap
