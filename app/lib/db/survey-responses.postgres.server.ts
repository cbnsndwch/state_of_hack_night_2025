/**
 * PostgreSQL data access layer for Survey Responses
 * This replaces the MongoDB-based survey-responses.server.ts for the new Postgres/Zero architecture.
 * Type-safe queries using Drizzle ORM.
 */

import { db } from './provider.server';
import { surveyResponses } from '@drizzle/schema';
import { eq, and, desc, count } from 'drizzle-orm';

export type ResponseValue =
    | { type: 'text'; value: string }
    | { type: 'textarea'; value: string }
    | { type: 'single-choice'; value: string }
    | { type: 'multiple-choice'; value: string[] }
    | { type: 'scale'; value: number }
    | { type: 'boolean'; value: boolean };

export interface SurveyResponseInput {
    surveyId: string;
    memberId: string;
    responses: Record<string, ResponseValue>;
    isComplete?: boolean;
}

export interface SurveyResponseUpdate {
    responses?: Record<string, ResponseValue>;
    isComplete?: boolean;
}

/**
 * Get all responses for a survey
 */
export async function getSurveyResponses(surveyId: string) {
    return db
        .select()
        .from(surveyResponses)
        .where(eq(surveyResponses.surveyId, surveyId))
        .orderBy(desc(surveyResponses.submittedAt));
}

/**
 * Get all responses by a member
 */
export async function getMemberResponses(memberId: string) {
    return db
        .select()
        .from(surveyResponses)
        .where(eq(surveyResponses.memberId, memberId))
        .orderBy(desc(surveyResponses.submittedAt));
}

/**
 * Get a specific survey response
 */
export async function getSurveyResponse(surveyId: string, memberId: string) {
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
 * Get a survey response by ID
 */
export async function getSurveyResponseById(id: string) {
    const result = await db
        .select()
        .from(surveyResponses)
        .where(eq(surveyResponses.id, id));

    return result[0] || null;
}

/**
 * Create a new survey response
 */
export async function createSurveyResponse(data: SurveyResponseInput) {
    const [response] = await db
        .insert(surveyResponses)
        .values({
            surveyId: data.surveyId,
            memberId: data.memberId,
            responses: data.responses,
            isComplete: data.isComplete ?? false,
            submittedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        })
        .returning();

    return response;
}

/**
 * Update a survey response
 */
export async function updateSurveyResponse(
    surveyId: string,
    memberId: string,
    data: SurveyResponseUpdate
) {
    const [updated] = await db
        .update(surveyResponses)
        .set({
            ...data,
            updatedAt: new Date()
        })
        .where(
            and(
                eq(surveyResponses.surveyId, surveyId),
                eq(surveyResponses.memberId, memberId)
            )
        )
        .returning();

    return updated || null;
}

/**
 * Check if a member has already responded to a survey
 */
export async function hasMemberResponded(
    surveyId: string,
    memberId: string
): Promise<boolean> {
    const result = await db
        .select()
        .from(surveyResponses)
        .where(
            and(
                eq(surveyResponses.surveyId, surveyId),
                eq(surveyResponses.memberId, memberId)
            )
        );

    return result.length > 0;
}

/**
 * Get response count for a survey
 */
export async function getSurveyResponseCount(surveyId: string) {
    const result = await db
        .select({ count: count() })
        .from(surveyResponses)
        .where(eq(surveyResponses.surveyId, surveyId));

    return result[0]?.count || 0;
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
 * Delete all responses for a survey
 */
export async function deleteSurveyResponses(surveyId: string): Promise<number> {
    const result = await db
        .delete(surveyResponses)
        .where(eq(surveyResponses.surveyId, surveyId));

    return result.rowCount ?? 0;
}
