/**
 * PostgreSQL adapter for Survey Responses
 * Wraps survey-responses.postgres.server.ts to maintain backward compatibility with existing routes
 * Converts between Postgres UUIDs and MongoDB-compatible ObjectId interface
 */

import * as surveyResponsesDb from './survey-responses.postgres.server';
import { db } from './provider.server';
import {
    surveyResponses as surveyResponsesTable,
    surveys as surveysTable,
    profiles as profilesTable
} from '@drizzle/schema';
import { eq, and } from 'drizzle-orm';
import type {
    SurveyResponse,
    SurveyResponseInsert,
    SurveyResponseUpdate,
    SurveyResponseWithProfile
} from '@/types/adapters';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Convert Postgres survey response to MongoDB-compatible format
 */
function toMongoSurveyResponse(pgResponse: any): SurveyResponse {
    return {
        _id: pgResponse.id as any,
        surveyId: pgResponse.surveyId as any,
        memberId: pgResponse.memberId as any,
        responses: pgResponse.responses || {},
        isComplete: pgResponse.isComplete,
        submittedAt: pgResponse.submittedAt,
        createdAt: pgResponse.createdAt,
        updatedAt: pgResponse.updatedAt
    };
}

/**
 * Get all survey responses for a survey - adapter maintains MongoDB interface
 */
export async function getSurveyResponses(
    surveyId: string
): Promise<SurveyResponse[]> {
    const responses = await surveyResponsesDb.getSurveyResponses(surveyId);
    return responses.map(toMongoSurveyResponse);
}

/**
 * Get a survey response by ID - adapter maintains MongoDB interface
 */
export async function getSurveyResponseById(
    id: string
): Promise<SurveyResponse | null> {
    const response = await surveyResponsesDb.getSurveyResponseById(id);
    return response ? toMongoSurveyResponse(response) : null;
}

/**
 * Get a member's response to a specific survey - adapter maintains MongoDB interface
 */
export async function getMemberSurveyResponse(
    surveyId: string,
    memberId: string
): Promise<SurveyResponse | null> {
    const response = await surveyResponsesDb.getSurveyResponse(
        surveyId,
        memberId
    );
    return response ? toMongoSurveyResponse(response) : null;
}

/**
 * Get all survey responses for a member - adapter maintains MongoDB interface
 */
export async function getMemberSurveyResponses(
    memberId: string
): Promise<SurveyResponse[]> {
    const responses = await surveyResponsesDb.getMemberResponses(memberId);
    return responses.map(toMongoSurveyResponse);
}

/**
 * Create a new survey response (or update if exists) - adapter maintains MongoDB interface
 */
export async function upsertSurveyResponse(
    data: SurveyResponseInsert
): Promise<SurveyResponse> {
    const surveyId = data.surveyId as any as string;
    const memberId = data.memberId as any as string;

    const existing = await getMemberSurveyResponse(surveyId, memberId);

    if (existing) {
        // Update existing response
        const updated = await updateSurveyResponse(
            existing._id as any as string,
            {
                responses: data.responses,
                isComplete: data.isComplete,
                submittedAt: data.submittedAt
            }
        );
        return updated!;
    }

    // Create new response
    const created = await surveyResponsesDb.createSurveyResponse({
        surveyId,
        memberId,
        responses: data.responses || {},
        isComplete: data.isComplete
    });
    return toMongoSurveyResponse(created);
}

/**
 * Update a survey response - adapter maintains MongoDB interface
 */
export async function updateSurveyResponse(
    id: string,
    data: SurveyResponseUpdate
): Promise<SurveyResponse | null> {
    // This is complex since we need to find the surveyId/memberId first
    const response = await getSurveyResponseById(id);
    if (!response) return null;

    const surveyId = response.surveyId as any as string;
    const memberId = response.memberId as any as string;

    const updated = await surveyResponsesDb.updateSurveyResponse(
        surveyId,
        memberId,
        data
    );
    return updated ? toMongoSurveyResponse(updated) : null;
}

