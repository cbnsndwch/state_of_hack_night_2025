/**
 * PostgreSQL data access layer for Projects
 * Type-safe queries using Drizzle ORM.
 */

import { db } from './provider.server';
import { projects, profiles } from '@drizzle/schema';
import { eq, desc } from 'drizzle-orm';
import type {
    Project,
    ProjectInsert,
    ProjectUpdate,
    ProjectWithMember
} from '@/types/adapters';

/**
 * Get all projects, optionally limited
 */
export async function getProjects(limit?: number): Promise<Project[]> {
    const query = db.select().from(projects);

    if (limit) {
        return query.limit(limit).orderBy(desc(projects.createdAt));
    }

    return query.orderBy(desc(projects.createdAt));
}

/**
 * Get all projects with member information
 */
export async function getProjectsWithMembers(
    limit?: number
): Promise<ProjectWithMember[]> {
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
                member: member[0]
                    ? {
                          id: member[0].id,
                          clerkUserId: member[0].clerkUserId,
                          bio: member[0].bio,
                          lumaEmail: member[0].lumaEmail
                      }
                    : null
            } as ProjectWithMember;
        })
    );

    return projectsWithMembers.filter(p => p.member !== null);
}

/**
 * Get a project by ID
 */
export async function getProjectById(id: string): Promise<Project | null> {
    const result = await db.select().from(projects).where(eq(projects.id, id));

    return result[0] || null;
}

/**
 * Get all projects by a member ID
 */
export async function getProjectsByMemberId(
    memberId: string
): Promise<Project[]> {
    return db
        .select()
        .from(projects)
        .where(eq(projects.memberId, memberId))
        .orderBy(desc(projects.createdAt));
}

/**
 * Create a new project
 */
export async function createProject(data: ProjectInsert): Promise<Project> {
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
export async function updateProject(
    id: string,
    data: ProjectUpdate
): Promise<Project | null> {
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
 * Check if a user owns a project
 */
export async function isProjectOwner(
    projectId: string,
    memberId: string
): Promise<boolean> {
    const project = await getProjectById(projectId);
    if (!project) return false;
    return project.memberId === memberId;
}

/**
 * Count total projects
 */
export async function countProjects(): Promise<number> {
    const result = await db.select({ count: projects.id }).from(projects);

    return result[0] ? 1 : 0;
}
