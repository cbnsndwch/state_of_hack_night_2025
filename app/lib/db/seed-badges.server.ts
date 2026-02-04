import { createBadge, getBadgeByName } from './badges.server';

/**
 * Badge definitions for check-in milestones and streaks
 */
const BADGE_DEFINITIONS = [
    {
        name: 'First Check-in',
        iconAscii: '🎯',
        criteria: 'Check in to your first hack night'
    },
    {
        name: '5 Check-ins',
        iconAscii: '⭐',
        criteria: 'Check in to 5 hack nights'
    },
    {
        name: '10 Check-ins',
        iconAscii: '🌟',
        criteria: 'Check in to 10 hack nights'
    },
    {
        name: '25 Check-ins',
        iconAscii: '💫',
        criteria: 'Check in to 25 hack nights'
    },
    {
        name: '50 Check-ins',
        iconAscii: '✨',
        criteria: 'Check in to 50 hack nights'
    },
    {
        name: '3 Week Streak',
        iconAscii: '🔥',
        criteria: 'Maintain a 3 week attendance streak'
    },
    {
        name: '5 Week Streak',
        iconAscii: '🔥🔥',
        criteria: 'Maintain a 5 week attendance streak'
    },
    {
        name: '10 Week Streak',
        iconAscii: '🚀',
        criteria: 'Maintain a 10 week attendance streak'
    },
    {
        name: '25 Week Streak',
        iconAscii: '💪',
        criteria: 'Maintain a 25 week attendance streak'
    },
    {
        name: '52 Week Streak',
        iconAscii: '👑',
        criteria: 'Maintain a 52 week attendance streak (1 year!)'
    }
];

/**
 * Seed initial badge definitions into the database
 */
export async function seedBadges(): Promise<void> {
    console.log('Starting badge seed...');

    for (const badgeDef of BADGE_DEFINITIONS) {
        try {
            // Check if badge already exists
            const existing = await getBadgeByName(badgeDef.name);
            if (existing) {
                console.log(
                    `Badge "${badgeDef.name}" already exists, skipping`
                );
                continue;
            }

            // Create badge
            await createBadge(badgeDef);
            console.log(`Created badge: ${badgeDef.name}`);
        } catch (error) {
            console.error(`Error creating badge "${badgeDef.name}":`, error);
            throw error;
        }
    }

    console.log(
        `Badge seed completed. Created/verified ${BADGE_DEFINITIONS.length} badges.`
    );
}
