/**
 * Hooks for Zero mutations
 *
 * These hooks use the proper Zero client mutation API:
 *   zero.mutate(mutators.table.action({ ...args }))
 *
 * Mutations run optimistically on the client (UI updates immediately),
 * then sync to zero-cache -> /api/zero/mutate -> Postgres.
 *
 * Each hook generates a random ID for create operations (per Zero docs:
 * "Do not generate IDs inside mutators, since mutators run multiple times").
 */

import { useCallback, useState } from 'react';
import { useZeroConnection } from '@/components/providers/zero-provider';
import { mutators } from '@/zero/mutators';

export type MutateResult<T = Record<string, unknown>> = {
    success: boolean;
    data?: T;
    error?: string;
};

// ---------------------------------------------------------------------------
// Internal helper: run a Zero mutation and return { success, error }
// ---------------------------------------------------------------------------

type MutateWrite = {
    client: Promise<{ type: 'ok' } | { type: 'error'; error: Error }>;
    server: Promise<{ type: 'ok' } | { type: 'error'; error: Error }>;
};

async function settleWrite(write: MutateWrite): Promise<MutateResult> {
    try {
        const result = await write.client;
        if (result.type === 'error') {
            return { success: false, error: result.error.message };
        }
        return { success: true };
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Mutation failed'
        };
    }
}

// ---------------------------------------------------------------------------
// Profile mutations
// ---------------------------------------------------------------------------

/**
 * Hook for updating a user profile via Zero
 */
export function useUpdateProfile() {
    const { zero } = useZeroConnection();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateProfile = useCallback(
        async (args: {
            id: string;
            bio?: string;
            lumaAttendeeId?: string;
            skills?: string[];
            githubUsername?: string;
            twitterHandle?: string;
            websiteUrl?: string;
            linkedinUrl?: string;
            role?: string;
            seekingFunding?: boolean;
            openToMentoring?: boolean;
            lookingForCofounder?: boolean;
            wantProductFeedback?: boolean;
            seekingAcceleratorIntros?: boolean;
            wantToGiveBack?: boolean;
            specialties?: string[];
            interestedExperiences?: string[];
            onboardingDismissed?: boolean;
        }): Promise<MutateResult> => {
            if (!zero) {
                return { success: false, error: 'Zero not connected' };
            }

            setIsLoading(true);
            setError(null);

            try {
                const write = zero.mutate(
                    mutators.profiles.update(args)
                ) as unknown as MutateWrite;

                const result = await settleWrite(write);
                if (!result.success) setError(result.error ?? null);
                return result;
            } catch (err) {
                const msg =
                    err instanceof Error ? err.message : 'Mutation failed';
                setError(msg);
                return { success: false, error: msg };
            } finally {
                setIsLoading(false);
            }
        },
        [zero]
    );

    const clearError = useCallback(() => setError(null), []);

    return { updateProfile, isLoading, error, clearError };
}

/**
 * Hook for dismissing onboarding via Zero
 */
export function useDismissOnboarding() {
    const { zero } = useZeroConnection();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const dismissOnboarding = useCallback(
        async (profileId: string): Promise<MutateResult> => {
            if (!zero) {
                return { success: false, error: 'Zero not connected' };
            }

            setIsLoading(true);
            setError(null);

            try {
                const write = zero.mutate(
                    mutators.profiles.update({
                        id: profileId,
                        onboardingDismissed: true
                    })
                ) as unknown as MutateWrite;

                const result = await settleWrite(write);
                if (!result.success) setError(result.error ?? null);
                return result;
            } catch (err) {
                const msg =
                    err instanceof Error ? err.message : 'Mutation failed';
                setError(msg);
                return { success: false, error: msg };
            } finally {
                setIsLoading(false);
            }
        },
        [zero]
    );

    const clearError = useCallback(() => setError(null), []);

    return { dismissOnboarding, isLoading, error, clearError };
}

