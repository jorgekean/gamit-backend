// src/index.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import * as dotenv from 'dotenv';

// Import your new routes
import { departmentRoutes } from './routes/department.routes.js';
import { employeeRoutes } from './routes/employee.routes.js';

dotenv.config();

const fastify = Fastify({ logger: true });

// 1. Setup Zod Compilers for Fastify (This makes your validation work automatically)
fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);

// 2. Register Plugins
fastify.register(cors);

// Notice we removed @fastify/postgres entirely. Prisma handles our database connections now!

// 3. Health Check
fastify.get('/health', async () => {
    return { status: 'Gamit API Active', timestamp: new Date() };
});

// 4. Register API Routes
fastify.register(departmentRoutes, { prefix: '/api/departments' });
// This tells Fastify that all routes inside employeeRoutes start with /api/employees
fastify.register(employeeRoutes, { prefix: '/api/employees' });

// 5. Start the Server
const start = async () => {
    try {
        const port = Number(process.env.PORT) || 3000;
        await fastify.listen({ port, host: '0.0.0.0' });
        console.log(`🚀 Server running at http://localhost:${port}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();