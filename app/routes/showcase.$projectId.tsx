import { type MetaFunction, data } from 'react-router';
import { useLoaderData, Link } from 'react-router';
import {
    GithubIcon,
    ExternalLinkIcon,
    ArrowLeftIcon,
    CalendarIcon
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { NeoCard } from '@/components/ui/NeoCard';
import { getProjectById } from '@/lib/db/projects.server';
import { getProfileById } from '@/lib/db/profiles.server';

export const meta: MetaFunction = ({ data }) => {
    const loaderData = data as Awaited<ReturnType<typeof loader>> | undefined;

    if (!loaderData || !loaderData.project) {
        return [{ title: 'Project Not Found | hello_miami' }];
    }

    return [
        { title: `${loaderData.project.title} | hello_miami` },
        {
            name: 'description',
            content:
                loaderData.project.description ||
                'Project built by the Hello Miami community'
        }
    ];
};

export async function loader({ params }: { params: { projectId: string } }) {
    const { projectId } = params;

    if (!projectId) {
        throw data({ message: 'Project ID is required' }, { status: 400 });
    }

    const project = await getProjectById(projectId);

    if (!project) {
        throw data({ message: 'Project not found' }, { status: 404 });
    }

    // Get member info
    const member = await getProfileById(project.memberId.toString());

    return {
        project: {
            id: project._id.toString(),
            title: project.title,
            description: project.description,
            tags: project.tags,
            imageUrls: project.imageUrls,
            githubUrl: project.githubUrl,
            publicUrl: project.publicUrl,
            createdAt: project.createdAt.toISOString(),
            updatedAt: project.updatedAt.toISOString()
        },
        member: member
            ? {
                  id: member._id.toString(),
                  email: member.lumaEmail,
                  bio: member.bio,
                  githubUsername: member.githubUsername,
                  twitterHandle: member.twitterHandle,
                  websiteUrl: member.websiteUrl
              }
            : null
    };
}

export default function ProjectDetail() {
    const { project, member } = useLoaderData<typeof loader>();

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