// ---------------------------------------------------------------------------
// Project mutations
// ---------------------------------------------------------------------------

/**
 * Hook for creating a project via Zero
 */
export function useCreateProject() {
    const { zero } = useZeroConnection();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createProject = useCallback(
        async (args: {
            memberId: string;
            title: string;
            description?: string;
            tags?: string[];
            imageUrls?: string[];
            githubUrl?: string;
            publicUrl?: string;
        }): Promise<MutateResult> => {
            if (!zero) {
                return { success: false, error: 'Zero not connected' };
            }

            setIsLoading(true);
            setError(null);

            try {
                // Generate ID outside the mutator (per Zero docs)
                const id = crypto.randomUUID();

                const write = zero.mutate(
                    mutators.projects.create({ id, ...args })
                ) as unknown as MutateWrite;

                const result = await settleWrite(write);
                if (!result.success) setError(result.error ?? null);
                return result;
            } catch (err) {
                const msg =
                    err instanceof Error ? err.message : 'Mutation failed';
                setError(msg);
                return { success: false, error: msg };
            } finally {
                setIsLoading(false);
            }
        },
        [zero]
    );

    const clearError = useCallback(() => setError(null), []);

    return { createProject, isLoading, error, clearError };
}

/**
 * Hook for updating a project via Zero
 */
export function useUpdateProject() {
    const { zero } = useZeroConnection();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateProject = useCallback(
        async (args: {
            id: string;
            title?: string;
            description?: string;
            tags?: string[];
            imageUrls?: string[];
            githubUrl?: string;
            publicUrl?: string;
        }): Promise<MutateResult> => {
            if (!zero) {
                return { success: false, error: 'Zero not connected' };
            }

            setIsLoading(true);
            setError(null);

            try {
                const write = zero.mutate(
                    mutators.projects.update(args)
                ) as unknown as MutateWrite;

                const result = await settleWrite(write);
                if (!result.success) setError(result.error ?? null);
                return result;
            } catch (err) {
                const msg =
                    err instanceof Error ? err.message : 'Mutation failed';
                setError(msg);
                return { success: false, error: msg };
            } finally {
                setIsLoading(false);
            }
        },
        [zero]
    );

    const clearError = useCallback(() => setError(null), []);

    return { updateProject, isLoading, error, clearError };
}

/**
 * Hook for deleting a project via Zero
 */
export function useDeleteProject() {
    const { zero } = useZeroConnection();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const deleteProject = useCallback(
        async (projectId: string): Promise<MutateResult> => {
            if (!zero) {
                return { success: false, error: 'Zero not connected' };
            }

            setIsLoading(true);
            setError(null);

            try {
                const write = zero.mutate(
                    mutators.projects.delete({ id: projectId })
                ) as unknown as MutateWrite;

                const result = await settleWrite(write);
                if (!result.success) setError(result.error ?? null);
                return result;
            } catch (err) {
                const msg =
                    err instanceof Error ? err.message : 'Mutation failed';
                setError(msg);
                return { success: false, error: msg };
            } finally {
                setIsLoading(false);
            }
        },
        [zero]
    );

    const clearError = useCallback(() => setError(null), []);

    return { deleteProject, isLoading, error, clearError };
}

// ---------------------------------------------------------------------------
// Attendance mutations
// ---------------------------------------------------------------------------

/**
 * Hook for checking in to an event via Zero
 */
export function useCheckIn() {
    const { zero } = useZeroConnection();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const checkIn = useCallback(
        async (args: {
            memberId: string;
            lumaEventId: string;
        }): Promise<MutateResult> => {
            if (!zero) {
                return { success: false, error: 'Zero not connected' };
            }

            setIsLoading(true);
            setError(null);

            try {
                const id = crypto.randomUUID();

                const write = zero.mutate(
                    mutators.attendance.checkIn({ id, ...args })
                ) as unknown as MutateWrite;

                const result = await settleWrite(write);
                if (!result.success) setError(result.error ?? null);
                return result;
            } catch (err) {
                const msg =
                    err instanceof Error ? err.message : 'Mutation failed';
                setError(msg);
                return { success: false, error: msg };
            } finally {
                setIsLoading(false);
            }
        },
        [zero]
    );

    const clearError = useCallback(() => setError(null), []);

    return { checkIn, isLoading, error, clearError };
}

