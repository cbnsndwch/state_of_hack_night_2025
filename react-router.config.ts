import type { Config } from '@react-router/dev/config';

const config: Config = {
    ssr: false,
    buildDirectory: 'dist',
    prerender: {
        paths: ['/', 'manifesto', 'reports/2025']
    }
};

export default config;
