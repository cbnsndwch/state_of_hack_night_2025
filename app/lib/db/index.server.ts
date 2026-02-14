/**
 * Server-side data access layer for PostgreSQL.
 *
 * This module provides type-safe functions for interacting with
 * the PostgreSQL database using Drizzle ORM. All functions are
 * server-only and should be called from React Router loaders/actions.
 */

export * from './profiles.server';
export * from './projects.server';
export * from './badges.server';
export * from './attendance.server';
export * from './surveys.server';
export * from './survey-responses.server';
