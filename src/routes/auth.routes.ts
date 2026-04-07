import { type FastifyInstance } from 'fastify';
import { type ZodTypeProvider } from 'fastify-type-provider-zod';
import { AuthService } from '../services/auth.service.js';
import { registerSchema, loginSchema } from '../schemas/auth.schema.js';

export async function authRoutes(fastify: FastifyInstance) {
    const server = fastify.withTypeProvider<ZodTypeProvider>();

    // POST /api/auth/register
    server.post('/register', { schema: { body: registerSchema } }, async (request, reply) => {
        try {
            const user = await AuthService.registerUser(request.body);
            return reply.code(201).send({ success: true, data: user });
        } catch (error: any) {
            return reply.code(400).send({ success: false, message: error.message });
        }
    });

    // POST /api/auth/login
    server.post('/login', { schema: { body: loginSchema } }, async (request, reply) => {
        const { email, password } = request.body;

        const user = await AuthService.verifyLogin(email, password);

        if (!user) {
            return reply.code(401).send({ success: false, message: "Invalid email or password" });
        }

        // Generate the JWT containing the user ID and Role
        const token = fastify.jwt.sign({
            id: user.id,
            role: user.role,
            name: user.name
        }, { expiresIn: '7d' }); // Token lasts for 7 days

        return reply.send({ success: true, token, user });
    });
}