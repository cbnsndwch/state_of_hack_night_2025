/**
 * PostgreSQL data access layer for Surveys
 * This replaces the MongoDB-based surveys.server.ts for the new Postgres/Zero architecture.
 * Type-safe queries using Drizzle ORM.
 */

import { db } from './provider.server';
import { surveys, surveyResponses } from '@drizzle/schema';
import { eq, and, desc, count } from 'drizzle-orm';

export type SurveyType = 'onboarding' | 'annual' | 'event';

export interface SurveyQuestion {
    id: string;
    text: string;
    type:
        | 'text'
        | 'textarea'
        | 'single-choice'
        | 'multiple-choice'
        | 'scale'
        | 'boolean';
    required: boolean;
    options?: string[];
    scale?: {
        min: number;
        max: number;
        minLabel?: string;
        maxLabel?: string;
    };
    helpText?: string;
}

export interface SurveyInput {
    slug: string;
    title: string;
    description: string;
    type: SurveyType;
    isActive?: boolean;
    questions: SurveyQuestion[];
}

export interface SurveyUpdate {
    title?: string;
    description?: string;
    isActive?: boolean;
    questions?: SurveyQuestion[];
}

/**
 * Get all surveys
 */
export async function getSurveys() {
    return db.select().from(surveys).orderBy(desc(surveys.createdAt));
}

/**
 * Get active surveys by type
 */
export async function getActiveSurveysByType(type: SurveyType) {
    return db
        .select()
        .from(surveys)
        .where(and(eq(surveys.type, type), eq(surveys.isActive, true)))
        .orderBy(desc(surveys.createdAt));
}

/**
 * Get a survey by ID
 */
export async function getSurveyById(id: string) {
    const result = await db.select().from(surveys).where(eq(surveys.id, id));

    return result[0] || null;
}

/**
 * Get a survey by slug
 */
export async function getSurveyBySlug(slug: string) {
    const result = await db
        .select()
        .from(surveys)
        .where(eq(surveys.slug, slug));

    return result[0] || null;
}

/**
 * Get the active onboarding survey
 */
export async function getActiveOnboardingSurvey() {
    const result = await db
        .select()
        .from(surveys)
        .where(and(eq(surveys.type, 'onboarding'), eq(surveys.isActive, true)))
        .orderBy(desc(surveys.createdAt))
        .limit(1);

    return result[0] || null;
}

/**
 * Create a new survey
 */
export async function createSurvey(data: SurveyInput) {
    const [survey] = await db
        .insert(surveys)
        .values({
            slug: data.slug,
            title: data.title,
            description: data.description,
            type: data.type,
            isActive: data.isActive ?? true,
            questions: data.questions,
            createdAt: new Date(),
            updatedAt: new Date()
        })
        .returning();

    return survey;
}

/**
 * Update a survey by ID
 */
export async function updateSurvey(id: string, data: SurveyUpdate) {
    const [updated] = await db
        .update(surveys)
        .set({
            ...data,
            updatedAt: new Date()
        })
        .where(eq(surveys.id, id))
        .returning();

    return updated || null;
}

/**
 * Get survey with response count
 */
export async function getSurveyWithResponseCount(id: string) {
    const survey = await getSurveyById(id);
    if (!survey) return null;

    const responseCountResult = await db
        .select({ count: count() })
        .from(surveyResponses)
        .where(eq(surveyResponses.surveyId, id));

    return {
        ...survey,
        responseCount: responseCountResult[0]?.count || 0
    };
}

/**
 * Delete a survey by ID
 */
export async function deleteSurvey(id: string): Promise<boolean> {
    const result = await db.delete(surveys).where(eq(surveys.id, id));

    return (result.rowCount ?? 0) > 0;
}

/**
 * Count total surveys
 */
export async function countSurveys() {
    const result = await db.select({ count: count() }).from(surveys);

    return result[0]?.count || 0;
}
