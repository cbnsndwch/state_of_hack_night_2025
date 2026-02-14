/**
 * PostgreSQL adapter for Projects
 * Wraps projects.postgres.server.ts to maintain backward compatibility with existing routes
 * Converts between Postgres UUIDs and MongoDB-compatible ObjectId interface
 */

import * as projectsDb from './projects.postgres.server';
import type {
    Project,
    ProjectInsert,
    ProjectUpdate,
    ProjectWithMember
} from '@/types/adapters';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Convert Postgres project to MongoDB-compatible format using string IDs as ObjectId substitutes
 */
function toMongoProject(pgProject: any): Project {
    return {
        _id: pgProject.id as any, // UUID string as ObjectId placeholder
        memberId: pgProject.memberId as any, // UUID string as ObjectId placeholder
        title: pgProject.title,
        description: pgProject.description,
        tags: pgProject.tags || [],
        imageUrls: pgProject.imageUrls || [],
        githubUrl: pgProject.githubUrl,
        publicUrl: pgProject.publicUrl,
        createdAt: pgProject.createdAt,
        updatedAt: pgProject.updatedAt
    };
}

/**
 * Get all projects (with optional limit) - adapter maintains MongoDB interface
 */
export async function getProjects(limit?: number): Promise<Project[]> {
    const projects = await projectsDb.getProjects(limit);
    return projects.map(toMongoProject);
}

/**
 * Get all projects with member info populated - adapter maintains MongoDB interface
 */
export async function getProjectsWithMembers(
    limit?: number
): Promise<ProjectWithMember[]> {
    const projectsWithMembers = await projectsDb.getProjectsWithMembers(limit);
    return projectsWithMembers.map(p => ({
        ...toMongoProject(p),
        member: p.member
    }));
}

/**
 * Get a project by ID - adapter maintains MongoDB interface
 */
export async function getProjectById(id: string): Promise<Project | null> {
    const project = await projectsDb.getProjectById(id);
    return project ? toMongoProject(project) : null;
}

/**
 * Get all projects by a member - adapter maintains MongoDB interface
 */
export async function getProjectsByMemberId(
    memberId: string
): Promise<Project[]> {
    const projects = await projectsDb.getProjectsByMemberId(memberId);
    return projects.map(toMongoProject);
}

/**
 * Create a new project - adapter maintains MongoDB interface
 */
export async function createProject(data: ProjectInsert): Promise<Project> {
    const created = await projectsDb.createProject({
        memberId: data.memberId as any as string, // UUID string
        title: data.title,
        description: data.description,
        tags: data.tags,
        imageUrls: data.imageUrls,
        githubUrl: data.githubUrl,
        publicUrl: data.publicUrl
    });
    return toMongoProject(created);
}

/**
 * Update a project - adapter maintains MongoDB interface
 */
export async function updateProject(
    id: string,
    data: ProjectUpdate
): Promise<Project | null> {
    const updated = await projectsDb.updateProject(id, data);
    return updated ? toMongoProject(updated) : null;
}

/**
 * Delete a project - adapter delegates to Postgres
 */
export async function deleteProject(id: string): Promise<boolean> {
    return projectsDb.deleteProject(id);
}

/**
 * Check if a user owns a project - adapter maintains MongoDB interface
 */
export async function isProjectOwner(
    projectId: string,
    memberId: string
): Promise<boolean> {
    const project = await getProjectById(projectId);
    if (!project) return false;
    return project.memberId === (memberId as any);
}
