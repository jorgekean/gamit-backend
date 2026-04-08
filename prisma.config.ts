// prisma.config.ts
import { defineConfig, env } from '@prisma/config';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
    // Tell Prisma where to find the schema
    schema: "prisma/schema.prisma",

    // This is what the CLI uses to run the migration
    datasource: {
        url: env("DATABASE_URL"),
    },

    migrations: {
        seed: "tsx prisma/seed.ts",
    },
});