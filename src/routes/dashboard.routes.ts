import { type FastifyInstance } from 'fastify';
import { DashboardService } from '../services/dashboard.service.js';

export async function dashboardRoutes(fastify: FastifyInstance) {
    fastify.get('/overview', async (request, reply) => {
        const overview = await DashboardService.getOverview();
        return reply.send({ success: true, data: overview });
    });
}
