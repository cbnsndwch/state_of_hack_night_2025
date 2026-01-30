import { ObjectId } from 'mongodb';
import { getMongoDb, CollectionName } from '@/utils/mongodb.server';
import type {
    SurveyResponse,
    SurveyResponseInsert,
    SurveyResponseUpdate,
    SurveyResponseWithProfile
} from '@/types/mongodb';

/**
 * Get all survey responses for a survey
 */
export async function getSurveyResponses(
    surveyId: string
): Promise<SurveyResponse[]> {
    const db = await getMongoDb();
    return db
        .collection<SurveyResponse>(CollectionName.SURVEY_RESPONSES)
        .find({ surveyId: new ObjectId(surveyId) })
        .toArray();
}

/**
 * Get a survey response by MongoDB _id
 */
export async function getSurveyResponseById(
    id: string
): Promise<SurveyResponse | null> {
    const db = await getMongoDb();
    return db
        .collection<SurveyResponse>(CollectionName.SURVEY_RESPONSES)
        .findOne({
            _id: new ObjectId(id)
        });
}

/**
 * Get a member's response to a specific survey
 */
export async function getMemberSurveyResponse(
    surveyId: string,
    memberId: string
): Promise<SurveyResponse | null> {
    const db = await getMongoDb();
    return db
        .collection<SurveyResponse>(CollectionName.SURVEY_RESPONSES)
        .findOne({
            surveyId: new ObjectId(surveyId),
            memberId: new ObjectId(memberId)
        });
}

/**
 * Get all survey responses for a member
 */
export async function getMemberSurveyResponses(
    memberId: string
): Promise<SurveyResponse[]> {
    const db = await getMongoDb();
    return db
        .collection<SurveyResponse>(CollectionName.SURVEY_RESPONSES)
        .find({ memberId: new ObjectId(memberId) })
        .toArray();
}

/**
 * Create a new survey response (or update if exists)
 */
export async function upsertSurveyResponse(
    data: SurveyResponseInsert
): Promise<SurveyResponse> {
    const db = await getMongoDb();
    const now = new Date();

    const existing = await getMemberSurveyResponse(
        data.surveyId.toString(),
        data.memberId.toString()
    );

    if (existing) {
        // Update existing response
        const updated = await updateSurveyResponse(existing._id.toString(), {
            responses: data.responses,
            isComplete: data.isComplete,
            submittedAt: data.submittedAt
        });
        return updated!;
    }

    // Create new response
    const doc = {
        ...data,
        responses: data.responses ?? {},
        isComplete: data.isComplete ?? false,
        submittedAt: data.submittedAt ?? now,
        createdAt: now,
        updatedAt: now
    };

    const result = await db
        .collection<SurveyResponse>(CollectionName.SURVEY_RESPONSES)
        .insertOne(doc as SurveyResponse);

    return {
        _id: result.insertedId,
        ...doc
    } as SurveyResponse;
}

/**
 * Update a survey response by MongoDB _id
 */
