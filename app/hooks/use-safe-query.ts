/**
 * SSR-Safe Zero Query Hook
 *
 * Wraps `useQuery` from `@rocicorp/zero/react` to handle the SSR case where
 * the Zero client isn't connected yet. This prevents the
 * "useZero must be used within ZeroProvider" error during server-side rendering
 * and pre-hydration rendering.
 *
 * How it works:
 * - Our `ZeroProvider` provides a SSR stub to `@rocicorp/zero/react`'s ZeroContext
 *   when the real Zero client isn't connected. This satisfies the `useZero()` call
 *   inside `useQuery` without throwing.
 * - This hook gates the actual query expression behind a `zero` availability check,
 *   so `useQuery` always receives `null` during SSR — hitting the fast "disabled"
 *   code path (returns `[undefined, { type: 'unknown' }]`).
 * - When Zero connects on the client, queries activate automatically.
 *
 * Usage:
 * ```tsx
 * // Before (crashes during SSR):
 * import { useQuery } from '@rocicorp/zero/react';
 * const [profile] = useQuery(user?.id ? profileQueries.byClerkUserId(user.id) : null);
 *
 * // After (SSR-safe):
 * import { useSafeQuery } from '@/hooks/use-safe-query';
 * const [profile] = useSafeQuery(user?.id ? profileQueries.byClerkUserId(user.id) : null);
 * ```
 */

import { useQuery, type MaybeQueryResult } from '@rocicorp/zero/react';
import type {
    DefaultContext,
    DefaultSchema,
    Falsy,
    PullRow,
    QueryOrQueryRequest,
    ReadonlyJSONValue,
    Schema
} from '@rocicorp/zero';

import { useZeroConnection } from '@/components/providers/zero-provider';

// Overload 1: Non-nullable query → result may have data
export function useSafeQuery<
    TTable extends keyof TSchema['tables'] & string,
    TInput extends ReadonlyJSONValue | undefined,
    TOutput extends ReadonlyJSONValue | undefined,
    TSchema extends Schema = DefaultSchema,
    TReturn = PullRow<TTable, TSchema>,
    TContext = DefaultContext
>(
    query: QueryOrQueryRequest<
        TTable,
        TInput,
        TOutput,
        TSchema,
        TReturn,
        TContext
    >,
    options?: { enabled?: boolean; ttl?: number }
): MaybeQueryResult<TReturn>;

// Overload 2: Nullable query → result data may be undefined
export function useSafeQuery<
    TTable extends keyof TSchema['tables'] & string,
    TInput extends ReadonlyJSONValue | undefined,
    TOutput extends ReadonlyJSONValue | undefined,
    TSchema extends Schema = DefaultSchema,
    TReturn = PullRow<TTable, TSchema>,
    TContext = DefaultContext
>(
    query:
        | QueryOrQueryRequest<
              TTable,
              TInput,
              TOutput,
              TSchema,
              TReturn,
              TContext
          >
        | Falsy,
    options?: { enabled?: boolean; ttl?: number }
): MaybeQueryResult<TReturn>;

// Implementation
export function useSafeQuery(
    query: unknown,
    options?: { enabled?: boolean; ttl?: number }
): MaybeQueryResult<unknown> {
    const { zero } = useZeroConnection();

    // When Zero isn't connected (SSR, pre-hydration, or connection error),
    // pass null to useQuery. This hits the disabled code path in @rocicorp/zero
    // which returns [undefined, { type: 'unknown' }] without touching the Zero client.
    const safeQuery = zero ? query : null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return useQuery(safeQuery as any, options);
}
