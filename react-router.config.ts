import type { Config } from '@react-router/dev/config';

const config: Config = {
    // Enable SSR for server-side data access (MongoDB loaders/actions)
    ssr: true,
    buildDirectory: 'dist',
    // Pre-render static pages for SEO
    prerender: {
        paths: ['/', 'ethos', 'reports/2025']
    }
};

export default config;