export async function updateSurveyResponse(
    id: string,
    data: SurveyResponseUpdate
): Promise<SurveyResponse | null> {
    const db = await getMongoDb();

    const result = await db
        .collection<SurveyResponse>(CollectionName.SURVEY_RESPONSES)
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
 * Delete a survey response by MongoDB _id
 */
export async function deleteSurveyResponse(id: string): Promise<boolean> {
    const db = await getMongoDb();

    const result = await db
        .collection<SurveyResponse>(CollectionName.SURVEY_RESPONSES)
        .deleteOne({ _id: new ObjectId(id) });

    return result.deletedCount > 0;
}

/**
 * Get completed survey responses for a survey with profile info
 */
export async function getCompletedSurveyResponsesWithProfiles(
    surveyId: string
): Promise<SurveyResponseWithProfile[]> {
    const db = await getMongoDb();

    const responses = await db
        .collection(CollectionName.SURVEY_RESPONSES)
        .aggregate<SurveyResponseWithProfile>([
            {
                $match: {
                    surveyId: new ObjectId(surveyId),
                    isComplete: true
                }
            },
            {
                $lookup: {
                    from: CollectionName.PROFILES,
                    localField: 'memberId',
                    foreignField: '_id',
                    as: 'memberData'
                }
            },
            {
                $unwind: '$memberData'
            },
            {
                $project: {
                    _id: 1,
                    surveyId: 1,
                    responses: 1,
                    isComplete: 1,
                    submittedAt: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    member: {
                        _id: '$memberData._id',
                        lumaEmail: '$memberData.lumaEmail',
                        githubUsername: '$memberData.githubUsername'
                    }
                }
            }
        ])
        .toArray();

    return responses;
}

/**
 * Get aggregate statistics for a survey question
 */
export async function getSurveyQuestionStats(
    surveyId: string,
    questionId: string
): Promise<{
    totalResponses: number;
    answerCounts: Record<string, number>;
}> {
    const db = await getMongoDb();

    const responses = await db
        .collection<SurveyResponse>(CollectionName.SURVEY_RESPONSES)
        .find({
            surveyId: new ObjectId(surveyId),
            isComplete: true,
            [`responses.${questionId}`]: { $exists: true }
        })
        .toArray();

    const answerCounts: Record<string, number> = {};

    responses.forEach(response => {
        const answer = response.responses[questionId];
        if (!answer) return;

        if (answer.type === 'multiple-choice' && Array.isArray(answer.value)) {
            // Count each selected option
            answer.value.forEach(option => {
                answerCounts[option] = (answerCounts[option] || 0) + 1;
            });
        } else if (
            answer.type === 'single-choice' ||
            answer.type === 'text' ||
            answer.type === 'textarea'
        ) {
            const key = String(answer.value);
            answerCounts[key] = (answerCounts[key] || 0) + 1;
        } else if (answer.type === 'boolean') {
            const key = answer.value ? 'true' : 'false';
            answerCounts[key] = (answerCounts[key] || 0) + 1;
        } else if (answer.type === 'scale') {
            const key = String(answer.value);
            answerCounts[key] = (answerCounts[key] || 0) + 1;
        }
    });

    return {
        totalResponses: responses.length,
        answerCounts
    };
}

/**
 * Check if member has completed a survey
 */
export async function hasMemberCompletedSurvey(
    surveyId: string,
    memberId: string
): Promise<boolean> {
    const db = await getMongoDb();

    const response = await db
        .collection<SurveyResponse>(CollectionName.SURVEY_RESPONSES)
        .findOne({
            surveyId: new ObjectId(surveyId),
            memberId: new ObjectId(memberId),
            isComplete: true
        });

    return response !== null;
}

/**
 * Get member's completed surveys with survey details (aggregation)
 */
export async function getMemberCompletedSurveysWithDetails(
    memberId: string
): Promise<
    Array<{
        _id: ObjectId;
        surveyId: ObjectId;
        surveySlug: string;
        surveyTitle: string;
        surveyDescription: string;
        submittedAt: Date;
    }>
> {
    const db = await getMongoDb();

    const results = await db
        .collection<SurveyResponse>(CollectionName.SURVEY_RESPONSES)
        .aggregate([
            {
                $match: {
                    memberId: new ObjectId(memberId),
                    isComplete: true
                }
            },
            {
                $lookup: {
                    from: CollectionName.SURVEYS,
                    localField: 'surveyId',
                    foreignField: '_id',
                    as: 'survey'
                }
            },
            {
                $unwind: '$survey'
            },
            {
                $project: {
                    _id: 1,
                    surveyId: '$survey._id',
                    surveySlug: '$survey.slug',
                    surveyTitle: '$survey.title',
                    surveyDescription: '$survey.description',
                    submittedAt: 1
                }
            },
            {
                $sort: { submittedAt: -1 }
            }
        ])
        .toArray();

    return results as Array<{
        _id: ObjectId;
        surveyId: ObjectId;
        surveySlug: string;
        surveyTitle: string;
        surveyDescription: string;
        submittedAt: Date;
    }>;
}
