import path from 'node:path';

import { defineConfig } from 'vite';
import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { reactRouterDevTools } from 'react-router-devtools';

// https://vite.dev/config/
export default defineConfig({
    plugins: [reactRouterDevTools(), reactRouter(), tailwindcss()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './app'),
            '@drizzle': path.resolve(__dirname, './drizzle')
        }
    }
});
