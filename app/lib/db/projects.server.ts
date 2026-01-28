import { ObjectId } from 'mongodb';
import { getMongoDb, COLLECTIONS } from '@/utils/mongodb.server';
import type {
    Project,
    ProjectInsert,
    ProjectUpdate,
    ProjectWithMember
} from '@/types/mongodb';

/**
 * Get all projects (with optional limit)
 */
export async function getProjects(limit?: number): Promise<Project[]> {
    const db = await getMongoDb();
    const query = db
        .collection<Project>(COLLECTIONS.PROJECTS)
        .find()
        .sort({ createdAt: -1 });

    if (limit) {
        query.limit(limit);
    }

    return query.toArray();
}

/**
 * Get all projects with member info populated
 */
export async function getProjectsWithMembers(
    limit?: number
): Promise<ProjectWithMember[]> {
    const db = await getMongoDb();

    const pipeline: object[] = [
        { $sort: { createdAt: -1 } },
        {
            $lookup: {
                from: COLLECTIONS.PROFILES,
                localField: 'memberId',
                foreignField: '_id',
                as: 'memberArray'
            }
        },
        {
            $addFields: {
                member: { $arrayElemAt: ['$memberArray', 0] }
            }
        },
        {
            $project: {
                memberArray: 0,
                memberId: 0
            }
        }
    ];

    if (limit) {
        pipeline.push({ $limit: limit });
    }

    return db
        .collection<ProjectWithMember>(COLLECTIONS.PROJECTS)
        .aggregate<ProjectWithMember>(pipeline)
        .toArray();
}

/**
 * Get a project by MongoDB _id
 */
export async function getProjectById(id: string): Promise<Project | null> {
    const db = await getMongoDb();
    return db.collection<Project>(COLLECTIONS.PROJECTS).findOne({
        _id: new ObjectId(id)
    });
}

/**
 * Get all projects by a member
 */
export async function getProjectsByMemberId(
    memberId: string
): Promise<Project[]> {
    const db = await getMongoDb();
    return db
        .collection<Project>(COLLECTIONS.PROJECTS)
        .find({ memberId: new ObjectId(memberId) })
        .sort({ createdAt: -1 })
        .toArray();
}

/**
 * Create a new project
 */
export async function createProject(data: ProjectInsert): Promise<Project> {
    const db = await getMongoDb();
    const now = new Date();

    const doc = {
        ...data,
        tags: data.tags ?? [],
        imageUrls: data.imageUrls ?? [],
        createdAt: now,
        updatedAt: now
    };

    const result = await db
        .collection<Project>(COLLECTIONS.PROJECTS)
        .insertOne(doc as Project);

    return {
        _id: result.insertedId,
        ...doc
    } as Project;
}

/**
 * Update a project by MongoDB _id
 */
export async function updateProject(
    id: string,
    data: ProjectUpdate
): Promise<Project | null> {
    const db = await getMongoDb();

    const result = await db
        .collection<Project>(COLLECTIONS.PROJECTS)
        .findOneAndUpdate(
            { _id: new ObjectId(id) },
            {
                $set: {
                    ...data,
                    updatedAt: new Date()
                }
            },
            { returnDocument: 'after' }
        );

    return result;
}

/**
 * Delete a project by MongoDB _id
 */
export async function deleteProject(id: string): Promise<boolean> {
    const db = await getMongoDb();
    const result = await db
        .collection<Project>(COLLECTIONS.PROJECTS)
        .deleteOne({
            _id: new ObjectId(id)
        });

    return result.deletedCount === 1;
}

/**
 * Check if a user owns a project
 */
export async function isProjectOwner(
    projectId: string,
    memberId: string
): Promise<boolean> {
    const db = await getMongoDb();
    const project = await db.collection<Project>(COLLECTIONS.PROJECTS).findOne({
        _id: new ObjectId(projectId),
        memberId: new ObjectId(memberId)
    });

    return project !== null;
}
