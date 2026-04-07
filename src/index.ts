import Fastify from 'fastify';
import cors from '@fastify/cors';
import postgres from '@fastify/postgres';
import * as dotenv from 'dotenv';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client/extension';

dotenv.config();

// 1. Create a standard Postgres connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// 2. Wrap it in the Prisma Adapter
const adapter = new PrismaPg(pool);

// 3. Initialize Prisma with the adapter
export const prisma = new PrismaClient({ adapter });

const fastify = Fastify({ logger: true });

// Register Plugins
fastify.register(cors);
fastify.register(postgres, {
    connectionString: process.env.DATABASE_URL
});

// Health Check
fastify.get('/health', async () => {
    return { status: 'Gamit API Active', timestamp: new Date() };
});

const start = async () => {
    try {
        await fastify.listen({ port: Number(process.env.PORT) || 3000, host: '0.0.0.0' });
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();