// src/index.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { jsonSchemaTransform, serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import * as dotenv from 'dotenv';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';

// Import your new routes
import { assetRoutes } from './routes/asset.routes.js';
import { assetCategoryRoutes } from './routes/asset-category.routes.js';
import { dashboardRoutes } from './routes/dashboard.routes.js';
import { departmentRoutes } from './routes/department.routes.js';
import { employeeRoutes } from './routes/employee.routes.js';
import { authRoutes } from './routes/auth.routes.js';
import fastifyJwt from '@fastify/jwt';

dotenv.config();

const fastify = Fastify({ logger: true });

// 1. Setup Zod Compilers for Fastify (This makes your validation work automatically)
fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);

// 2. Register Plugins
fastify.register(cors);

// ... under your cors registration, add the JWT plugin:
fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'super_secret_gamit_key_2026_change_me'
});

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


// Notice we removed @fastify/postgres entirely. Prisma handles our database connections now!

// 3. Health Check
fastify.get('/health', async () => {
    return { status: 'Gamit API Active', timestamp: new Date() };
});

// 4. Register API Routes
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(assetCategoryRoutes, { prefix: '/api/asset-categories' });
fastify.register(assetRoutes, { prefix: '/api/assets' });
fastify.register(dashboardRoutes, { prefix: '/api/dashboard' });
fastify.register(departmentRoutes, { prefix: '/api/departments' });
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