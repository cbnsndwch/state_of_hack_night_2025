import { NeoCard } from '@/components/ui/NeoCard';
import { useSafeQuery } from '@/hooks/use-safe-query';
import { projectQueries } from '@/zero/queries';

export function ProjectGallery() {
    // Use Zero query to get all projects reactively (SSR-safe)
    const [projects] = useSafeQuery(projectQueries.all());

    if (!projects)
        return (
            <div className="font-sans text-primary animate-pulse">
                loading builds...
            </div>
        );

    // Sort projects by creation date (newest first)
    const sortedProjects = [...projects].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
    });

    if (sortedProjects.length === 0) return null;

    return (
        <>
            <div className="mt-12" id="community-projects">
                <h2 className="text-2xl font-sans text-primary mb-6">
                    community_builds
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedProjects.map(project => {
                    // Convert array to array format for consistency
                    const imageUrls = Array.isArray(project.imageUrls)
                        ? project.imageUrls
                        : [];
                    const tags = Array.isArray(project.tags)
                        ? project.tags
                        : [];

                    return (
                        <NeoCard
                            key={project.id}
                            className="h-full flex flex-col group hover:shadow-[8px_8px_0px_0px_rgba(208,246,174,0.5)] transition-shadow"
                        >
                            {imageUrls[0] ? (
                                <div className="aspect-video w-full mb-4 overflow-hidden border-2 border-primary bg-black">
                                    <img
                                        src={imageUrls[0]}
                                        alt={project.title}
                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                    />
                                </div>
                            ) : (
                                <div className="aspect-video w-full mb-4 border-2 border-primary border-dashed flex items-center justify-center bg-black/50">
                                    <span className="text-zinc-600 font-sans">
                                        no_signal
                                    </span>
                                </div>
                            )}

                            <h3 className="text-xl font-bold font-sans text-primary mb-2 truncate">
                                {project.title}
                            </h3>

                            <p className="text-zinc-400 font-sans text-sm leading-relaxed mb-6 line-clamp-3">
                                {project.description ||
                                    'No description provided.'}
                            </p>

                            <div className="mt-auto space-y-4">
                                {tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {tags.slice(0, 3).map((tag, index) => (
                                            <span
                                                key={`${tag}-${index}`}
                                                className="px-2 py-0.5 text-xs border border-primary/50 text-primary font-sans bg-primary/10"
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {project.githubUrl && (
                                    <a
                                        href={project.githubUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block text-right text-xs font-sans text-zinc-500 hover:text-primary hover:underline"
                                    >
                                        view_source -&gt;
                                    </a>
                                )}
                                {project.publicUrl && (
                                    <a
                                        href={project.publicUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block text-right text-xs font-sans text-zinc-500 hover:text-primary hover:underline"
                                    >
                                        visit_build -&gt;
                                    </a>
                                )}
                            </div>
                        </NeoCard>
                    );
                })}
            </div>
        </>
    );
}
