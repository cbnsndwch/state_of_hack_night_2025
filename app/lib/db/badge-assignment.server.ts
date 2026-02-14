import { getBadgeByName, hasBadge, awardBadge } from './badges.server';
import { getCheckedInCountByMember } from './attendance.server';
import type { Badge } from '@/types/adapters';

/**
 * Badge criteria definitions
 */
const BADGE_CRITERIA = {
    FIRST_CHECKIN: 'First Check-in',
    CHECKIN_5: '5 Check-ins',
    CHECKIN_10: '10 Check-ins',
    CHECKIN_25: '25 Check-ins',
    CHECKIN_50: '50 Check-ins',
    STREAK_3: '3 Week Streak',
    STREAK_5: '5 Week Streak',
    STREAK_10: '10 Week Streak',
    STREAK_25: '25 Week Streak',
    STREAK_52: '52 Week Streak'
} as const;

/**
 * Check and award badges based on member's check-in activity
 * Returns array of newly awarded badges
 */
export async function checkAndAwardBadges(
    memberId: string,
    checkInCount: number,
    streakCount: number
): Promise<Badge[]> {
    const awardedBadges: Badge[] = [];

    // Define badge eligibility based on counts
    const eligibleBadgeNames: string[] = [];

    // Check-in milestone badges
    if (checkInCount >= 1)
        eligibleBadgeNames.push(BADGE_CRITERIA.FIRST_CHECKIN);
    if (checkInCount >= 5) eligibleBadgeNames.push(BADGE_CRITERIA.CHECKIN_5);
    if (checkInCount >= 10) eligibleBadgeNames.push(BADGE_CRITERIA.CHECKIN_10);
    if (checkInCount >= 25) eligibleBadgeNames.push(BADGE_CRITERIA.CHECKIN_25);
    if (checkInCount >= 50) eligibleBadgeNames.push(BADGE_CRITERIA.CHECKIN_50);

    // Streak milestone badges
    if (streakCount >= 3) eligibleBadgeNames.push(BADGE_CRITERIA.STREAK_3);
    if (streakCount >= 5) eligibleBadgeNames.push(BADGE_CRITERIA.STREAK_5);
    if (streakCount >= 10) eligibleBadgeNames.push(BADGE_CRITERIA.STREAK_10);
    if (streakCount >= 25) eligibleBadgeNames.push(BADGE_CRITERIA.STREAK_25);
    if (streakCount >= 52) eligibleBadgeNames.push(BADGE_CRITERIA.STREAK_52);

    // Check each eligible badge and award if not already owned
    for (const badgeName of eligibleBadgeNames) {
        const badge = await getBadgeByName(badgeName);
        if (!badge) {
            console.warn(`Badge "${badgeName}" not found in database`);
            continue;
        }

        const alreadyHasBadge = await hasBadge(memberId, badge.id);

        if (!alreadyHasBadge) {
            try {
                await awardBadge({
                    memberId: memberId,
                    badgeId: badge.id
                });
                awardedBadges.push(badge);
                console.log(
                    `Awarded badge "${badgeName}" to member ${memberId}`
                );
            } catch (error) {
                console.error(
                    `Error awarding badge "${badgeName}" to member ${memberId}:`,
                    error
                );
            }
        }
    }

    return awardedBadges;
}

/**
 * Check and award badges after a check-in
 * This is the main function to call from the check-in endpoint
 */
export async function awardCheckInBadges(
    memberId: string,
    streakCount: number
): Promise<Badge[]> {
    // Get the member's total check-in count
    const checkInCount = await getCheckedInCountByMember(memberId);

    // Check and award eligible badges
    return checkAndAwardBadges(memberId, checkInCount, streakCount);
}
