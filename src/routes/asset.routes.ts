import { type FastifyInstance } from 'fastify';
import { type ZodTypeProvider } from 'fastify-type-provider-zod';
import { AssetService } from '../services/asset.service.js';
import { assetParamsSchema, createAssetSchema, updateAssetSchema, assetQuerySchema } from '../schemas/asset.schema.js';

export async function assetRoutes(fastify: FastifyInstance) {
    const server = fastify.withTypeProvider<ZodTypeProvider>();

    server.get(
        '/',
        { schema: { querystring: assetQuerySchema } },
        async (request, reply) => {
            // request.query is fully typed and validated by Zod
            const result = await AssetService.getAll(request.query);
            return reply.send({ success: true, ...result });
        }
    );

    server.get(
        '/:id',
        { schema: { params: assetParamsSchema } },
        async (request, reply) => {
            const asset = await AssetService.getById(request.params.id);

            if (!asset) {
                return reply.code(404).send({
                    success: false,
                    message: 'Asset not found or has been archived'
                });
            }

            return reply.send({ success: true, data: asset });
        }
    );

    server.post('/', { schema: { body: createAssetSchema } }, async (request, reply) => {
        const newAsset = await AssetService.create(request.body);
        return reply.code(201).send({ success: true, data: newAsset });
    });

    server.put(
        '/:id',
        { schema: { params: assetParamsSchema, body: updateAssetSchema } },
        async (request, reply) => {
            const existing = await AssetService.getById(request.params.id);

            if (!existing) {
                return reply.code(404).send({
                    success: false,
                    message: 'Asset not found or has been archived'
                });
            }

            const updated = await AssetService.update(request.params.id, request.body);
            return reply.send({ success: true, data: updated });
        }
    );

    server.delete('/:id', { schema: { params: assetParamsSchema } }, async (request, reply) => {
        const existing = await AssetService.getById(request.params.id);

        if (!existing) {
            return reply.code(404).send({
                success: false,
                message: 'Asset not found or has been archived'
            });
        }

        await AssetService.softDelete(request.params.id);
        return reply.send({ success: true, message: 'Asset archived' });
    });
}
