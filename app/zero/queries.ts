/**
 * Zero Sync Queries
 *
 * This file defines all the queries for the Zero Sync client.
 * Queries are type-safe and optimistic, providing instant UI updates.
 */

import { zql } from './schema';

/**
 * Profile Queries
 */
export const profileQueries = {
    /**
     * Get a profile by Clerk user ID
     */
    byClerkUserId(clerkUserId: string) {
        return zql.profiles.where('clerkUserId', clerkUserId).one();
    },

    /**
     * Get a profile by ID
     */
    byId(id: string) {
        return zql.profiles.where('id', id).one();
    },

    /**
     * Get all profiles (for member directory)
     */
    all() {
        return zql.profiles.orderBy('createdAt', 'desc');
    },

    /**
     * Search profiles by name or username
     */
    search(query: string) {
        const searchTerm = `%${query}%`;
        return zql.profiles.where(q =>
            q.or(
                q.cmp('lumaEmail', 'ILIKE', searchTerm),
                q.cmp('githubUsername', 'ILIKE', searchTerm)
            )
        );
    }
};

/**
 * Project Queries
 */
export const projectQueries = {
    /**
     * Get all projects (for showcase)
     */
    all() {
        return zql.projects
            .orderBy('createdAt', 'desc')
            .related('member', q => q.one());
    },

    /**
     * Get projects by member ID
     */
    byMemberId(memberId: string) {
        return zql.projects
            .where('memberId', memberId)
            .orderBy('createdAt', 'desc');
    },

    /**
     * Get a project by ID
     */
    byId(id: string) {
        return zql.projects
            .where('id', id)
            .related('member', q => q.one())
            .one();
    },

    /**
     * Search projects by title or tags
     */
    search(query: string) {
        const searchTerm = `%${query}%`;
        return zql.projects
            .where(q => q.cmp('title', 'ILIKE', searchTerm))
            .related('member', q => q.one())
            .orderBy('createdAt', 'desc');
    }
};

/**
 * Badge Queries
 */
export const badgeQueries = {
    /**
     * Get all badges
     */
    all() {
        return zql.badges.orderBy('name', 'asc');
    },

    /**
     * Get badges earned by a member
     */
    byMemberId(memberId: string) {
        return zql.memberBadges
            .where('memberId', memberId)
            .related('badge', q => q.one())
            .orderBy('awardedAt', 'desc');
    }
};

/**
 * Event Queries
 */
export const eventQueries = {
    /**
     * Get all upcoming events
     */
    upcoming() {
        const now = new Date();
        return zql.events
            .where(q => q.cmp('startAt', '>', now.getTime()))
            .orderBy('startAt', 'asc');
    },

    /**
     * Get all past events
     */
    past() {
        const now = new Date();
        return zql.events
            .where(q => q.cmp('startAt', '<', now.getTime()))
            .orderBy('startAt', 'desc');
    },

    /**
     * Get event by ID
     */
    byId(id: string) {
        return zql.events.where('id', id).one();
    },

    /**
     * Get event by Luma event ID
     */
    byLumaEventId(lumaEventId: string) {
        return zql.events.where('lumaEventId', lumaEventId).one();
    }
};

/**
 * Attendance Queries
 */
export const attendanceQueries = {
    /**
     * Get attendance records for a member
     */
    byMemberId(memberId: string) {
        return zql.attendance
            .where('memberId', memberId)
            .orderBy('createdAt', 'desc');
    },

    /**
     * Get attendance for an event
     */
    byLumaEventId(lumaEventId: string) {
        return zql.attendance
            .where('lumaEventId', lumaEventId)
            .related('member', q => q.one());
    },

    /**
     * Check if member attended a specific event
     */
    memberAtEvent(memberId: string, lumaEventId: string) {
        return zql.attendance
            .where(q =>
                q.and(
                    q.cmp('memberId', '=', memberId),
                    q.cmp('lumaEventId', '=', lumaEventId)
                )
            )
            .one();
    }
};

/**
 * Survey Queries
 */
export const surveyQueries = {
    /**
     * Get all active surveys
     */
    active() {
        return zql.surveys.where('isActive', true).orderBy('createdAt', 'desc');
    },

    /**
     * Get survey by slug
     */
    bySlug(slug: string) {
        return zql.surveys.where('slug', slug).one();
    },

    /**
     * Get survey by ID
     */
    byId(id: string) {
        return zql.surveys.where('id', id).one();
    }
};

/**
 * Survey Response Queries
 */
export const surveyResponseQueries = {
    /**
     * Get responses for a survey
     */
    bySurveyId(surveyId: string) {
        return zql.surveyResponses
            .where('surveyId', surveyId)
            .related('member', q => q.one())
            .orderBy('submittedAt', 'desc');
    },

    /**
     * Get member's response to a survey
     */
    byMemberAndSurvey(memberId: string, surveyId: string) {
        return zql.surveyResponses
            .where(q =>
                q.and(
                    q.cmp('memberId', '=', memberId),
                    q.cmp('surveyId', '=', surveyId)
                )
            )
            .one();
    },

    /**
     * Get all responses by a member
     */
    byMemberId(memberId: string) {
        return zql.surveyResponses
            .where('memberId', memberId)
            .related('survey', q => q.one())
            .orderBy('submittedAt', 'desc');
    }
};

/**
 * Demo Slot Queries
 */
export const demoSlotQueries = {
    /**
     * Get demo slots for an event
     */
    byEventId(eventId: string) {
        return zql.demoSlots
            .where('eventId', eventId)
            .related('member', q => q.one())
            .orderBy('createdAt', 'asc');
    },

    /**
     * Get demo slots by member
     */
    byMemberId(memberId: string) {
        return zql.demoSlots
            .where('memberId', memberId)
            .related('event', q => q.one())
            .orderBy('createdAt', 'desc');
    },

    /**
     * Get pending demo slots for an event
     */
    pendingByEventId(eventId: string) {
        return zql.demoSlots
            .where(q =>
                q.and(
                    q.cmp('eventId', '=', eventId),
                    q.cmp('status', '=', 'pending')
                )
            )
            .related('member', q => q.one())
            .orderBy('createdAt', 'asc');
    }
};

/**
 * Pending Users Queries
 */
export const pendingUserQueries = {
    /**
     * Get all pending users (not yet approved)
     */
    pending() {
        return zql.pendingUsers
            .where(q => q.cmp('approvedAt', 'IS', null as any))
            .orderBy('subscribedAt', 'desc');
    },

    /**
     * Get pending user by email
     */
    byEmail(email: string) {
        return zql.pendingUsers.where('email', email).one();
    },

    /**
     * Get pending user by Luma attendee ID
     */
    byLumaAttendeeId(lumaAttendeeId: string) {
        return zql.pendingUsers.where('lumaAttendeeId', lumaAttendeeId).one();
    }
};
