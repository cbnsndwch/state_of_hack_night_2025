/**
 * PostgreSQL data access layer for Projects
 * This replaces the MongoDB-based projects.server.ts for the new Postgres/Zero architecture.
 * Type-safe queries using Drizzle ORM.
 */

import { db } from './provider.server';
import { projects, profiles } from '@drizzle/schema';
import { eq, desc } from 'drizzle-orm';

export interface ProjectInput {
    memberId: string;
    title: string;
    description?: string | null;
    tags?: string[];
    imageUrls?: string[];
    githubUrl?: string | null;
    publicUrl?: string | null;
}

export interface ProjectUpdate {
    title?: string;
    description?: string | null;
    tags?: string[];
    imageUrls?: string[];
    githubUrl?: string | null;
    publicUrl?: string | null;
}

/**
 * Get all projects, optionally limited
 */
export async function getProjects(limit?: number) {
    const query = db.select().from(projects);

    if (limit) {
        return query.limit(limit).orderBy(desc(projects.createdAt));
    }

    return query.orderBy(desc(projects.createdAt));
}

/**
 * Get all projects with member information
 */
export async function getProjectsWithMembers(limit?: number) {
    const projectsList = await getProjects(limit);

    // Fetch member data for each project
    const projectsWithMembers = await Promise.all(
        projectsList.map(async project => {
            const member = await db
                .select()
                .from(profiles)
                .where(eq(profiles.id, project.memberId));

            return {
                ...project,
                member: member[0] || null
            };
        })
    );

    return projectsWithMembers;
}

/**
 * Get a project by ID
 */
export async function getProjectById(id: string) {
    const result = await db.select().from(projects).where(eq(projects.id, id));

    return result[0] || null;
}

/**
 * Get all projects by a member ID
 */
export async function getProjectsByMemberId(memberId: string) {
    return db
        .select()
        .from(projects)
        .where(eq(projects.memberId, memberId))
        .orderBy(desc(projects.createdAt));
}

/**
 * Create a new project
 */
export async function createProject(data: ProjectInput) {
    const [project] = await db
        .insert(projects)
        .values({
            memberId: data.memberId,
            title: data.title,
            description: data.description || null,
            tags: data.tags || [],
            imageUrls: data.imageUrls || [],
            githubUrl: data.githubUrl || null,
            publicUrl: data.publicUrl || null,
            createdAt: new Date(),
            updatedAt: new Date()
        })
        .returning();

    return project;
}

/**
 * Update a project by ID
 */
export async function updateProject(id: string, data: ProjectUpdate) {
    const [updated] = await db
        .update(projects)
        .set({
            ...data,
            updatedAt: new Date()
        })
        .where(eq(projects.id, id))
        .returning();

    return updated || null;
}

/**
 * Delete a project by ID
 */
export async function deleteProject(id: string): Promise<boolean> {
    const result = await db.delete(projects).where(eq(projects.id, id));

    return (result.rowCount ?? 0) > 0;
}

/**
 * Count total projects
 */
export async function countProjects() {
    const result = await db.select({ count: projects.id }).from(projects);

    return result[0] ? 1 : 0;
}
