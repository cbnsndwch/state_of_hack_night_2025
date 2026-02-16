import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
    return (
        <Sonner
            theme="dark"
            className="toaster group"
            toastOptions={{
                classNames: {
                    toast: 'group toast group-[.toaster]:bg-zinc-900 group-[.toaster]:text-white group-[.toaster]:border-2 group-[.toaster]:border-white group-[.toaster]:shadow-[4px_4px_0px_0px_rgba(34,197,94,1)]',
                    description: 'group-[.toast]:text-zinc-400',
                    actionButton:
                        'group-[.toast]:bg-primary group-[.toast]:text-black',
                    cancelButton:
                        'group-[.toast]:bg-zinc-800 group-[.toast]:text-zinc-300',
                    success: 'group-[.toast]:border-primary',
                    error: 'group-[.toast]:border-red-500',
                    warning: 'group-[.toast]:border-yellow-500',
                    info: 'group-[.toast]:border-primary'
                }
            }}
            {...props}
        />
    );
};

export { Toaster };
