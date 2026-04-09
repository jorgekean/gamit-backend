import { prisma } from '../lib/prisma.js';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { assetHistoryQuerySchema, createAssetHistorySchema } from '../schemas/asset-history.schema.js';

type AssetHistoryQueryParams = z.infer<typeof assetHistoryQuerySchema>;
type CreateAssetHistoryInput = z.infer<typeof createAssetHistorySchema>;

const assetHistoryInclude = {
    asset: {
        select: {
            id: true,
            propertyNo: true,
            name: true,
            status: true
        }
    }
} satisfies Prisma.AssetHistoryInclude;

export class AssetHistoryService {
    static async create(data: CreateAssetHistoryInput, performedBy: string) {
        const asset = await prisma.asset.findFirst({
            where: {
                id: data.assetId,
                deletedAt: null
            },
            select: { id: true }
        });

        if (!asset) {
            return null;
        }

        return prisma.assetHistory.create({
            data: {
                assetId: data.assetId,
                date: data.date ?? new Date(),
                action: data.action,
                performedBy,
                description: data.description,
                ...(data.changes !== undefined
                    ? {
                        changes:
                            data.changes === null
                                ? Prisma.JsonNull
                                : (data.changes as Prisma.InputJsonValue)
                    }
                    : {})
            },
            include: assetHistoryInclude
        });
    }

    static async getAll(params: AssetHistoryQueryParams) {
        const { page, limit, assetId, action, performedBy } = params;
        const skip = (page - 1) * limit;

        const where: Prisma.AssetHistoryWhereInput = {
            ...(assetId && { assetId }),
            ...(action && { action: { contains: action, mode: 'insensitive' } }),
            ...(performedBy && { performedBy: { contains: performedBy, mode: 'insensitive' } }),
            asset: {
                deletedAt: null
            }
        };

        const [total, data] = await Promise.all([
            prisma.assetHistory.count({ where }),
            prisma.assetHistory.findMany({
                where,
                include: assetHistoryInclude,
                orderBy: { date: 'desc' },
                skip,
                take: limit
            })
        ]);

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    static async getById(id: string) {
        return prisma.assetHistory.findFirst({
            where: {
                id,
                asset: {
                    deletedAt: null
                }
            },
            include: assetHistoryInclude
        });
    }

    static async getByAssetId(assetId: string, params: Pick<AssetHistoryQueryParams, 'page' | 'limit'>) {
        const { page, limit } = params;
        const skip = (page - 1) * limit;

        const where: Prisma.AssetHistoryWhereInput = {
            assetId,
            asset: {
                deletedAt: null
            }
        };

        const [total, data] = await Promise.all([
            prisma.assetHistory.count({ where }),
            prisma.assetHistory.findMany({
                where,
                include: assetHistoryInclude,
                orderBy: { date: 'desc' },
                skip,
                take: limit
            })
        ]);

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
}
