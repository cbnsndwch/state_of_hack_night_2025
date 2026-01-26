import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { NeoCard } from '@/components/ui/NeoCard';
import type { Database } from '@/types/supabase';

type Project = Database['public']['Tables']['projects']['Row'];

export function ProjectGallery() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProjects() {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching projects:', error);
            }

            if (data) {
                setProjects(data);
            }
            setLoading(false);
        }

        fetchProjects();
    }, []);

    if (loading)
        return (
            <div className="font-sans text-primary animate-pulse">
                loading builds...
            </div>
        );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
                <NeoCard
                    key={project.id}
                    className="h-full flex flex-col group hover:shadow-[8px_8px_0px_0px_rgba(208,246,174,0.5)] transition-shadow"
                >
                    {project.image_urls?.[0] ? (
                        <div className="aspect-video w-full mb-4 overflow-hidden border-2 border-primary bg-black">
                            <img
                                src={project.image_urls[0]}
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
                        {project.description || 'No description provided.'}
                    </p>

                    <div className="mt-auto space-y-4">
                        {project.tags && project.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {project.tags.slice(0, 3).map((tag, index) => (
                                    <span
                                        key={`${tag}-${index}`}
                                        className="px-2 py-0.5 text-xs border border-primary/50 text-primary font-sans bg-primary/10"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {project.github_url && (
                            <a
                                href={project.github_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-right text-xs font-sans text-zinc-500 hover:text-primary hover:underline"
                            >
                                view_source -&gt;
                            </a>
                        )}
                        {project.public_url && (
                            <a
                                href={project.public_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-right text-xs font-sans text-zinc-500 hover:text-primary hover:underline"
                            >
                                visit_build -&gt;
                            </a>
                        )}
                    </div>
                </NeoCard>
            ))}
        </div>
    );
}
