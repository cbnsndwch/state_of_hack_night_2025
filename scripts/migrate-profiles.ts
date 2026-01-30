/**
 * Migration script to add new fields to existing profiles.
 * Run with: tsx scripts/migrate-profiles.ts
 */

import { getMongoDb, CollectionName } from '../app/utils/mongodb.server';

async function migrateProfiles() {
    console.log('Starting profile migration...');

    try {
        const db = await getMongoDb();
        const collection = db.collection(CollectionName.PROFILES);

        // Update all profiles to include the new fields with default values
        const result = await collection.updateMany(
            {
                // Only update profiles that don't have the new fields
                $or: [
                    { skills: { $exists: false } },
                    { githubUsername: { $exists: false } },
                    { twitterHandle: { $exists: false } },
                    { websiteUrl: { $exists: false } },
                    { role: { $exists: false } },
                    { seekingFunding: { $exists: false } },
                    { openToMentoring: { $exists: false } }
                ]
            },
            {
                $set: {
                    skills: [],
                    githubUsername: null,
                    twitterHandle: null,
                    websiteUrl: null,
                    role: null,
                    seekingFunding: false,
                    openToMentoring: false,
                    updatedAt: new Date()
                }
            }
        );

        console.log(
            `✓ Migration complete! Updated ${result.modifiedCount} profiles.`
        );

        // Show a sample of the updated profiles
        const sample = await collection.findOne({});
        console.log('\nSample profile after migration:');
        console.log(JSON.stringify(sample, null, 2));

        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrateProfiles();
