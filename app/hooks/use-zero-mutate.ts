/**
 * Hook for calling Zero mutations
 *
 * Provides a convenient interface for calling Zero mutations from React components.
 * Mutations are sent to the server-side /api/zero/mutate endpoint which handles
 * authentication, authorization, and database transactions.
 */

import { useCallback, useState } from 'react';

export type MutateResult<T = any> = {
    success: boolean;
    data?: T;
    error?: string;
};

/**
 * Generic hook for calling any Zero mutation
 */
export function useZeroMutate() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mutate = useCallback(
        async <T = any>(
            name: string,
            args: Record<string, any>
        ): Promise<MutateResult<T>> => {
            setIsLoading(true);
            setError(null);

            try {
                // Call the Zero mutation endpoint
                const response = await fetch('/api/zero/mutate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        mutations: [
                            {
                                id: Math.random(),
                                clientID: 'web-client',
                                name,
                                args
                            }
                        ]
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(
                        errorData.error ||
                            `Mutation failed with status ${response.status}`
                    );
                }

                const result = await response.json();

                // Check if the mutation returned an error
                if (result[0]?.result?.error) {
                    throw new Error(
                        result[0].result.message || 'Mutation failed'
                    );
                }

                setIsLoading(false);
                return {
                    success: true,
                    data: result[0]?.result?.data as T
                };
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : 'Mutation failed';
                setError(errorMessage);
                setIsLoading(false);
                return {
                    success: false,
                    error: errorMessage
                };
            }
        },
        []
    );

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        mutate,
        isLoading,
        error,
        clearError
    };
}

/**
 * Hook for updating a user profile via Zero
 */
export function useUpdateProfile() {
    const { mutate, isLoading, error, clearError } = useZeroMutate();

    const updateProfile = useCallback(
        async (args: {
            id: string;
            bio?: string;
            lumaAttendeeId?: string;
            skills?: string[];
            githubUsername?: string;
            twitterHandle?: string;
            websiteUrl?: string;
            role?: string;
            seekingFunding?: boolean;
            openToMentoring?: boolean;
        }) => {
            return mutate('profiles.update', args);
        },
        [mutate]
    );

    return {
        updateProfile,
        isLoading,
        error,
        clearError
    };
}

/**
 * Hook for dismissing onboarding
 */
export function useDismissOnboarding() {
    const { mutate, isLoading, error, clearError } = useZeroMutate();

    const dismissOnboarding = useCallback(
        async (profileId: string) => {
            return mutate('profiles.update', {
                id: profileId,
                onboardingDismissed: true
            });
        },
        [mutate]
    );

    return {
        dismissOnboarding,
        isLoading,
        error,
        clearError
    };
}

/**
 * Hook for creating a project via Zero
 */
export function useCreateProject() {
    const { mutate, isLoading, error, clearError } = useZeroMutate();

    const createProject = useCallback(
        async (args: {
            memberId: string;
            title: string;
            description?: string;
            tags?: string[];
            imageUrls?: string[];
            githubUrl?: string;
            publicUrl?: string;
        }) => {
            return mutate('projects.create', args);
        },
        [mutate]
    );

    return {
        createProject,
        isLoading,
        error,
        clearError
    };
}

/**
 * Hook for updating a project via Zero
 */
export function useUpdateProject() {
    const { mutate, isLoading, error, clearError } = useZeroMutate();

    const updateProject = useCallback(
        async (args: {
            id: string;
            title?: string;
            description?: string;
            tags?: string[];
            imageUrls?: string[];
            githubUrl?: string;
            publicUrl?: string;
        }) => {
            return mutate('projects.update', args);
        },
        [mutate]
    );

    return {
        updateProject,
        isLoading,
        error,
        clearError
    };
}

/**
 * Hook for deleting a project via Zero
 */
export function useDeleteProject() {
    const { mutate, isLoading, error, clearError } = useZeroMutate();

    const deleteProject = useCallback(
        async (projectId: string) => {
            return mutate('projects.delete', { id: projectId });
        },
        [mutate]
    );

    return {
        deleteProject,
        isLoading,
        error,
        clearError
    };
}
