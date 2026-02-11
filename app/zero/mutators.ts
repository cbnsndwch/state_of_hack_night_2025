/**
 * Zero Sync Mutation Types
 *
 * This file defines TypeScript types for mutations in the Zero Sync system.
 * Actual mutations are implemented in React Router action functions using Drizzle ORM.
 * These types ensure consistency across the application.
 */

/**
 * Profile Mutation Types
 */
export type CreateProfileInput = {
    clerkUserId: string;
    lumaEmail: string;
    lumaAttendeeId?: string;
    githubUsername?: string;
    bio?: string;
    skills?: string[];
};

export type UpdateProfileInput = {
    id: string;
    bio?: string;
    skills?: string[];
    githubUsername?: string;
    twitterHandle?: string;
    websiteUrl?: string;
    role?: string;
    seekingFunding?: boolean;
    openToMentoring?: boolean;
};

/**
 * Project Mutation Types
 */
export type CreateProjectInput = {
    memberId: string;
    title: string;
    description?: string;
    tags?: string[];
    imageUrls?: string[];
    githubUrl?: string;
    publicUrl?: string;
};

export type UpdateProjectInput = {
    id: string;
    title?: string;
    description?: string;
    tags?: string[];
    imageUrls?: string[];
    githubUrl?: string;
    publicUrl?: string;
};

/**
 * Attendance Mutation Types
 */
export type CheckInInput = {
    memberId: string;
    lumaEventId: string;
};

/**
 * Survey Response Mutation Types
 */
export type SubmitSurveyResponseInput = {
    surveyId: string;
    memberId: string;
    responses: Record<string, any>;
    isComplete: boolean;
};

/**
 * Demo Slot Mutation Types
 */
export type RequestDemoSlotInput = {
    memberId: string;
    eventId: string;
    title: string;
    description?: string;
    requestedTime?: string;
    durationMinutes?: number;
};

export type UpdateDemoSlotStatusInput = {
    id: string;
    status: 'pending' | 'confirmed' | 'canceled';
    confirmedByOrganizer?: boolean;
};

/**
 * Mutation Result Types
 */
export type MutationSuccess<T = any> = {
    success: true;
    data?: T;
};

export type MutationError = {
    success: false;
    error: string;
};

export type MutationResult<T = any> = MutationSuccess<T> | MutationError;
