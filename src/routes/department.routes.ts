import { type FastifyInstance } from 'fastify';
import { type ZodTypeProvider } from 'fastify-type-provider-zod';
import { DepartmentService } from '../services/department.service.js';
import { createDepartmentSchema, departmentParamsSchema } from '../schemas/department.schema.js';

export async function departmentRoutes(fastify: FastifyInstance) {
    const server = fastify.withTypeProvider<ZodTypeProvider>();

    server.get('/', async (request, reply) => {
        const departments = await DepartmentService.getAll();
        return reply.send({ success: true, data: departments });
    });

    server.get(
        '/:id',
        { schema: { params: departmentParamsSchema } },
        async (request, reply) => {
            const department = await DepartmentService.getById(request.params.id);

            if (!department || department.deletedAt) {
                return reply.code(404).send({
                    success: false,
                    message: 'Department not found or has been archived'
                });
            }

            return reply.send({ success: true, data: department });
        }
    );

    server.post('/', { schema: { body: createDepartmentSchema } }, async (request, reply) => {
        const newDepartment = await DepartmentService.create(request.body);
        return reply.code(201).send({ success: true, data: newDepartment });
    });

    server.delete('/:id', { schema: { params: departmentParamsSchema } }, async (request, reply) => {
        await DepartmentService.softDelete(request.params.id);
        return reply.send({ success: true, message: 'Department archived' });
    });
}
