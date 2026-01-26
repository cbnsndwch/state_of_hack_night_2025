import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/hooks/use-auth';
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
    onProjectAdded
}: {
    onProjectAdded?: () => void;
}) {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [githubUrl, setGithubUrl] = useState('');
    const [publicUrl, setPublicUrl] = useState('');
    const [tags, setTags] = useState('');
    const [file, setFile] = useState<File | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        try {
            const imageUrls: string[] = [];

            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}/${Math.random()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('projects')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                const {
                    data: { publicUrl }
                } = supabase.storage.from('projects').getPublicUrl(fileName);

                imageUrls.push(publicUrl);
            }

            const { error } = await supabase.from('projects').insert({
                member_id: user.id,
                title,
                description,
                github_url: githubUrl,
                public_url: publicUrl,
                tags: tags
                    .split(',')
                    .map(t => t.trim())
                    .filter(Boolean),
                image_urls: imageUrls
            });

            if (error) throw error;

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
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="font-sans bg-primary text-black hover:bg-primary/90">
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
