/**
 * Script to seed badge definitions into the database.
 * Run with: tsx scripts/seed-badges.ts
 */

import { seedBadges } from '../app/lib/db/seed-badges.server';
import { closeMongoDb } from '../app/utils/mongodb.server';

async function main() {
    try {
        console.log('Starting badge seed...');
        await seedBadges();
        console.log('Badge seed completed successfully!');
    } catch (error) {
        console.error('Error seeding badges:', error);
        process.exit(1);
    } finally {
        await closeMongoDb();
    }
}

main();
