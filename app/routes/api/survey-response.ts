import { data, type ActionFunctionArgs } from 'react-router';
import { getProfileByClerkUserId } from '@/lib/db/profiles.server';
import {
    upsertSurveyResponse,
    getMemberSurveyResponse
} from '@/lib/db/survey-responses.server';
import { getSurveyById } from '@/lib/db/surveys.server';
import type { SurveyAnswer } from '@/types/adapters';

/**
 * API endpoint for creating/updating survey responses
 * POST /api/survey-response
 *
 * Expected FormData fields:
 * - surveyId: string (MongoDB ObjectId as string)
 * - clerkUserId: string (to identify the member)
 * - responses: string (JSON stringified Record<string, SurveyAnswer>)
 * - isComplete: 'true' | 'false' (optional, defaults to true)
 */
export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== 'POST') {
        return data({ error: 'Method not allowed' }, { status: 405 });
    }

    try {
        const formData = await request.formData();

        // Extract and validate required fields
        const surveyId = formData.get('surveyId') as string;
        const clerkUserId = formData.get('clerkUserId') as string;
        const responsesJson = formData.get('responses') as string;
        const isComplete = formData.get('isComplete') !== 'false'; // defaults to true

        // Validate required fields
        if (!surveyId) {
            return data({ error: 'Survey ID is required' }, { status: 400 });
        }

        if (!clerkUserId) {
            return data(
                { error: 'User authentication required' },
                { status: 401 }
            );
        }

        if (!responsesJson) {
            return data(
                { error: 'Survey responses are required' },
                { status: 400 }
            );
        }

        // Verify survey exists and is valid
        const survey = await getSurveyById(surveyId);
        if (!survey) {
            return data({ error: 'Survey not found' }, { status: 404 });
        }

        if (!survey.isActive) {
            return data(
                { error: 'Survey is no longer accepting responses' },
                { status: 400 }
            );
        }

        // Get member profile
        const profile = await getProfileByClerkUserId(clerkUserId);
        if (!profile) {
            return data({ error: 'User profile not found' }, { status: 404 });
        }

        // Parse responses JSON
        let responses: Record<string, SurveyAnswer>;
        try {
            responses = JSON.parse(responsesJson);
        } catch {
            return data({ error: 'Invalid responses format' }, { status: 400 });
        }

        // Validate that all required questions are answered if isComplete is true
        if (isComplete) {
            const requiredQuestions = survey.questions.filter(q => q.required);
            const missingResponses = requiredQuestions.filter(
                q => !responses[q.id]
            );

            if (missingResponses.length > 0) {
                return data(
                    {
                        error: 'Missing required responses',
                        missingQuestions: missingResponses.map(q => q.id)
                    },
                    { status: 400 }
                );
            }
        }

        // Check if user has already responded to this survey
        const existingResponse = await getMemberSurveyResponse(
            surveyId,
            profile._id.toString()
        );

        // Upsert the survey response
        const savedResponse = await upsertSurveyResponse({
            surveyId: surveyId,
            memberId: profile._id,
            responses,
            isComplete,
            submittedAt: new Date()
        });

        return data(
            {
                success: true,
                message: existingResponse
                    ? 'Survey response updated successfully'
                    : 'Survey response submitted successfully',
                response: {
                    id: savedResponse._id.toString(),
                    surveyId: savedResponse.surveyId.toString(),
                    memberId: savedResponse.memberId.toString(),
                    isComplete: savedResponse.isComplete,
                    submittedAt: savedResponse.submittedAt.toISOString()
                }
            },
            { status: existingResponse ? 200 : 201 }
        );
    } catch (error) {
        console.error('Error saving survey response:', error);
        return data(
            {
                error: 'Failed to save survey response',
                details:
                    error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
