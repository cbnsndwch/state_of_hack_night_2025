/**
 * PostgreSQL data access layer for Surveys
 * Type-safe queries using Drizzle ORM.
 */

import { db } from './provider.server';
import { surveys } from '@drizzle/schema';
import { eq, and, desc, count } from 'drizzle-orm';
import { getSurveyResponseCount as getResponseCount } from './survey-responses.server';
import type {
    Survey,
    SurveyInsert,
    SurveyUpdate,
    SurveyWithResponseCount,
    SurveyType
} from '@/types/adapters';

/**
 * Get all surveys
 */
export async function getSurveys(): Promise<Survey[]> {
    return db.select().from(surveys).orderBy(desc(surveys.createdAt));
}

/**
 * Get active surveys by type
 */
export async function getActiveSurveysByType(
    type: SurveyType
): Promise<Survey[]> {
    return db
        .select()
        .from(surveys)
        .where(and(eq(surveys.type, type), eq(surveys.isActive, true)))
        .orderBy(desc(surveys.createdAt));
}

/**
 * Get a survey by ID
 */
export async function getSurveyById(id: string): Promise<Survey | null> {
    const result = await db.select().from(surveys).where(eq(surveys.id, id));

    return result[0] || null;
}

/**
 * Get a survey by slug
 */
export async function getSurveyBySlug(slug: string): Promise<Survey | null> {
    const result = await db
        .select()
        .from(surveys)
        .where(eq(surveys.slug, slug));

    return result[0] || null;
}

/**
 * Get the active onboarding survey
 */
export async function getActiveOnboardingSurvey(): Promise<Survey | null> {
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
export async function createSurvey(data: SurveyInsert): Promise<Survey> {
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
export async function updateSurvey(
    id: string,
    data: SurveyUpdate
): Promise<Survey | null> {
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
 * Delete a survey by ID
 */
export async function deleteSurvey(id: string): Promise<boolean> {
    const result = await db.delete(surveys).where(eq(surveys.id, id));

    return (result.rowCount ?? 0) > 0;
}

/**
 * Get surveys with response counts
 */
export async function getSurveysWithResponseCounts(): Promise<
    SurveyWithResponseCount[]
> {
    const allSurveys = await getSurveys();

    const surveysWithCounts: SurveyWithResponseCount[] = await Promise.all(
        allSurveys.map(async survey => {
            const responseCount = await getResponseCount(survey.id);
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
    const surveysToUpdate = await db
        .select()
        .from(surveys)
        .where(eq(surveys.type, type));

    let updateCount = 0;
    for (const survey of surveysToUpdate) {
        const updated = await updateSurvey(survey.id, {
            isActive: false
        });
        if (updated) updateCount++;
    }

    return updateCount;
}

/**
 * Count total surveys
 */
export async function countSurveys(): Promise<number> {
    const result = await db.select({ count: count() }).from(surveys);

    return result[0]?.count || 0;
}
