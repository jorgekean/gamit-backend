import { type FastifyInstance } from 'fastify';
import { type ZodTypeProvider } from 'fastify-type-provider-zod';
import { AssetCategoryService } from '../services/asset-category.service.js';
import {
    assetCategoryParamsSchema,
    createAssetCategorySchema,
    updateAssetCategorySchema
} from '../schemas/asset-category.schema.js';

export async function assetCategoryRoutes(fastify: FastifyInstance) {
    const server = fastify.withTypeProvider<ZodTypeProvider>();

    server.get('/', async (request, reply) => {
        const categories = await AssetCategoryService.getAll();
        return reply.send({ success: true, data: categories });
    });

    server.get(
        '/:id',
        { schema: { params: assetCategoryParamsSchema } },
        async (request, reply) => {
            const category = await AssetCategoryService.getById(request.params.id);

            if (!category) {
                return reply.code(404).send({
                    success: false,
                    message: 'Asset category not found or has been archived'
                });
            }

            return reply.send({ success: true, data: category });
        }
    );

    server.post('/', { schema: { body: createAssetCategorySchema } }, async (request, reply) => {
        const newCategory = await AssetCategoryService.create(request.body);
        return reply.code(201).send({ success: true, data: newCategory });
    });

    server.put(
        '/:id',
        {
            schema: {
                params: assetCategoryParamsSchema,
                body: updateAssetCategorySchema
            }
        },
        async (request, reply) => {
            const existing = await AssetCategoryService.getById(request.params.id);

            if (!existing) {
                return reply.code(404).send({
                    success: false,
                    message: 'Asset category not found or has been archived'
                });
            }

            const updatedCategory = await AssetCategoryService.update(request.params.id, request.body);
            return reply.send({ success: true, data: updatedCategory });
        }
    );

    server.delete('/:id', { schema: { params: assetCategoryParamsSchema } }, async (request, reply) => {
        const existing = await AssetCategoryService.getById(request.params.id);

        if (!existing) {
            return reply.code(404).send({
                success: false,
                message: 'Asset category not found or has been archived'
            });
        }

        await AssetCategoryService.softDelete(request.params.id);
        return reply.send({ success: true, message: 'Asset category archived' });
    });
}
