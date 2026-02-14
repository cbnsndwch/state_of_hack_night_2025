import { type MetaFunction } from 'react-router';
import { Link, useParams, useNavigate } from 'react-router';
import {
    GithubIcon,
    ExternalLinkIcon,
    ArrowLeftIcon,
    CalendarIcon,
    EditIcon,
    TrashIcon
} from 'lucide-react';
import { useQuery } from '@rocicorp/zero/react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { NeoCard } from '@/components/ui/NeoCard';
import { projectQueries } from '@/zero/queries';
import { useDeleteProject } from '@/hooks/use-zero-mutate';
import { useAuth } from '@/hooks/use-auth';

/**
 * Example: How to add edit/delete functionality using Zero mutations
 *
 * 1. Import the hooks:
 *    import { useUpdateProject, useDeleteProject } from '@/hooks/use-zero-mutate';
 *    import { useAuth } from '@/hooks/use-auth';
 *
 * 2. In your component:
 *    const { user } = useAuth();
 *    const { updateProject } = useUpdateProject();
 *    const { deleteProject } = useDeleteProject();
 *
 * 3. Check if current user owns the project:
 *    const isOwner = user && member && member.clerkUserId === user.id;
 *
 * 4. Update a project:
 *    const handleUpdate = async () => {
 *      const result = await updateProject({
 *        id: project.id,
 *        title: 'Updated Title',
 *        description: 'Updated description',
 *        tags: ['new', 'tags'],
 *      });
 *      if (result.success) {
 *        // Zero will automatically sync the changes
 *      }
 *    };
 *
 * 5. Delete a project:
 *    const handleDelete = async () => {
 *      if (!confirm('Delete this project?')) return;
 *      const result = await deleteProject(project.id);
 *      if (result.success) {
 *        navigate('/showcase');
 *      }
 *    };
 *
 * 6. Add buttons to the UI:
 *    {isOwner && (
 *      <div className="flex gap-2">
 *        <button onClick={handleUpdate}>Edit</button>
 *        <button onClick={handleDelete}>Delete</button>
 *      </div>
 *    )}
 */

export const meta: MetaFunction = () => {
    return [
        { title: 'Project Detail | hello_miami' },
        {
            name: 'description',
            content: 'Project built by the Hello Miami community'
        }
    ];
};

