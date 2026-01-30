/**
 * Script to seed the onboarding survey into the database.
 * Run with: tsx scripts/seed-survey.ts
 */

import { seedOnboardingSurvey } from '../app/lib/db/seed-onboarding-survey.server';
import { closeMongoDb } from '../app/utils/mongodb.server';

async function main() {
    try {
        console.log('Starting survey seed...');
        await seedOnboardingSurvey();
        console.log('Survey seed completed successfully!');
    } catch (error) {
        console.error('Error seeding survey:', error);
        process.exit(1);
    } finally {
        await closeMongoDb();
    }
}

main();
