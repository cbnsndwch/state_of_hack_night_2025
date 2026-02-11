import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './drizzle/schema.ts',
    out: './drizzle/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url:
            process.env.DATABASE_URL ||
            'postgresql://postgres:password@localhost:5433/hello_miami'
    },
    verbose: true,
    strict: true
});
