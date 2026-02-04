/**
 * Migration script to rename supabaseUserId → clerkUserId in profiles collection.
 * This is safe to run multiple times (idempotent).
 *
 * Run with: tsx scripts/migrate-supabase-to-clerk-userid.ts
 */

import { getMongoDb, CollectionName } from '../app/utils/mongodb.server';

async function migrateUserIdField() {
    console.log('Starting supabaseUserId → clerkUserId migration...\n');

    try {
        const db = await getMongoDb();
        const collection = db.collection(CollectionName.PROFILES);

        // Count profiles that still have supabaseUserId field
        const profilesWithOldField = await collection.countDocuments({
            supabaseUserId: { $exists: true }
        });

        console.log(
            `Found ${profilesWithOldField} profiles with 'supabaseUserId' field`
        );

        if (profilesWithOldField === 0) {
            console.log('✓ No profiles need migration. All done!');
            process.exit(0);
        }

        // Rename the field using $rename operator
        const result = await collection.updateMany(
            { supabaseUserId: { $exists: true } },
            {
                $rename: { supabaseUserId: 'clerkUserId' },
                $set: { updatedAt: new Date() }
            }
        );

        console.log(`\n✓ Migration complete!`);
        console.log(`  - Matched: ${result.matchedCount} profiles`);
        console.log(`  - Modified: ${result.modifiedCount} profiles`);

        // Verify migration by checking if any profiles still have the old field
        const remainingOldField = await collection.countDocuments({
            supabaseUserId: { $exists: true }
        });

        const profilesWithNewField = await collection.countDocuments({
            clerkUserId: { $exists: true }
        });

        console.log(`\nVerification:`);
        console.log(`  - Profiles with 'supabaseUserId': ${remainingOldField}`);
        console.log(`  - Profiles with 'clerkUserId': ${profilesWithNewField}`);

        // Show a sample of a migrated profile
        const sample = await collection.findOne({
            clerkUserId: { $exists: true }
        });
        if (sample) {
            console.log('\nSample migrated profile:');
            console.log(`  - _id: ${sample._id}`);
            console.log(`  - lumaEmail: ${sample.lumaEmail}`);
            console.log(`  - clerkUserId: ${sample.clerkUserId}`);
            console.log(
                `  - has supabaseUserId field: ${'supabaseUserId' in sample}`
            );
        }

        if (remainingOldField > 0) {
            console.warn(
                `\n⚠️  Warning: ${remainingOldField} profiles still have 'supabaseUserId' field`
            );
            process.exit(1);
        }

        console.log('\n✓ Migration verified successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrateUserIdField();
