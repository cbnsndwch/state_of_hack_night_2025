import { type MetaFunction } from 'react-router';
import { useLoaderData, Link } from 'react-router';
import { GithubIcon, ExternalLinkIcon, SearchIcon, XIcon } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { NeoCard } from '@/components/ui/NeoCard';
import { getProjectsWithMembers } from '@/lib/db/projects.server';

export const meta: MetaFunction = () => {
    return [
        { title: 'Project Showcase | hello_miami' },
        {
            name: 'description',
            content:
                'Discover projects built by the Hello Miami community. Hardware, software, art, and more.'
        }
    ];
};

// Serialized project type for client-side rendering
interface SerializedProject {
    id: string;
    title: string;
    description: string | null;
    tags: string[];
    imageUrls: string[];
    githubUrl: string | null;
    publicUrl: string | null;
    createdAt: string;
    member: {
        id: string;
        email: string;
        clerkUserId: string | null;
    };
}

export async function loader() {
    // Get all projects with member info
    const projects = await getProjectsWithMembers();

    // Serialize projects for JSON transfer
    const serializedProjects: SerializedProject[] = projects.map(project => ({
        id: project._id.toString(),
        title: project.title,
        description: project.description,
        tags: project.tags,
        imageUrls: project.imageUrls,
        githubUrl: project.githubUrl,
        publicUrl: project.publicUrl,
        createdAt: project.createdAt.toISOString(),
        member: {
            id: project.member._id.toString(),
            email: project.member.lumaEmail,
            clerkUserId: project.member.clerkUserId
        }
    }));

    return { projects: serializedProjects };
}