export default function ProjectDetail() {
    const params = useParams();
    const projectId = params.projectId;
    const navigate = useNavigate();
    const { user } = useAuth();
    const { deleteProject, isLoading: isDeleting } = useDeleteProject();

    // Use Zero query for realtime project data with member relation
    const [projectData] = useQuery(
        projectId ? projectQueries.byId(projectId) : null
    );

    // Transform data
    const project = projectData
        ? {
              id: projectData.id,
              title: projectData.title || '',
              description: projectData.description,
              tags: Array.isArray(projectData.tags) ? projectData.tags : [],
              imageUrls: Array.isArray(projectData.imageUrls)
                  ? projectData.imageUrls
                  : [],
              githubUrl: projectData.githubUrl,
              publicUrl: projectData.publicUrl,
              createdAt: projectData.createdAt
                  ? new Date(projectData.createdAt).toISOString()
                  : new Date().toISOString(),
              updatedAt: projectData.updatedAt
                  ? new Date(projectData.updatedAt).toISOString()
                  : new Date().toISOString()
          }
        : null;

    const member = projectData?.member
        ? {
              id: projectData.member.id,
              email: projectData.member.lumaEmail || '',
              bio: projectData.member.bio,
              githubUsername: projectData.member.githubUsername,
              twitterHandle: projectData.member.twitterHandle,
              websiteUrl: projectData.member.websiteUrl,
              clerkUserId: projectData.member.clerkUserId
          }
        : null;

    // Check if current user owns the project
    const isOwner = user && member && member.clerkUserId === user.id;

    // Handle project deletion
    const handleDelete = async () => {
        if (!projectId) return;
        if (
            !confirm(
                'Are you sure you want to delete this project? This action cannot be undone.'
            )
        ) {
            return;
        }

        const result = await deleteProject(projectId);
        if (result.success) {
            navigate('/showcase');
        } else {
            alert(`Failed to delete project: ${result.error}`);
        }
    };

    // Loading state
    if (!projectData) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="grow py-20 px-4 flex items-center justify-center">
                    <div className="font-sans text-primary animate-pulse">
                        loading_project...
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    // Project not found
    if (!project) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="grow py-20 px-4">
                    <div className="max-w-4xl mx-auto">
                        <NeoCard className="p-12 text-center">
                            <p className="text-zinc-400 text-lg mb-4">
                                Project not found
                            </p>
                            <Link
                                to="/showcase"
                                className="text-primary hover:underline"
                            >
                                Back to showcase
                            </Link>
                        </NeoCard>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const createdDate = new Date(project.createdAt);
    const formattedDate = createdDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="grow py-20 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Back link */}
                    <Link
                        to="/showcase"
                        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-primary transition-colors mb-8"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                        back_to_showcase
                    </Link>

                    {/* Project Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl md:text-5xl font-sans text-primary mb-4 drop-shadow-[4px_4px_0px_color-mix(in_srgb,var(--primary),transparent_80%)]">
                            {project.title}
                        </h1>

                        {/* Author and date */}
                        <div className="flex items-center gap-4 text-sm text-zinc-400">
                            {member && (
                                <span>
                                    by{' '}
                                    <span className="text-primary">
                                        {member.githubUsername ||
                                            member.email.split('@')[0]}
                                    </span>
                                </span>
                            )}
                            <span className="flex items-center gap-1">
                                <CalendarIcon className="w-4 h-4" />
                                {formattedDate}
                            </span>
                        </div>
                    </div>

                    {/* Tags */}
                    {project.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-8">
                            {project.tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="text-sm px-3 py-1 bg-zinc-900 border border-primary/30 text-primary"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-4 mb-8">
                        {project.publicUrl && (
                            <a
                                href={project.publicUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-6 py-3 bg-primary text-black font-bold border-2 border-black hover:bg-primary/90 transition-colors"
                            >
                                <ExternalLinkIcon className="w-5 h-5" />
                                visit_project
                            </a>
                        )}
                        {project.githubUrl && (
                            <a
                                href={project.githubUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-6 py-3 bg-zinc-900 border-2 border-white hover:bg-zinc-800 transition-colors"
                            >
                                <GithubIcon className="w-5 h-5" />
                                view_code
                            </a>
                        )}
                        {isOwner && (
                            <button
                                onClick={() =>
                                    navigate(`/showcase/${projectId}/edit`)
                                }
                                className="flex items-center gap-2 px-6 py-3 bg-zinc-900 border-2 border-white hover:bg-zinc-800 transition-colors"
                            >
                                <EditIcon className="w-5 h-5" />
                                edit_project
                            </button>
                        )}
                        {isOwner && (
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex items-center gap-2 px-6 py-3 bg-red-900 border-2 border-red-500 hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <TrashIcon className="w-5 h-5" />
                                {isDeleting ? 'deleting...' : 'delete_project'}
                            </button>
                        )}
                    </div>

                    {/* Project Images */}
                    {project.imageUrls.length > 0 && (
                        <div className="mb-8 space-y-4">
                            {project.imageUrls.map((url, index) => (
                                <NeoCard
                                    key={index}
                                    className="p-0 overflow-hidden"
                                >
                                    <img
                                        src={url}
                                        alt={`${project.title} - Image ${index + 1}`}
                                        className="w-full h-auto"
                                    />
                                </NeoCard>
                            ))}
                        </div>
                    )}

                    {/* Project Description */}
                    {project.description && (
                        <NeoCard className="p-8 mb-8">
                            <h2 className="text-2xl font-sans text-primary mb-4">
                                about_this_project
                            </h2>
                            <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                {project.description}
                            </p>
                        </NeoCard>
                    )}

                    {/* Author Info */}
                    {member &&
                        (member.bio ||
                            member.websiteUrl ||
                            member.twitterHandle) && (
                            <NeoCard className="p-8">
                                <h2 className="text-2xl font-sans text-primary mb-4">
                                    about_the_creator
                                </h2>
                                {member.bio && (
                                    <p className="text-zinc-300 mb-4 leading-relaxed">
                                        {member.bio}
                                    </p>
                                )}
                                <div className="flex flex-wrap gap-4">
                                    {member.githubUsername && (
                                        <a
                                            href={`https://github.com/${member.githubUsername}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-zinc-400 hover:text-primary transition-colors flex items-center gap-2"
                                        >
                                            <GithubIcon className="w-4 h-4" />@
                                            {member.githubUsername}
                                        </a>
                                    )}
                                    {member.twitterHandle && (
                                        <a
                                            href={`https://twitter.com/${member.twitterHandle}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-zinc-400 hover:text-primary transition-colors"
                                        >
                                            @{member.twitterHandle}
                                        </a>
                                    )}
                                    {member.websiteUrl && (
                                        <a
                                            href={member.websiteUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-zinc-400 hover:text-primary transition-colors flex items-center gap-1"
                                        >
                                            <ExternalLinkIcon className="w-3 h-3" />
                                            website
                                        </a>
                                    )}
                                </div>
                            </NeoCard>
                        )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
