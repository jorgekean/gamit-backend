import { prisma } from '../lib/prisma.js';
import { z } from 'zod';
import { createAssetCategorySchema, updateAssetCategorySchema } from '../schemas/asset-category.schema.js';

type CreateAssetCategoryInput = z.infer<typeof createAssetCategorySchema>;
type UpdateAssetCategoryInput = z.infer<typeof updateAssetCategorySchema>;

export class AssetCategoryService {

    static async getAll() {
        return prisma.assetCategory.findMany({
            where: { deletedAt: null },
            orderBy: { name: 'asc' }
        });
    }

    static async getById(id: string) {
        return prisma.assetCategory.findFirst({
            where: {
                id,
                deletedAt: null
            }
        });
    }

    static async create(data: CreateAssetCategoryInput) {
        const createData = {
            code: data.code,
            name: data.name,
            ...(data.description !== undefined ? { description: data.description } : {}),
            ...(data.useLifeYears !== undefined ? { useLifeYears: data.useLifeYears } : {})
        };

        return prisma.assetCategory.create({ data: createData });
    }

    static async update(id: string, data: UpdateAssetCategoryInput) {
        const updateData = {
            ...(data.code !== undefined ? { code: data.code } : {}),
            ...(data.name !== undefined ? { name: data.name } : {}),
            ...(data.description !== undefined ? { description: data.description } : {}),
            ...(data.useLifeYears !== undefined ? { useLifeYears: data.useLifeYears } : {})
        };

        return prisma.assetCategory.update({
            where: { id },
            data: updateData
        });
    }

    static async softDelete(id: string) {
        return prisma.assetCategory.update({
            where: { id },
            data: { deletedAt: new Date() }
        });
    }
}
