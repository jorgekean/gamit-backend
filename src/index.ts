import Fastify from 'fastify';
import cors from '@fastify/cors';
import postgres from '@fastify/postgres';
import * as dotenv from 'dotenv';

dotenv.config();

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