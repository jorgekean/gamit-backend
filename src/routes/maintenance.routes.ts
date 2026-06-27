import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { MaintenanceService } from '../services/maintenance.service.js';
import { createMaintenanceSchema, updateMaintenanceSchema, maintenanceQuerySchema, maintenanceParamsSchema } from '../schemas/maintenance.schema.js';

export async function maintenanceRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const maintenanceService = new MaintenanceService();

  server.get('/', {
    schema: { querystring: maintenanceQuerySchema },
  }, async (request, reply) => {
    const query = request.query as { status?: string, assetId?: string, search?: string, page?: number, limit?: number };
    const filters: { status?: string, assetId?: string, search?: string, page?: number, limit?: number } = {};
    if (query.status !== undefined) filters.status = query.status;
    if (query.assetId !== undefined) filters.assetId = query.assetId;
    if (query.search !== undefined) filters.search = query.search;
    if (query.page !== undefined) filters.page = query.page;
    if (query.limit !== undefined) filters.limit = query.limit;
    return maintenanceService.getAll(filters);
  });

  server.get('/:id', {
    schema: { params: maintenanceParamsSchema },
  }, async (request, reply) => {
    const { id } = request.params;
    const record = await maintenanceService.getById(id);
    if (!record) {
      return reply.status(404).send({ message: 'Maintenance record not found' });
    }
    return record;
  });

  server.post('/', {
    schema: {
      body: createMaintenanceSchema,
    },
  }, async (request, reply) => {
    const record = await maintenanceService.create(request.body);
    return reply.status(201).send(record);
  });

  server.put('/:id', {
    schema: {
      params: maintenanceParamsSchema,
      body: updateMaintenanceSchema,
    },
  }, async (request, reply) => {
    const { id } = request.params;
    const record = await maintenanceService.update(id, request.body);
    return record;
  });

  server.delete('/:id', {
    schema: { params: maintenanceParamsSchema },
  }, async (request, reply) => {
    const { id } = request.params;
    await maintenanceService.delete(id);
    return reply.status(204).send();
  });
}
