import { useState } from 'react';
import { useQuery } from '@rocicorp/zero/react';
import { useAuth } from '@/hooks/use-auth';
import { useCreateProject } from '@/hooks/use-zero-mutate';
import { profileQueries } from '@/zero/queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';

export function AddProjectDialog({
    onProjectAdded,
    open: externalOpen,
    onOpenChange: externalOnOpenChange
}: {
    onProjectAdded?: () => void;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}) {
    const { user } = useAuth();
    const { createProject, isLoading: submitting } = useCreateProject();
    const [internalOpen, setInternalOpen] = useState(false);

    // Use external state if provided, otherwise use internal state
    const open = externalOpen !== undefined ? externalOpen : internalOpen;
    const setOpen = externalOnOpenChange || setInternalOpen;
    const [uploading, setUploading] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [githubUrl, setGithubUrl] = useState('');
    const [publicUrl, setPublicUrl] = useState('');
    const [tags, setTags] = useState('');
    const [file, setFile] = useState<File | null>(null);

    // Get user's profile for memberId
    const [profile] = useQuery(
        user?.id ? profileQueries.byClerkUserId(user.id) : null
    );

    const loading = uploading || submitting;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !profile) return;

        try {
            const imageUrls: string[] = [];

            // Upload image to Cloudinary via API endpoint
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
                imageUrls.push(imageUrl);
                setUploading(false);
            }

            // Parse tags from comma-separated string
            const tagsList = tags
                .split(',')
                .map(t => t.trim())
                .filter(Boolean);

            // Submit project data via Zero mutation
            const result = await createProject({
                memberId: profile.id,
                title: title.trim(),
                description: description.trim() || undefined,
                tags: tagsList.length > 0 ? tagsList : undefined,
                imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
                githubUrl: githubUrl.trim() || undefined,
                publicUrl: publicUrl.trim() || undefined
            });

            if (!result.success) {
                throw new Error(result.error || 'Failed to create project');
            }

            // Reset form and close dialog
            setOpen(false);
            setTitle('');
            setDescription('');
            setGithubUrl('');
            setPublicUrl('');
            setTags('');
            setFile(null);
            onProjectAdded?.();
        } catch (err: unknown) {
            console.error('Error adding project:', err);
            const message =
                err instanceof Error ? err.message : 'Unknown error';
            alert('Failed to add project: ' + message);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    className="font-sans bg-primary text-black hover:bg-primary/90"
                    data-add-project-trigger
                >
                    submit_build
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-106.25 bg-zinc-950 border-zinc-800 text-zinc-100">
                <DialogHeader>
                    <DialogTitle className="font-sans text-primary">
                        submit_build
                    </DialogTitle>
                    <DialogDescription className="font-sans text-zinc-400">
                        show off what you made at a Hack Night
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
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
                            onChange={e => setDescription(e.target.value)}
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
                            htmlFor="public_url"
                            className="font-sans text-zinc-300"
                        >
                            public_url
                        </Label>
                        <Input
                            id="public_url"
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
                    <div className="grid gap-2">
                        <Label
                            htmlFor="image"
                            className="font-sans text-zinc-300"
                        >
                            screenshot
                        </Label>
                        <Input
                            id="image"
                            type="file"
                            accept="image/*"
                            onChange={e => setFile(e.target.files?.[0] || null)}
                            className="font-sans bg-zinc-900 border-zinc-700 text-zinc-100 file:text-primary file:bg-zinc-800 file:mr-4 file:px-4 file:py-2 file:border-0"
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full font-sans bg-primary text-black hover:bg-primary/90"
                        >
                            {loading ? 'uploading...' : 'submit'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
