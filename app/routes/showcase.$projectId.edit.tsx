import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import { ArrowLeftIcon } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useSafeQuery } from '@/hooks/use-safe-query';
import { useUpdateProject } from '@/hooks/use-zero-mutate';
import { profileQueries, projectQueries } from '@/zero/queries';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { NeoCard } from '@/components/ui/NeoCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

import type { MetaFunction } from 'react-router';

export const meta: MetaFunction = () => {
    return [
        { title: 'Edit Project | hello_miami' },
        {
            name: 'description',
            content: 'Edit your project details'
        }
    ];
};

export default function EditProject() {
    const params = useParams();
    const projectId = params.projectId;
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const { updateProject, isLoading: submitting } = useUpdateProject();

    // Get project data via Zero
    const [projectData] = useSafeQuery(
        projectId ? projectQueries.byId(projectId) : null
    );

    // Get user's profile for ownership check
    const [profile] = useSafeQuery(
        user?.id ? profileQueries.byClerkUserId(user.id) : null
    );

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [githubUrl, setGithubUrl] = useState('');
    const [publicUrl, setPublicUrl] = useState('');
    const [tags, setTags] = useState('');
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [initialized, setInitialized] = useState(false);

    // Populate form when project data arrives
    useEffect(() => {
        if (projectData && !initialized) {
            setTitle(projectData.title || '');
            setDescription(projectData.description ?? '');
            setGithubUrl(projectData.githubUrl ?? '');
            setPublicUrl(projectData.publicUrl ?? '');
            setTags(
                Array.isArray(projectData.tags)
                    ? projectData.tags.join(', ')
                    : ''
            );
            setImageUrls(
                Array.isArray(projectData.imageUrls)
                    ? [...projectData.imageUrls]
                    : []
            );
            setInitialized(true);
        }
    }, [projectData, initialized]);

    // Redirect if not owner
    const isOwner =
        profile &&
        projectData?.member &&
        projectData.member.clerkUserId === user?.id;

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
        }
    }, [authLoading, user, navigate]);

    useEffect(() => {
        // Only redirect after we've confirmed we have data and the user is NOT the owner
        if (projectData && profile && !isOwner) {
            navigate(`/showcase/${projectId}`);
        }
    }, [projectData, profile, isOwner, projectId, navigate]);

    const loading = uploading || submitting;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectId) return;

        try {
            const updatedImageUrls = [...imageUrls];

            if (file) {
                setUploading(true);
                const uploadFormData = new FormData();
                uploadFormData.append('file', file);

                const uploadResponse = await fetch('/api/upload-image', {
                    method: 'POST',
                    body: uploadFormData
                });

                if (!uploadResponse.ok) {
                    throw new Error('Failed to upload image');
                }

                const { imageUrl } = await uploadResponse.json();
                updatedImageUrls.push(imageUrl);
                setUploading(false);
            }

            const tagsList = tags
                .split(',')
                .map(t => t.trim())
                .filter(Boolean);

            const result = await updateProject({
                id: projectId,
                title: title.trim(),
                description: description.trim() || undefined,
                tags: tagsList,
                imageUrls: updatedImageUrls,
                githubUrl: githubUrl.trim() || undefined,
                publicUrl: publicUrl.trim() || undefined
            });

            if (!result.success) {
                throw new Error(result.error || 'Failed to update project');
            }

            navigate(`/showcase/${projectId}`);
        } catch (err: unknown) {
            console.error('Error updating project:', err);
            const message =
                err instanceof Error ? err.message : 'Unknown error';
            alert('Failed to update project: ' + message);
        }
    };

    const removeImage = (index: number) => {
        setImageUrls(prev => prev.filter((_, i) => i !== index));
    };

    // Loading state
    if (authLoading || !projectData) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="grow py-20 px-4 flex items-center justify-center">
                    <div className="font-sans text-primary animate-pulse">
                        loading...
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    // Not owner — shouldn't reach here due to redirect, but just in case
    if (!isOwner) return null;

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="grow py-20 px-4">
                <div className="max-w-2xl mx-auto">
                    {/* Back link */}
                    <Link
                        to={`/showcase/${projectId}`}
                        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-primary transition-colors mb-8"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                        back_to_project
                    </Link>

                    <NeoCard className="p-8">
                        <h1 className="text-3xl font-sans text-primary mb-2">
                            edit_project
                        </h1>
                        <p className="text-zinc-400 font-sans text-sm mb-8">
                            update your build details
                        </p>

                        <form onSubmit={handleSubmit} className="grid gap-6">
                            <div className="grid gap-2">
                                <Label
                                    htmlFor="title"
                                    className="font-sans text-zinc-300"
                                >
                                    title
                                </Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    required
                                    className="font-sans bg-zinc-900 border-zinc-700 text-zinc-100 focus:border-primary"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label
                                    htmlFor="description"
                                    className="font-sans text-zinc-300"
                                >
                                    description
                                </Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={e =>
                                        setDescription(e.target.value)
                                    }
                                    rows={5}
                                    className="font-sans bg-zinc-900 border-zinc-700 text-zinc-100 focus:border-primary"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label
                                    htmlFor="github"
                                    className="font-sans text-zinc-300"
                                >
                                    github_url
                                </Label>
                                <Input
                                    id="github"
                                    value={githubUrl}
                                    onChange={e => setGithubUrl(e.target.value)}
                                    className="font-sans bg-zinc-900 border-zinc-700 text-zinc-100 focus:border-primary"
                                    placeholder="https://github.com/..."
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label
                                    htmlFor="public-url"
                                    className="font-sans text-zinc-300"
                                >
                                    public_url
                                </Label>
                                <Input
                                    id="public-url"
                                    value={publicUrl}
                                    onChange={e => setPublicUrl(e.target.value)}
                                    className="font-sans bg-zinc-900 border-zinc-700 text-zinc-100 focus:border-primary"
                                    placeholder="https://..."
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label
                                    htmlFor="tags"
                                    className="font-sans text-zinc-300"
                                >
                                    tags (comma separated)
                                </Label>
                                <Input
                                    id="tags"
                                    value={tags}
                                    onChange={e => setTags(e.target.value)}
                                    className="font-sans bg-zinc-900 border-zinc-700 text-zinc-100 focus:border-primary"
                                    placeholder="react, typescript, ai"
                                />
                            </div>

                            {/* Existing images */}
                            {imageUrls.length > 0 && (
                                <div className="grid gap-2">
                                    <Label className="font-sans text-zinc-300">
                                        current images
                                    </Label>
                                    <div className="flex flex-wrap gap-3">
                                        {imageUrls.map((url, index) => (
                                            <div
                                                key={`${url}-${index}`}
                                                className="relative group w-28 h-28 border-2 border-zinc-700 overflow-hidden"
                                            >
                                                <img
                                                    src={url}
                                                    alt={`Project image ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeImage(index)
                                                    }
                                                    className="absolute inset-0 bg-red-900/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-sans text-white"
                                                >
                                                    remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid gap-2">
                                <Label
                                    htmlFor="image"
                                    className="font-sans text-zinc-300"
                                >
                                    add screenshot
                                </Label>
                                <Input
                                    id="image"
                                    type="file"
                                    accept="image/*"
                                    onChange={e =>
                                        setFile(e.target.files?.[0] || null)
                                    }
                                    className="font-sans bg-zinc-900 border-zinc-700 text-zinc-100 file:text-primary file:bg-zinc-800 file:mr-4 file:px-4 file:py-2 file:border-0"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() =>
                                        navigate(`/showcase/${projectId}`)
                                    }
                                    className="font-sans text-zinc-400 hover:text-white"
                                    disabled={loading}
                                >
                                    cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="font-sans bg-primary text-black hover:bg-primary/90"
                                >
                                    {loading ? 'saving...' : 'save_changes'}
                                </Button>
                            </div>
                        </form>
                    </NeoCard>
                </div>
            </main>
            <Footer />
        </div>
    );
}
