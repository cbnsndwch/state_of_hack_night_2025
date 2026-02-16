import { useEffect, useState } from 'react';
import { useNavigate, useLoaderData } from 'react-router';
import { useAuth } from '@/hooks/use-auth';
import { useSafeQuery } from '@/hooks/use-safe-query';
import { profileQueries, projectQueries } from '@/zero/queries';
import { AppLayout } from '@/components/layout/AppLayout';
import { NeoCard } from '@/components/ui/NeoCard';
import { AddProjectDialog } from '@/components/projects/AddProjectDialog';
import {
    createDashboardLoader,
    type DashboardLoaderData
} from '@/lib/create-dashboard-loader.server';
import { getProjectsByMemberId } from '@/lib/db/projects.server';
import { Button } from '@/components/ui/button';

export { DashboardErrorBoundary as ErrorBoundary } from '@/components/layout/DashboardErrorBoundary';

/**
 * Server-side loader: auth + profile + projects from Postgres.
 */
export const loader = createDashboardLoader(async ({ profile }) => {
    const projects = profile ? await getProjectsByMemberId(profile.id) : [];
    return { projects };
});

type LoaderData = DashboardLoaderData<{
    projects: Awaited<ReturnType<typeof getProjectsByMemberId>>;
}>;

export default function DashboardProjects() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const [addProjectDialogOpen, setAddProjectDialogOpen] = useState(false);

    // Server-side loader data
    const loaderData = useLoaderData<LoaderData>();

    // Zero queries for live/reactive data
    const [zeroProfile] = useSafeQuery(
        user?.id ? profileQueries.byClerkUserId(user.id) : null
    );
    const [zeroProjects] = useSafeQuery(
        zeroProfile?.id ? projectQueries.byMemberId(zeroProfile.id) : null
    );

    // Prefer Zero's reactive data, fall back to server-loaded data
    const profile = zeroProfile ?? loaderData?.profile ?? null;
    const projects = zeroProjects ?? loaderData?.projects ?? null;

    useEffect(() => {
        if (!loading && !user) {
            navigate('/');
        }
    }, [user, loading, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="font-sans text-primary animate-pulse">
                    loading...
                </div>
            </div>
        );
    }

    if (!user || !profile) return null;

    const items = projects || [];

    return (
        <AppLayout isAdmin={!!profile?.isAppAdmin}>
            <main className="max-w-6xl mx-auto px-4 py-12 bg-black text-white selection:bg-primary selection:text-black min-h-full">
                <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/dashboard')}
                            className="text-zinc-400 hover:text-white font-sans text-sm mb-3 flex items-center gap-2"
                        >
                            <span>←</span> back to dashboard
                        </Button>
                        <h1 className="text-4xl font-sans text-primary mb-2">
                            my_projects
                        </h1>
                        <p className="text-zinc-400 font-sans">
                            your builds and hack night demos
                        </p>
                    </div>
                    <AddProjectDialog
                        open={addProjectDialogOpen}
                        onOpenChange={setAddProjectDialogOpen}
                        onProjectAdded={() => {
                            // Zero will automatically sync the new project
                        }}
                    />
                </header>

                {items.length === 0 ? (
                    <NeoCard className="p-8 text-center">
                        <h2 className="text-xl font-sans text-primary mb-2">
                            no_projects_yet
                        </h2>
                        <p className="text-zinc-400 font-sans text-sm">
                            ship something small and share it with the community
                        </p>
                    </NeoCard>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {items.map(project => {
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
                                                {tags
                                                    .slice(0, 3)
                                                    .map((tag, index) => (
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
                )}
            </main>
        </AppLayout>
    );
}