export default function Showcase() {
    const { projects } = useLoaderData<typeof loader>();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    // Extract all unique tags from projects
    const allTags = useMemo(() => {
        const tagSet = new Set<string>();
        projects.forEach(project => {
            project.tags.forEach(tag => tagSet.add(tag));
        });
        return Array.from(tagSet).sort();
    }, [projects]);

    // Filter projects based on search query and selected tags
    const filteredProjects = useMemo(() => {
        return projects.filter(project => {
            // Search filter (title, description, tags)
            const matchesSearch =
                searchQuery === '' ||
                project.title
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                project.description
                    ?.toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                project.tags.some(tag =>
                    tag.toLowerCase().includes(searchQuery.toLowerCase())
                );

            // Tag filter (project must have ALL selected tags)
            const matchesTags =
                selectedTags.length === 0 ||
                selectedTags.every(selectedTag =>
                    project.tags.includes(selectedTag)
                );

            return matchesSearch && matchesTags;
        });
    }, [projects, searchQuery, selectedTags]);

    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedTags([]);
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="grow py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-5xl font-sans text-primary mb-4 drop-shadow-[4px_4px_0px_color-mix(in_srgb,var(--primary),transparent_80%)]">
                            project showcase
                        </h1>
                        <p className="text-xl text-zinc-400 max-w-2xl">
                            Check out what our community is building. Hardware,
                            software, art, and everything in between.
                        </p>
                    </div>

                    {/* Search and Filter Section */}
                    {projects.length > 0 && (
                        <div className="mb-8 space-y-4">
                            {/* Search bar */}
                            <div className="relative">
                                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                <input
                                    type="text"
                                    placeholder="Search projects by title, description, or tags..."
                                    value={searchQuery}
                                    onChange={e =>
                                        setSearchQuery(e.target.value)
                                    }
                                    className="w-full pl-12 pr-4 py-3 bg-zinc-950 border-2 border-white text-white placeholder-zinc-500 focus:outline-none focus:border-primary"
                                />
                            </div>

                            {/* Filter tags */}
                            {allTags.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-zinc-400 font-sans">
                                            filter_by_tech_stack:
                                        </p>
                                        {(selectedTags.length > 0 ||
                                            searchQuery) && (
                                            <button
                                                onClick={clearFilters}
                                                className="text-xs text-zinc-500 hover:text-primary transition-colors flex items-center gap-1"
                                            >
                                                <XIcon className="w-3 h-3" />
                                                clear_filters
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {allTags.map(tag => (
                                            <button
                                                key={tag}
                                                onClick={() => toggleTag(tag)}
                                                className={`text-xs px-3 py-1.5 border-2 transition-colors ${
                                                    selectedTags.includes(tag)
                                                        ? 'bg-primary text-black border-black font-bold'
                                                        : 'bg-zinc-950 text-zinc-400 border-zinc-700 hover:border-primary hover:text-primary'
                                                }`}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Results count */}
                            <p className="text-sm text-zinc-500">
                                showing {filteredProjects.length} of{' '}
                                {projects.length} projects
                            </p>
                        </div>
                    )}

                    {/* Projects Grid */}
                    {projects.length === 0 ? (
                        <NeoCard className="p-12 text-center">
                            <p className="text-zinc-400 text-lg">
                                No projects yet. Be the first to showcase your
                                work!
                            </p>
                        </NeoCard>
                    ) : filteredProjects.length === 0 ? (
                        <NeoCard className="p-12 text-center">
                            <p className="text-zinc-400 text-lg mb-2">
                                No projects match your filters.
                            </p>
                            <button
                                onClick={clearFilters}
                                className="text-primary hover:underline"
                            >
                                Clear filters
                            </button>
                        </NeoCard>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProjects.map(project => (
                                <ProjectCard
                                    key={project.id}
                                    project={project}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}

interface ProjectCardProps {
    project: SerializedProject;
}

function ProjectCard({ project }: ProjectCardProps) {
    const createdDate = new Date(project.createdAt);
    const formattedDate = createdDate.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric'
    });

    return (
        <NeoCard className="p-6 flex flex-col hover:translate-x-1 hover:-translate-y-1 transition-transform">
            {/* Project image if available */}
            {project.imageUrls.length > 0 && (
                <div className="mb-4 -mx-6 -mt-6">
                    <img
                        src={project.imageUrls[0]}
                        alt={project.title}
                        className="w-full h-48 object-cover border-b-2 border-white"
                    />
                </div>
            )}

            {/* Project title */}
            <Link to={`/showcase/${project.id}`}>
                <h3 className="text-xl font-sans text-primary mb-2 line-clamp-2 hover:underline cursor-pointer">
                    {project.title}
                </h3>
            </Link>

            {/* Author */}
            <p className="text-xs text-zinc-500 mb-3">
                by {project.member.email.split('@')[0]} • {formattedDate}
            </p>

            {/* Description */}
            {project.description && (
                <p className="text-sm text-zinc-400 mb-4 line-clamp-3 flex-grow">
                    {project.description}
                </p>
            )}

            {/* Tags */}
            {project.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {project.tags.slice(0, 4).map((tag, index) => (
                        <span
                            key={index}
                            className="text-xs px-2 py-1 bg-zinc-900 border border-primary/30 text-primary"
                        >
                            {tag}
                        </span>
                    ))}
                    {project.tags.length > 4 && (
                        <span className="text-xs px-2 py-1 text-zinc-500">
                            +{project.tags.length - 4} more
                        </span>
                    )}
                </div>
            )}

            {/* Links */}
            <div className="flex gap-2 mt-auto">
                {project.githubUrl && (
                    <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-zinc-900 border-2 border-white hover:bg-zinc-800 transition-colors text-sm"
                        title="View on GitHub"
                    >
                        <GithubIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">code</span>
                    </a>
                )}
                {project.publicUrl && (
                    <a
                        href={project.publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-black font-bold border-2 border-black hover:bg-primary/90 transition-colors text-sm"
                        title="Visit project"
                    >
                        <ExternalLinkIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">visit</span>
                    </a>
                )}
                {!project.githubUrl && !project.publicUrl && (
                    <div className="flex-1 text-center text-xs text-zinc-600 py-2">
                        No links available
                    </div>
                )}
            </div>
        </NeoCard>
    );
}
