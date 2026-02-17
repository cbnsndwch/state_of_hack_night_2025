import { useEffect, useState } from 'react';
import { useUpdateProject } from '@/hooks/use-zero-mutate';
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
    DialogTitle
} from '@/components/ui/dialog';

interface ProjectData {
    id: string;
    title: string;
    description: string | null;
    tags: readonly string[] | string[];
    imageUrls: readonly string[] | string[];
    githubUrl: string | null;
    publicUrl: string | null;
}

type Props = {
    project: ProjectData;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onProjectUpdated?: () => void;
};

export function EditProjectDialog({
    project,
    open,
    onOpenChange,
    onProjectUpdated
}: Props) {
    const { updateProject, isLoading: submitting } = useUpdateProject();
    const [uploading, setUploading] = useState(false);

    const [title, setTitle] = useState(project.title);
    const [description, setDescription] = useState(project.description ?? '');
    const [githubUrl, setGithubUrl] = useState(project.githubUrl ?? '');
    const [publicUrl, setPublicUrl] = useState(project.publicUrl ?? '');
    const [tags, setTags] = useState(
        Array.isArray(project.tags) ? project.tags.join(', ') : ''
    );
    const [imageUrls, setImageUrls] = useState<string[]>(
        Array.isArray(project.imageUrls) ? [...project.imageUrls] : []
    );
    const [file, setFile] = useState<File | null>(null);

    // Reset form state when project changes
    useEffect(() => {
        setTitle(project.title);
        setDescription(project.description ?? '');
        setGithubUrl(project.githubUrl ?? '');
        setPublicUrl(project.publicUrl ?? '');
        setTags(Array.isArray(project.tags) ? project.tags.join(', ') : '');
        setImageUrls(
            Array.isArray(project.imageUrls) ? [...project.imageUrls] : []
        );
        setFile(null);
    }, [project]);

    const loading = uploading || submitting;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const updatedImageUrls = [...imageUrls];

            // Upload new image if provided
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

            // Parse tags from comma-separated string
            const tagsList = tags
                .split(',')
                .map(t => t.trim())
                .filter(Boolean);

            const result = await updateProject({
                id: project.id,
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

            onOpenChange(false);
            onProjectUpdated?.();
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-106.25 bg-zinc-950 border-zinc-800 text-zinc-100 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="font-sans text-primary">
                        edit_project
                    </DialogTitle>
                    <DialogDescription className="font-sans text-zinc-400">
                        update your build details
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label
                            htmlFor="edit-title"
                            className="font-sans text-zinc-300"
                        >
                            title
                        </Label>
                        <Input
                            id="edit-title"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required
                            className="font-sans bg-zinc-900 border-zinc-700 text-zinc-100 focus:border-primary"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label
                            htmlFor="edit-description"
                            className="font-sans text-zinc-300"
                        >
                            description
                        </Label>
                        <Textarea
                            id="edit-description"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={4}
                            className="font-sans bg-zinc-900 border-zinc-700 text-zinc-100 focus:border-primary"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label
                            htmlFor="edit-github"
                            className="font-sans text-zinc-300"
                        >
                            github_url
                        </Label>
                        <Input
                            id="edit-github"
                            value={githubUrl}
                            onChange={e => setGithubUrl(e.target.value)}
                            className="font-sans bg-zinc-900 border-zinc-700 text-zinc-100 focus:border-primary"
                            placeholder="https://github.com/..."
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label
                            htmlFor="edit-public-url"
                            className="font-sans text-zinc-300"
                        >
                            public_url
                        </Label>
                        <Input
                            id="edit-public-url"
                            value={publicUrl}
                            onChange={e => setPublicUrl(e.target.value)}
                            className="font-sans bg-zinc-900 border-zinc-700 text-zinc-100 focus:border-primary"
                            placeholder="https://..."
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label
                            htmlFor="edit-tags"
                            className="font-sans text-zinc-300"
                        >
                            tags (comma separated)
                        </Label>
                        <Input
                            id="edit-tags"
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
                            <div className="flex flex-wrap gap-2">
                                {imageUrls.map((url, index) => (
                                    <div
                                        key={`${url}-${index}`}
                                        className="relative group w-24 h-24 border border-zinc-700 overflow-hidden"
                                    >
                                        <img
                                            src={url}
                                            alt={`Project image ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
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
                            htmlFor="edit-image"
                            className="font-sans text-zinc-300"
                        >
                            add screenshot
                        </Label>
                        <Input
                            id="edit-image"
                            type="file"
                            accept="image/*"
                            onChange={e => setFile(e.target.files?.[0] || null)}
                            className="font-sans bg-zinc-900 border-zinc-700 text-zinc-100 file:text-primary file:bg-zinc-800 file:mr-4 file:px-4 file:py-2 file:border-0"
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
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
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
