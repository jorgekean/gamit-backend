import { type FastifyInstance } from 'fastify';
import { type ZodTypeProvider } from 'fastify-type-provider-zod';
import { AssetHistoryService } from '../services/asset-history.service.js';
import {
    assetHistoryByAssetParamsSchema,
    createAssetHistorySchema,
    assetHistoryParamsSchema,
    assetHistoryQuerySchema
} from '../schemas/asset-history.schema.js';

const pageLimitQuerySchema = assetHistoryQuerySchema.pick({ page: true, limit: true });

type AuthenticatedUser = {
    id?: string;
    name?: string;
};

export async function assetHistoryRoutes(fastify: FastifyInstance) {
    const server = fastify.withTypeProvider<ZodTypeProvider>();

    server.post(
        '/',
        {
            preHandler: async (request) => {
                await request.jwtVerify();
            },
            schema: { body: createAssetHistorySchema }
        },
        async (request, reply) => {
            const user = request.user as AuthenticatedUser;
            const performedBy = user.name || user.id;

            if (!performedBy) {
                return reply.code(401).send({
                    success: false,
                    message: 'Unable to identify authenticated user'
                });
            }

            const history = await AssetHistoryService.create(request.body, performedBy);

            if (!history) {
                return reply.code(404).send({
                    success: false,
                    message: 'Asset not found or has been archived'
                });
            }

            return reply.code(201).send({ success: true, data: history });
        }
    );

    server.get(
        '/',
        { schema: { querystring: assetHistoryQuerySchema } },
        async (request, reply) => {
            const result = await AssetHistoryService.getAll(request.query);
            return reply.send({ success: true, ...result });
        }
    );

    server.get(
        '/:id',
        { schema: { params: assetHistoryParamsSchema } },
        async (request, reply) => {
            const history = await AssetHistoryService.getById(request.params.id);

            if (!history) {
                return reply.code(404).send({
                    success: false,
                    message: 'Asset history record not found'
                });
            }

            return reply.send({ success: true, data: history });
        }
    );

    server.get(
        '/asset/:assetId',
        {
            schema: {
                params: assetHistoryByAssetParamsSchema,
                querystring: pageLimitQuerySchema
            }
        },
        async (request, reply) => {
            const result = await AssetHistoryService.getByAssetId(request.params.assetId, request.query);
            return reply.send({ success: true, ...result });
        }
    );
}
