import { ObjectId } from 'mongodb';
import { getMongoDb, CollectionName } from '@/utils/mongodb.server';
import type {
    Survey,
    SurveyInsert,
    SurveyUpdate,
    SurveyWithResponseCount,
    SurveyType
} from '@/types/mongodb';

/**
 * Get all surveys
 */
export async function getSurveys(): Promise<Survey[]> {
    const db = await getMongoDb();
    return db.collection<Survey>(CollectionName.SURVEYS).find().toArray();
}

/**
 * Get active surveys by type
 */
export async function getActiveSurveysByType(
    type: SurveyType
): Promise<Survey[]> {
    const db = await getMongoDb();
    return db
        .collection<Survey>(CollectionName.SURVEYS)
        .find({ type, isActive: true })
        .toArray();
}

/**
 * Get a survey by MongoDB _id
 */
export async function getSurveyById(id: string): Promise<Survey | null> {
    const db = await getMongoDb();
    return db.collection<Survey>(CollectionName.SURVEYS).findOne({
        _id: new ObjectId(id)
    });
}

/**
 * Get a survey by slug
 */
export async function getSurveyBySlug(slug: string): Promise<Survey | null> {
    const db = await getMongoDb();
    return db.collection<Survey>(CollectionName.SURVEYS).findOne({ slug });
}

/**
 * Get the active onboarding survey
 */
export async function getActiveOnboardingSurvey(): Promise<Survey | null> {
    const db = await getMongoDb();
    return db.collection<Survey>(CollectionName.SURVEYS).findOne({
        type: 'onboarding',
        isActive: true
    });
}

/**
 * Create a new survey
 */
export async function createSurvey(data: SurveyInsert): Promise<Survey> {
    const db = await getMongoDb();
    const now = new Date();

    const doc = {
        ...data,
        isActive: data.isActive ?? true,
        createdAt: now,
        updatedAt: now
    };

    const result = await db
        .collection<Survey>(CollectionName.SURVEYS)
        .insertOne(doc as Survey);

    return {
        _id: result.insertedId,
        ...doc
    } as Survey;
}

/**
 * Update a survey by MongoDB _id
 */
export async function updateSurvey(
    id: string,
    data: SurveyUpdate
): Promise<Survey | null> {
    const db = await getMongoDb();

    const result = await db
        .collection<Survey>(CollectionName.SURVEYS)
        .findOneAndUpdate(
            { _id: new ObjectId(id) },
            {
                $set: {
                    ...data,
                    updatedAt: new Date()
                }
            },
            { returnDocument: 'after' }
        );

    return result;
}

/**
 * Delete a survey by MongoDB _id
 */
export async function deleteSurvey(id: string): Promise<boolean> {
    const db = await getMongoDb();

    const result = await db
        .collection<Survey>(CollectionName.SURVEYS)
        .deleteOne({ _id: new ObjectId(id) });

    return result.deletedCount > 0;
}

/**
 * Get surveys with response counts
 */
export async function getSurveysWithResponseCounts(): Promise<
    SurveyWithResponseCount[]
> {
    const db = await getMongoDb();

    const surveys = await db
        .collection<Survey>(CollectionName.SURVEYS)
        .find()
        .toArray();

    // Get response counts for each survey
    const surveysWithCounts = await Promise.all(
        surveys.map(async survey => {
            const responseCount = await db
                .collection(CollectionName.SURVEY_RESPONSES)
                .countDocuments({ surveyId: survey._id });

            return {
                ...survey,
                responseCount
            };
        })
    );

    return surveysWithCounts;
}

/**
 * Deactivate all surveys of a given type
 */
export async function deactivateSurveysByType(
    type: SurveyType
): Promise<number> {
    const db = await getMongoDb();

    const result = await db
        .collection<Survey>(CollectionName.SURVEYS)
        .updateMany(
            { type },
            {
                $set: {
                    isActive: false,
                    updatedAt: new Date()
                }
            }
        );

    return result.modifiedCount;
}