// ---------------------------------------------------------------------------
// Survey mutations
// ---------------------------------------------------------------------------

/**
 * Hook for submitting a survey response via Zero
 */
export function useSubmitSurveyResponse() {
    const { zero } = useZeroConnection();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submitSurveyResponse = useCallback(
        async (args: {
            surveyId: string;
            memberId: string;
            responses: Record<string, unknown>;
            isComplete: boolean;
        }): Promise<MutateResult> => {
            if (!zero) {
                return { success: false, error: 'Zero not connected' };
            }

            setIsLoading(true);
            setError(null);

            try {
                const id = crypto.randomUUID();

                const write = zero.mutate(
                    mutators.surveyResponses.submit({ id, ...args })
                ) as unknown as MutateWrite;

                const result = await settleWrite(write);
                if (!result.success) setError(result.error ?? null);
                return result;
            } catch (err) {
                const msg =
                    err instanceof Error ? err.message : 'Mutation failed';
                setError(msg);
                return { success: false, error: msg };
            } finally {
                setIsLoading(false);
            }
        },
        [zero]
    );

    const clearError = useCallback(() => setError(null), []);

    return { submitSurveyResponse, isLoading, error, clearError };
}

// ---------------------------------------------------------------------------
// Demo slots mutations
// ---------------------------------------------------------------------------

/**
 * Hook for requesting a demo slot via Zero
 */
export function useRequestDemoSlot() {
    const { zero } = useZeroConnection();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const requestDemoSlot = useCallback(
        async (args: {
            memberId: string;
            eventId: string;
            title: string;
            description?: string;
            requestedTime?: string;
            durationMinutes?: number;
        }): Promise<MutateResult> => {
            if (!zero) {
                return { success: false, error: 'Zero not connected' };
            }

            setIsLoading(true);
            setError(null);

            try {
                const id = crypto.randomUUID();

                const write = zero.mutate(
                    mutators.demoSlots.request({ id, ...args })
                ) as unknown as MutateWrite;

                const result = await settleWrite(write);
                if (!result.success) setError(result.error ?? null);
                return result;
            } catch (err) {
                const msg =
                    err instanceof Error ? err.message : 'Mutation failed';
                setError(msg);
                return { success: false, error: msg };
            } finally {
                setIsLoading(false);
            }
        },
        [zero]
    );

    const clearError = useCallback(() => setError(null), []);

    return { requestDemoSlot, isLoading, error, clearError };
}

/**
 * Hook for updating a demo slot status via Zero
 */
export function useUpdateDemoSlotStatus() {
    const { zero } = useZeroConnection();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateDemoSlotStatus = useCallback(
        async (args: {
            id: string;
            status: 'pending' | 'confirmed' | 'canceled';
        }): Promise<MutateResult> => {
            if (!zero) {
                return { success: false, error: 'Zero not connected' };
            }

            setIsLoading(true);
            setError(null);

            try {
                const write = zero.mutate(
                    mutators.demoSlots.updateStatus(args)
                ) as unknown as MutateWrite;

                const result = await settleWrite(write);
                if (!result.success) setError(result.error ?? null);
                return result;
            } catch (err) {
                const msg =
                    err instanceof Error ? err.message : 'Mutation failed';
                setError(msg);
                return { success: false, error: msg };
            } finally {
                setIsLoading(false);
            }
        },
        [zero]
    );

    const clearError = useCallback(() => setError(null), []);

    return { updateDemoSlotStatus, isLoading, error, clearError };
}
