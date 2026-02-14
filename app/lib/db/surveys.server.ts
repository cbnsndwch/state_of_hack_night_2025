/**
 * PostgreSQL adapter for Surveys
 * Wraps surveys.postgres.server.ts to maintain backward compatibility with existing routes
 * Converts between Postgres UUIDs and MongoDB-compatible ObjectId interface
 */

import * as surveysDb from './surveys.postgres.server';
import { db } from './provider.server';
import { surveys as surveysTable } from '@drizzle/schema';
import { eq } from 'drizzle-orm';
import type {
    Survey,
    SurveyInsert,
    SurveyUpdate,
    SurveyWithResponseCount,
    SurveyType
} from '@/types/adapters';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Convert Postgres survey to MongoDB-compatible format
 */
function toMongoSurvey(pgSurvey: any): Survey {
    return {
        _id: pgSurvey.id as any, // UUID as ObjectId placeholder
        slug: pgSurvey.slug,
        title: pgSurvey.title,
        description: pgSurvey.description,
        type: pgSurvey.type as SurveyType,
        isActive: pgSurvey.isActive,
        questions: pgSurvey.questions || [],
        createdAt: pgSurvey.createdAt,
        updatedAt: pgSurvey.updatedAt
    };
}

/**
 * Get all surveys - adapter maintains MongoDB interface
 */
export async function getSurveys(): Promise<Survey[]> {
    const surveys = await surveysDb.getSurveys();
    return surveys.map(toMongoSurvey);
}

/**
 * Get active surveys by type - adapter maintains MongoDB interface
 */
export async function getActiveSurveysByType(
    type: SurveyType
): Promise<Survey[]> {
    const surveys = await surveysDb.getActiveSurveysByType(type);
    return surveys.map(toMongoSurvey);
}

/**
 * Get a survey by ID - adapter maintains MongoDB interface
 */
export async function getSurveyById(id: string): Promise<Survey | null> {
    const survey = await surveysDb.getSurveyById(id);
    return survey ? toMongoSurvey(survey) : null;
}

/**
 * Get a survey by slug - adapter maintains MongoDB interface
 */
export async function getSurveyBySlug(slug: string): Promise<Survey | null> {
    const survey = await surveysDb.getSurveyBySlug(slug);
    return survey ? toMongoSurvey(survey) : null;
}

/**
 * Get the active onboarding survey - adapter maintains MongoDB interface
 */
export async function getActiveOnboardingSurvey(): Promise<Survey | null> {
    const survey = await surveysDb.getActiveOnboardingSurvey();
    return survey ? toMongoSurvey(survey) : null;
}

/**
 * Create a new survey - adapter maintains MongoDB interface
 */
export async function createSurvey(data: SurveyInsert): Promise<Survey> {
    const created = await surveysDb.createSurvey({
        slug: data.slug,
        title: data.title,
        description: data.description,
        type: data.type as any,
        isActive: data.isActive,
        questions: data.questions || []
    });
    return toMongoSurvey(created);
}

/**
 * Update a survey - adapter maintains MongoDB interface
 */
export async function updateSurvey(
    id: string,
    data: SurveyUpdate
): Promise<Survey | null> {
    const updated = await surveysDb.updateSurvey(id, data);
    return updated ? toMongoSurvey(updated) : null;
}

/**
 * Delete a survey - adapter delegates to Postgres
 */
export async function deleteSurvey(id: string): Promise<boolean> {
    return surveysDb.deleteSurvey(id);
}

/**
 * Get surveys with response counts - adapter maintains MongoDB interface
 */
export async function getSurveysWithResponseCounts(): Promise<
    SurveyWithResponseCount[]
> {
    const surveys = await getSurveys();

    const surveysWithCounts: SurveyWithResponseCount[] = await Promise.all(
        surveys.map(async survey => {
            const responseCount = await surveysDb.getSurveyResponseCount(
                survey._id as any as string
            );
            return {
                ...survey,
                responseCount
            };
        })
    );

    return surveysWithCounts;
}

/**
 * Deactivate all surveys of a given type - adapter delegates to Postgres
 */
export async function deactivateSurveysByType(
    type: SurveyType
): Promise<number> {
    const surveysToUpdate = await db
        .select()
        .from(surveysTable)
        .where(eq(surveysTable.type, type));

    let count = 0;
    for (const survey of surveysToUpdate) {
        const updated = await surveysDb.updateSurvey(
            survey.id as any as string,
            {
                isActive: false
            }
        );
        if (updated) count++;
    }

    return count;
}
