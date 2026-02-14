/**
 * PostgreSQL data access layer for Survey Responses
 * Type-safe queries using Drizzle ORM.
 */

import { db } from './provider.server';
import {
    surveyResponses,
    surveys as surveysTable,
    profiles as profilesTable
} from '@drizzle/schema';
import { eq, and, desc, count } from 'drizzle-orm';
import type {
    SurveyResponse,
    SurveyResponseInsert,
    SurveyResponseUpdate,
    SurveyResponseWithProfile
} from '@/types/adapters';

/**
 * Get all responses for a survey
 */
export async function getSurveyResponses(
    surveyId: string
): Promise<SurveyResponse[]> {
    return db
        .select()
        .from(surveyResponses)
        .where(eq(surveyResponses.surveyId, surveyId))
        .orderBy(desc(surveyResponses.submittedAt));
}

/**
 * Get a survey response by ID
 */
export async function getSurveyResponseById(
    id: string
): Promise<SurveyResponse | null> {
    const result = await db
        .select()
        .from(surveyResponses)
        .where(eq(surveyResponses.id, id));

    return result[0] || null;
}

/**
 * Get a member's response to a specific survey
 */
export async function getMemberSurveyResponse(
    surveyId: string,
    memberId: string
): Promise<SurveyResponse | null> {
    const result = await db
        .select()
        .from(surveyResponses)
        .where(
            and(
                eq(surveyResponses.surveyId, surveyId),
                eq(surveyResponses.memberId, memberId)
            )
        );

    return result[0] || null;
}

/**
 * Get all survey responses for a member
 */
export async function getMemberSurveyResponses(
    memberId: string
): Promise<SurveyResponse[]> {
    return db
        .select()
        .from(surveyResponses)
        .where(eq(surveyResponses.memberId, memberId))
        .orderBy(desc(surveyResponses.submittedAt));
}

/**
 * Create a new survey response (or update if exists)
 */
export async function upsertSurveyResponse(
    data: SurveyResponseInsert
): Promise<SurveyResponse> {
    const existing = await getMemberSurveyResponse(
        data.surveyId,
        data.memberId
    );

    if (existing) {
        // Update existing response
        const [updated] = await db
            .update(surveyResponses)
            .set({
                responses: data.responses,
                isComplete: data.isComplete,
                submittedAt: data.submittedAt,
                updatedAt: new Date()
            })
            .where(eq(surveyResponses.id, existing.id))
            .returning();

        return updated;
    }

    // Create new response
    const [created] = await db
        .insert(surveyResponses)
        .values({
            surveyId: data.surveyId,
            memberId: data.memberId,
            responses: data.responses || {},
            isComplete: data.isComplete ?? false,
            submittedAt: data.submittedAt || new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        })
        .returning();

    return created;
}

/**
 * Update a survey response
 */
export async function updateSurveyResponse(
    id: string,
    data: SurveyResponseUpdate
): Promise<SurveyResponse | null> {
    const [updated] = await db
        .update(surveyResponses)
        .set({
            ...data,
            updatedAt: new Date()
        })
        .where(eq(surveyResponses.id, id))
        .returning();

    return updated || null;
}

/**
 * Delete a survey response
 */
export async function deleteSurveyResponse(id: string): Promise<boolean> {
    const result = await db
        .delete(surveyResponses)
        .where(eq(surveyResponses.id, id));

    return (result.rowCount ?? 0) > 0;
}

/**
 * Get completed survey responses for a survey with profile info
 */
export async function getCompletedSurveyResponsesWithProfiles(
    surveyId: string
): Promise<SurveyResponseWithProfile[]> {
    const responses = await db
        .select({
            id: surveyResponses.id,
            surveyId: surveyResponses.surveyId,
            responses: surveyResponses.responses,
            isComplete: surveyResponses.isComplete,
            submittedAt: surveyResponses.submittedAt,
            createdAt: surveyResponses.createdAt,
            updatedAt: surveyResponses.updatedAt,
            memberId: profilesTable.id,
            memberEmail: profilesTable.lumaEmail,
            memberGithub: profilesTable.githubUsername
        })
        .from(surveyResponses)
        .leftJoin(profilesTable, eq(surveyResponses.memberId, profilesTable.id))
        .where(
            and(
                eq(surveyResponses.surveyId, surveyId),
                eq(surveyResponses.isComplete, true)
            )
        );

    return responses
        .filter(r => r.memberId !== null)
        .map(r => ({
            id: r.id,
            surveyId: r.surveyId,
            responses: r.responses,
            isComplete: r.isComplete,
            submittedAt: r.submittedAt,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
            member: {
                id: r.memberId!,
                lumaEmail: r.memberEmail!,
                githubUsername: r.memberGithub
            }
        }));
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
    const responses = await getSurveyResponses(surveyId);
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
 * Check if member has completed a survey
 */
export async function hasMemberCompletedSurvey(
    surveyId: string,
    memberId: string
): Promise<boolean> {
    const result = await db
        .select()
        .from(surveyResponses)
        .where(
            and(
                eq(surveyResponses.surveyId, surveyId),
                eq(surveyResponses.memberId, memberId),
                eq(surveyResponses.isComplete, true)
            )
        );

    return result.length > 0;
}

/**
 * Get member's completed surveys with survey details
 */
export async function getMemberCompletedSurveysWithDetails(
    memberId: string
): Promise<
    Array<{
        id: string;
        surveyId: string;
        surveySlug: string;
        surveyTitle: string;
        surveyDescription: string;
        submittedAt: Date;
    }>
> {
    const responses = await getMemberSurveyResponses(memberId);
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
                    id: response.id,
                    surveyId: response.surveyId,
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

/**
 * Get response count for a survey
 */
export async function getSurveyResponseCount(
    surveyId: string
): Promise<number> {
    const result = await db
        .select({ count: count() })
        .from(surveyResponses)
        .where(eq(surveyResponses.surveyId, surveyId));

    return result[0]?.count || 0;
}

/**
 * Delete all responses for a survey
 */
export async function deleteSurveyResponses(surveyId: string): Promise<number> {
    const result = await db
        .delete(surveyResponses)
        .where(eq(surveyResponses.surveyId, surveyId));

    return result.rowCount ?? 0;
}
