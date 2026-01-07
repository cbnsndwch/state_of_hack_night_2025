export function Footer() {
    return (
        <footer className="border-t-2 border-border py-12 bg-black mt-auto">
            <div className="container mx-auto px-4 max-w-7xl flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="text-zinc-400 font-mono text-xs">
                    /* &copy; {new Date().getFullYear()} cbnsndwch LLC. All rights reserved. */
                </div>
                <div className="flex gap-6 text-sm font-bold font-mono uppercase">
                    <a
                        href="https://lu.ma/miami-hack-night"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white hover:underline hover:text-primary decoration-2 underline-offset-4 decoration-primary"
                    >
                        Events
                    </a>
                    <a
                        href="#"
                        className="text-white hover:underline hover:text-primary decoration-2 underline-offset-4 decoration-primary"
                    >
                        Twitter
                    </a>
                    <a
                        href="#"
                        className="text-white hover:underline hover:text-primary decoration-2 underline-offset-4 decoration-primary"
                    >
                        Discord
                    </a>
                </div>
            </div>
        </footer>
    );
}
