/**
 * API route for survey response submission.
 * POST /api/survey-response - Submit or update a survey response
 *
 * This route handles survey response submissions by:
 * 1. Recording the response via Zero sync (for real-time updates)
 * 2. Validating survey existence and status (server-side)
 * 3. Validating required responses if marked complete (server-side)
 */

import { data, type ActionFunctionArgs } from 'react-router';
import { getAuth } from '@clerk/react-router/server';
import { getProfileByClerkUserId } from '@/lib/db/profiles.server';
import { getMemberSurveyResponse } from '@/lib/db/survey-responses.server';
import { getSurveyById } from '@/lib/db/surveys.server';
import type { SurveyAnswer } from '@/types/adapters';

/**
 * GET handler - Not supported (survey responses are POST only)
 */
export async function loader() {
    return data({ error: 'Method not allowed' }, { status: 405 });
}

/**
 * POST handler - Submit or update a survey response
 */
export async function action(args: ActionFunctionArgs) {
    if (args.request.method !== 'POST') {
        return data({ error: 'Method not allowed' }, { status: 405 });
    }

    try {
        // Verify user is authenticated with Clerk
        const auth = await getAuth(args);
        if (!auth.userId) {
            return data({ error: 'Authentication required' }, { status: 401 });
        }

        // Get the authenticated user's profile
        const userProfile = await getProfileByClerkUserId(auth.userId);
        if (!userProfile) {
            return data(
                {
                    error: 'Profile not found. Please complete onboarding first.'
                },
                { status: 404 }
            );
        }

        const formData = await args.request.formData();
        const surveyId = formData.get('surveyId')?.toString();
        const responsesJson = formData.get('responses')?.toString();
        const isComplete = formData.get('isComplete') !== 'false'; // defaults to true

        // Use the authenticated user's memberId (profile ID)
        const memberId = userProfile.id.toString();

        // Validate required fields
        if (!surveyId) {
            return data(
                { error: 'Missing required field: surveyId' },
                { status: 400 }
            );
        }

        if (!responsesJson) {
            return data(
                { error: 'Missing required field: responses' },
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
            memberId
        );

        // Submit survey response via Zero mutator for real-time sync
        // Note: We call the Zero mutator endpoint internally to ensure the response
        // record syncs to all connected clients in real-time
        const mutateResponse = await fetch(
            new URL('/api/zero/mutate', args.request.url),
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Forward the original authorization header
                    Cookie: args.request.headers.get('Cookie') || ''
                },
                body: JSON.stringify({
                    mutations: [
                        {
                            id: Math.random(),
                            clientID: 'server-survey-response',
                            name: 'surveyResponses.submit',
                            args: {
                                surveyId,
                                memberId,
                                responses,
                                isComplete
                            }
                        }
                    ]
                })
            }
        );

        if (!mutateResponse.ok) {
            const errorData = await mutateResponse.json();
            return data(
                {
                    error: 'Failed to save survey response',
                    message: errorData.error || 'Unknown error'
                },
                { status: 500 }
            );
        }

        const mutateResult = await mutateResponse.json();

        // Check if the mutation returned an error
        if (mutateResult[0]?.result?.error) {
            return data(
                {
                    error: 'Failed to save survey response',
                    message:
                        mutateResult[0].result.message ||
                        'Survey response mutation failed'
                },
                { status: 500 }
            );
        }

        // Fetch the updated response record
        const savedResponse = await getMemberSurveyResponse(surveyId, memberId);

        if (!savedResponse) {
            return data(
                { error: 'Failed to retrieve survey response record' },
                { status: 500 }
            );
        }

        return data(
            {
                success: true,
                message: existingResponse
                    ? 'Survey response updated successfully'
                    : 'Survey response submitted successfully',
                response: {
                    id: savedResponse.id.toString(),
                    surveyId: savedResponse.surveyId.toString(),
                    memberId: savedResponse.memberId.toString(),
                    isComplete: savedResponse.isComplete,
                    submittedAt:
                        savedResponse.submittedAt?.toISOString() ?? null
                }
            },
            { status: existingResponse ? 200 : 201 }
        );
    } catch (error) {
        console.error('Error processing survey response:', error);
        return data(
            {
                error: 'Failed to process survey response',
                message:
                    error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
