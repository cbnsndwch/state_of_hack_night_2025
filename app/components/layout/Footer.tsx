import { CalendarIcon } from 'lucide-react';

import { XIcon } from '../icons/x';

export function Footer() {
    return (
        <footer className="border-t-2 border-border py-12 bg-black mt-auto">
            <div className="container mx-auto px-4 max-w-7xl flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="text-zinc-400 font-mono text-xs">
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href="https://github.com/cbnsndwch/state_of_hack_night_2025/blob/main/LICENSE.md?utm_source=state_of_hack_night_2025&utm_medium=footer_link&utm_campaign=cbn_vercel"
                        className="text-white hover:underline hover:text-primary decoration-2 underline-offset-4 decoration-primary"
                    >
                        MIT (code) + CC BY-SA 4.0 (content & data)
                    </a>
                </div>
                <div className="font-mono text-xs text-zinc-400">
                    &copy; {new Date().getFullYear()} hello_miami
                </div>
                <div className="flex gap-6 text-sm font-bold font-mono">
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href="https://x.com/joinhello_miami?utm_source=state_of_hack_night_2025&utm_medium=footer_link&utm_campaign=cbn_vercel"
                        className="text-white hover:underline hover:text-primary decoration-2 underline-offset-4 decoration-primary lowercase!"
                    >
                        <XIcon className="inline-block w-4 h-4 mb-0.5 mr-1" />
                        @joinhello_miami
                    </a>
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href="https://luma.com/hello_miami?utm_source=state_of_hack_night_2025&utm_medium=footer_link&utm_campaign=cbn_vercel"
                        className="text-white hover:underline hover:text-primary decoration-2 underline-offset-4 decoration-primary"
                    >
                        <CalendarIcon className="inline-block w-4 h-4 mb-0.5 mr-1" />
                        event calendar
                    </a>
                </div>
            </div>
        </footer>
    );
}
