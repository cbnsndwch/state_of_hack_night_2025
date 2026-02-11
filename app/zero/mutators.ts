/**
 * Zero Sync Mutators
 *
 * This file defines mutations for the Zero Sync system.
 * Mutations are executed on the server with authorization and validation.
 */

import { defineMutators, defineMutator } from '@rocicorp/zero';
import { z } from 'zod';
import { zql } from './schema';

/**
 * Define all mutators for the application
 */
export const mutators = defineMutators({
    profiles: {
        /**
         * Update a user's profile
         */
        update: defineMutator(
            z.object({
                id: z.string(),
                bio: z.string().optional(),
                lumaAttendeeId: z.string().optional(),
                skills: z.array(z.string()).optional(),
                githubUsername: z.string().optional(),
                twitterHandle: z.string().optional(),
                websiteUrl: z.string().url().optional(),
                role: z.string().optional(),
                seekingFunding: z.boolean().optional(),
                openToMentoring: z.boolean().optional(),
                onboardingDismissed: z.boolean().optional()
            }),
            async ({ args, tx, ctx }) => {
                // Authorization: users can only update their own profile
                const profile = await tx.run(
                    zql.profiles.where('id', args.id).one()
                );

                if (!profile) {
                    throw new Error('Profile not found');
                }

                if (profile.clerkUserId !== ctx.userId) {
                    throw new Error(
                        'Unauthorized: You can only update your own profile'
                    );
                }

                const { id, ...updates } = args;

                await tx.mutate.profiles.update({
                    where: { id: args.id },
                    set: {
                        ...updates,
                        updatedAt: new Date()
                    }
                });
            }
        )
    },

    projects: {
        /**
         * Create a new project
         */
        create: defineMutator(
            z.object({
                memberId: z.string(),
                title: z.string().min(1, 'Title is required'),
                description: z.string().optional(),
                tags: z.array(z.string()).optional(),
                imageUrls: z.array(z.string().url()).optional(),
                githubUrl: z.string().url().optional(),
                publicUrl: z.string().url().optional()
            }),
            async ({ args, tx, ctx }) => {
                // Authorization: users can only create projects for themselves
                const profile = await tx.run(
                    zql.profiles.where('id', args.memberId).one()
                );

                if (!profile || profile.clerkUserId !== ctx.userId) {
                    throw new Error(
                        'Unauthorized: You can only create projects for yourself'
                    );
                }

                const id = crypto.randomUUID();

                await tx.mutate.projects.insert({
                    id,
                    memberId: args.memberId,
                    title: args.title,
                    description: args.description || '',
                    tags: args.tags || [],
                    imageUrls: args.imageUrls || [],
                    githubUrl: args.githubUrl,
                    publicUrl: args.publicUrl,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                return { id };
            }
        ),

        /**
         * Update an existing project
         */
        update: defineMutator(
            z.object({
                id: z.string(),
                title: z.string().min(1).optional(),
                description: z.string().optional(),
                tags: z.array(z.string()).optional(),
                imageUrls: z.array(z.string().url()).optional(),
                githubUrl: z.string().url().optional(),
                publicUrl: z.string().url().optional()
            }),
            async ({ args, tx, ctx }) => {
                // Check ownership
                const project = await tx.run(
                    zql.projects.where('id', args.id).one()
                );

                if (!project) {
                    throw new Error('Project not found');
                }

                const profile = await tx.run(
                    zql.profiles.where('id', project.memberId).one()
                );

                if (!profile || profile.clerkUserId !== ctx.userId) {
                    throw new Error(
                        'Unauthorized: You can only update your own projects'
                    );
                }

                const { id, ...updates } = args;

                await tx.mutate.projects.update({
                    where: { id: args.id },
                    set: {
                        ...updates,
                        updatedAt: new Date()
                    }
                });
            }
        ),

        /**
         * Delete a project
         */
        delete: defineMutator(
            z.object({
                id: z.string()
            }),
            async ({ args, tx, ctx }) => {
                // Check ownership
                const project = await tx.run(
                    zql.projects.where('id', args.id).one()
                );

                if (!project) {
                    throw new Error('Project not found');
                }

                const profile = await tx.run(
                    zql.profiles.where('id', project.memberId).one()
                );

                if (!profile || profile.clerkUserId !== ctx.userId) {
                    throw new Error(
                        'Unauthorized: You can only delete your own projects'
                    );
                }

                await tx.mutate.projects.delete({
                    where: { id: args.id }
                });
            }
        )
    },

    attendance: {
        /**
         * Check in to an event
         */
        checkIn: defineMutator(
            z.object({
                memberId: z.string(),
                lumaEventId: z.string()
            }),
            async ({ args, tx, ctx }) => {
                // Authorization: users can only check in for themselves
                const profile = await tx.run(
                    zql.profiles.where('id', args.memberId).one()
                );

                if (!profile || profile.clerkUserId !== ctx.userId) {
                    throw new Error(
                        'Unauthorized: You can only check in for yourself'
                    );
                }

                // Check if already checked in
                const existing = await tx.run(
                    zql.attendance
                        .where(q =>
                            q.and(
                                q.cmp('memberId', '=', args.memberId),
                                q.cmp('lumaEventId', '=', args.lumaEventId)
                            )
                        )
                        .one()
                );

                if (existing) {
                    throw new Error('Already checked in to this event');
                }

                const id = crypto.randomUUID();

                await tx.mutate.attendance.insert({
                    id,
                    memberId: args.memberId,
                    lumaEventId: args.lumaEventId,
                    createdAt: new Date()
                });

                return { id };
            }
        )
    },

    surveyResponses: {
        /**
         * Submit a survey response
         */
        submit: defineMutator(
            z.object({
                surveyId: z.string(),
                memberId: z.string(),
                responses: z.record(z.any()),
                isComplete: z.boolean()
            }),
            async ({ args, tx, ctx }) => {
                // Authorization: users can only submit responses for themselves
                const profile = await tx.run(
                    zql.profiles.where('id', args.memberId).one()
                );

                if (!profile || profile.clerkUserId !== ctx.userId) {
                    throw new Error(
                        'Unauthorized: You can only submit survey responses for yourself'
                    );
                }

                // Check if already submitted
                const existing = await tx.run(
                    zql.surveyResponses
                        .where(q =>
                            q.and(
                                q.cmp('memberId', '=', args.memberId),
                                q.cmp('surveyId', '=', args.surveyId)
                            )
                        )
                        .one()
                );

                if (existing) {
                    // Update existing response
                    await tx.mutate.surveyResponses.update({
                        where: { id: existing.id },
                        set: {
                            responses: args.responses,
                            isComplete: args.isComplete,
                            submittedAt: args.isComplete ? new Date() : null
                        }
                    });

                    return { id: existing.id };
                } else {
                    // Create new response
                    const id = crypto.randomUUID();

                    await tx.mutate.surveyResponses.insert({
                        id,
                        surveyId: args.surveyId,
                        memberId: args.memberId,
                        responses: args.responses,
                        isComplete: args.isComplete,
                        submittedAt: args.isComplete ? new Date() : null
                    });

                    return { id };
                }
            }
        )
    },

    demoSlots: {
        /**
         * Request a demo slot
         */
        request: defineMutator(
            z.object({
                memberId: z.string(),
                eventId: z.string(),
                title: z.string().min(1, 'Title is required'),
                description: z.string().optional(),
                requestedTime: z.string().optional(),
                durationMinutes: z.number().optional()
            }),
            async ({ args, tx, ctx }) => {
                // Authorization: users can only request demo slots for themselves
                const profile = await tx.run(
                    zql.profiles.where('id', args.memberId).one()
                );

                if (!profile || profile.clerkUserId !== ctx.userId) {
                    throw new Error(
                        'Unauthorized: You can only request demo slots for yourself'
                    );
                }

                const id = crypto.randomUUID();

                await tx.mutate.demoSlots.insert({
                    id,
                    memberId: args.memberId,
                    eventId: args.eventId,
                    title: args.title,
                    description: args.description || '',
                    requestedTime: args.requestedTime,
                    durationMinutes: args.durationMinutes || 5,
                    status: 'pending',
                    createdAt: new Date()
                });

                return { id };
            }
        ),

        /**
         * Update demo slot status
         */
        updateStatus: defineMutator(
            z.object({
                id: z.string(),
                status: z.enum(['pending', 'confirmed', 'canceled'])
            }),
            async ({ args, tx, ctx }) => {
                const slot = await tx.run(
                    zql.demoSlots.where('id', args.id).one()
                );

                if (!slot) {
                    throw new Error('Demo slot not found');
                }

                const profile = await tx.run(
                    zql.profiles.where('id', slot.memberId).one()
                );

                // Either the owner or an admin can update status
                if (
                    !profile ||
                    (profile.clerkUserId !== ctx.userId && ctx.role !== 'admin')
                ) {
                    throw new Error('Unauthorized');
                }

                await tx.mutate.demoSlots.update({
                    where: { id: args.id },
                    set: {
                        status: args.status
                    }
                });
            }
        )
    }
});

/**
 * Legacy type exports for compatibility
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