/**
 * Delete a survey response - adapter delegates to Postgres
 */
export async function deleteSurveyResponse(id: string): Promise<boolean> {
    return surveyResponsesDb.deleteSurveyResponse(id);
}

/**
 * Get completed survey responses for a survey with profile info - adapter maintains MongoDB interface
 */
export async function getCompletedSurveyResponsesWithProfiles(
    surveyId: string
): Promise<SurveyResponseWithProfile[]> {
    const responses = await db
        .select({
            id: surveyResponsesTable.id,
            surveyId: surveyResponsesTable.surveyId,
            memberId: surveyResponsesTable.memberId,
            responses: surveyResponsesTable.responses,
            isComplete: surveyResponsesTable.isComplete,
            submittedAt: surveyResponsesTable.submittedAt,
            createdAt: surveyResponsesTable.createdAt,
            updatedAt: surveyResponsesTable.updatedAt,
            member: {
                id: profilesTable.id,
                lumaEmail: profilesTable.lumaEmail,
                githubUsername: profilesTable.githubUsername
            }
        })
        .from(surveyResponsesTable)
        .leftJoin(
            profilesTable,
            eq(surveyResponsesTable.memberId, profilesTable.id)
        )
        .where(
            and(
                eq(surveyResponsesTable.surveyId, surveyId),
                eq(surveyResponsesTable.isComplete, true)
            )
        );

    return responses.map((r: any) => ({
        _id: r.id as any,
        surveyId: r.surveyId as any,
        responses: r.responses,
        isComplete: r.isComplete,
        submittedAt: r.submittedAt,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        member: {
            _id: r.member.id as any,
            lumaEmail: r.member.lumaEmail,
            githubUsername: r.member.githubUsername
        }
    }));
}

/**
 * Get aggregate statistics for a survey question - adapter maintains MongoDB interface
 */
export async function getSurveyQuestionStats(
    surveyId: string,
    questionId: string
): Promise<{
    totalResponses: number;
    answerCounts: Record<string, number>;
}> {
    const responses = await surveyResponsesDb.getSurveyResponses(surveyId);
    const completedResponses = responses.filter(r => r.isComplete);

    const answerCounts: Record<string, number> = {};

    completedResponses.forEach(response => {
        const answer = response.responses[questionId];
        if (!answer) return;

        if (answer.type === 'multiple-choice' && Array.isArray(answer.value)) {
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
        totalResponses: completedResponses.length,
        answerCounts
    };
}

/**
 * Check if member has completed a survey - adapter maintains MongoDB interface
 */
export async function hasMemberCompletedSurvey(
    surveyId: string,
    memberId: string
): Promise<boolean> {
    return surveyResponsesDb.hasMemberResponded(surveyId, memberId);
}

/**
 * Get member's completed surveys with survey details - adapter maintains MongoDB interface
 */
export async function getMemberCompletedSurveysWithDetails(
    memberId: string
): Promise<
    Array<{
        _id: any;
        surveyId: any;
        surveySlug: string;
        surveyTitle: string;
        surveyDescription: string;
        submittedAt: Date;
    }>
> {
    const responses = await surveyResponsesDb.getMemberResponses(memberId);
    const completedResponses = responses.filter(r => r.isComplete);

    const surveysMap = new Map();

    // Fetch survey details for each response
    await Promise.all(
        completedResponses.map(async response => {
            const survey = await db
                .select()
                .from(surveysTable)
                .where(eq(surveysTable.id, response.surveyId));

            if (survey[0]) {
                surveysMap.set(response.surveyId, {
                    _id: response.id as any,
                    surveyId: response.surveyId as any,
                    surveySlug: survey[0].slug,
                    surveyTitle: survey[0].title,
                    surveyDescription: survey[0].description,
                    submittedAt: response.submittedAt
                });
            }
        })
    );

    return Array.from(surveysMap.values()).sort(
        (a, b) => b.submittedAt.getTime() - a.submittedAt.getTime()
    );
}
