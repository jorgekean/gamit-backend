import { type FastifyInstance } from 'fastify';
import { type ZodTypeProvider } from 'fastify-type-provider-zod';
import { EmployeeService } from '../services/employee.service.js';
import { createEmployeeSchema, employeeParamsSchema } from '../schemas/employee.schema.js';

export async function employeeRoutes(fastify: FastifyInstance) {
    const server = fastify.withTypeProvider<ZodTypeProvider>();

    server.get('/', async (request, reply) => {
        const employees = await EmployeeService.getAll();
        return reply.send({ success: true, data: employees });
    });

    // GET /employees/:id
    server.get(
        '/:id',
        { schema: { params: employeeParamsSchema } },
        async (request, reply) => {
            const employee = await EmployeeService.getById(request.params.id);

            if (!employee) {
                return reply.code(404).send({
                    success: false,
                    message: "Employee not found or has been archived"
                });
            }

            return reply.send({ success: true, data: employee });
        }
    );

    server.post('/', { schema: { body: createEmployeeSchema } }, async (request, reply) => {
        const newEmployee = await EmployeeService.create(request.body);
        return reply.code(201).send({ success: true, data: newEmployee });
    });

    server.delete('/:id', { schema: { params: employeeParamsSchema } }, async (request, reply) => {
        await EmployeeService.softDelete(request.params.id);
        return reply.send({ success: true, message: "Employee archived" });
    });
}