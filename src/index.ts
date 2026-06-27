// src/index.ts
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import { jsonSchemaTransform, serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import * as dotenv from 'dotenv';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fastifyJwt from '@fastify/jwt';

// Import your new routes
import { assetRoutes } from './routes/asset.routes.js';
import { assetHistoryRoutes } from './routes/asset-history.routes.js';
import { assetCategoryRoutes } from './routes/asset-category.routes.js';
import { dashboardRoutes } from './routes/dashboard.routes.js';
import { departmentRoutes } from './routes/department.routes.js';
import { employeeRoutes } from './routes/employee.routes.js';
import { authRoutes } from './routes/auth.routes.js';
import { reportRoutes } from './routes/reports.js';
import { maintenanceRoutes } from './routes/maintenance.routes.js';

dotenv.config();

// 1. Tell TypeScript about our custom decorator
declare module 'fastify' {
    interface FastifyInstance {
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    }
}

const fastify = Fastify({ logger: true });

// 2. Setup Zod Compilers for Fastify
fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);

// 3. Register Plugins
fastify.register(cors, {
    origin: ['http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
});

fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'super_secret_gamit_key_2026_change_me'
});

// ✨ 4. Create the global authentication decorator
fastify.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
        await request.jwtVerify();
    } catch (err) {
        return reply.status(401).send({ message: "Unauthorized: Invalid or missing token." });
    }
});

// Swagger Documentation Setup
fastify.register(fastifySwagger, {
    openapi: {
        info: {
            title: 'Gamit API',
            description: 'Interactive API documentation for Gamit backend',
            version: '1.0.0'
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        }
    },
    transform: jsonSchemaTransform
});

fastify.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
        docExpansion: 'list',
        deepLinking: false
    }
});

// --- PUBLIC ROUTES ---
// These routes execute without checking for a JWT token

fastify.get('/health', async () => {
    return { status: 'Gamit API Active', timestamp: new Date() };
});

fastify.register(authRoutes, { prefix: '/api/auth' });

// --- PROTECTED ROUTES ---
// We create a "child" plugin. The onRequest hook ensures every route 
// inside this block requires a valid JWT token.
fastify.register(async function privateRoutes(childServer) {

    // ✨ The Magic Hook: Secures all routes in this block
    childServer.addHook('onRequest', childServer.authenticate);

    // Register all core API routes (Notice the prefix is just the resource name, 
    // because '/api' is applied to the entire wrapper below)
    childServer.register(assetCategoryRoutes, { prefix: '/asset-categories' });
    childServer.register(assetRoutes, { prefix: '/assets' });
    childServer.register(assetHistoryRoutes, { prefix: '/asset-history' });
    childServer.register(dashboardRoutes, { prefix: '/dashboard' });
    childServer.register(departmentRoutes, { prefix: '/departments' });
    childServer.register(employeeRoutes, { prefix: '/employees' });
    childServer.register(reportRoutes, { prefix: '/reports' });
    childServer.register(maintenanceRoutes, { prefix: '/maintenance' });

}, { prefix: '/api' });

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