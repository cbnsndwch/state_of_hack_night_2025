/**
 * Server-side data access layer for MongoDB.
 *
 * This module provides type-safe functions for interacting with
 * the MongoDB collections. All functions are server-only and should
 * be called from React Router loaders/actions.
 */

export * from './profiles.server';
export * from './projects.server';
export * from './badges.server';
export * from './attendance.server';
export * from './surveys.server';
export * from './survey-responses.server';
