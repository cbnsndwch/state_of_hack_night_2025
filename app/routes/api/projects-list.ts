import { data } from 'react-router';
import { getProjects } from '@/lib/db/projects.server';

export async function loader() {
    const projects = await getProjects();

    // Transform MongoDB documents to API response format
    const formattedProjects = projects.map(project => ({
        id: project.id.toString(),
        title: project.title,
        description: project.description,
        tags: project.tags,
        imageUrls: project.imageUrls,
        githubUrl: project.githubUrl,
        publicUrl: project.publicUrl,
        createdAt: project.createdAt.toISOString()
    }));

    return data({ projects: formattedProjects });
}
