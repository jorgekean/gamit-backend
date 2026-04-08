import { prisma } from '../lib/prisma.js';
import { z } from 'zod';
import { createAssetSchema, updateAssetSchema } from '../schemas/asset.schema.js';

type CreateAssetInput = z.infer<typeof createAssetSchema>;
type UpdateAssetInput = z.infer<typeof updateAssetSchema>;

const assetIncludes = {
    category: true,
    department: true,
    employee: true
};

export class AssetService {

    static async getAll() {
        return prisma.asset.findMany({
            where: { deletedAt: null },
            include: assetIncludes,
            orderBy: { createdAt: 'desc' }
        });
    }

    static async getById(id: string) {
        return prisma.asset.findFirst({
            where: { id, deletedAt: null },
            include: assetIncludes
        });
    }

    static async create(data: CreateAssetInput) {
        const createData = {
            propertyNo: data.propertyNo,
            name: data.name,
            cost: data.cost,
            dateAcquired: data.dateAcquired,
            categoryId: data.categoryId,
            ...(data.brand !== undefined ? { brand: data.brand } : {}),
            ...(data.model !== undefined ? { model: data.model } : {}),
            ...(data.serialNo !== undefined ? { serialNo: data.serialNo } : {}),
            ...(data.usefulLife !== undefined ? { usefulLife: data.usefulLife } : {}),
            ...(data.status !== undefined ? { status: data.status } : {}),
            ...(data.departmentId !== undefined ? { departmentId: data.departmentId } : {}),
            ...(data.employeeId !== undefined ? { employeeId: data.employeeId } : {})
        };

        return prisma.asset.create({ data: createData });
    }

    static async update(id: string, data: UpdateAssetInput) {
        const updateData = {
            ...(data.propertyNo !== undefined ? { propertyNo: data.propertyNo } : {}),
            ...(data.name !== undefined ? { name: data.name } : {}),
            ...(data.brand !== undefined ? { brand: data.brand } : {}),
            ...(data.model !== undefined ? { model: data.model } : {}),
            ...(data.serialNo !== undefined ? { serialNo: data.serialNo } : {}),
            ...(data.cost !== undefined ? { cost: data.cost } : {}),
            ...(data.dateAcquired !== undefined ? { dateAcquired: data.dateAcquired } : {}),
            ...(data.usefulLife !== undefined ? { usefulLife: data.usefulLife } : {}),
            ...(data.status !== undefined ? { status: data.status } : {}),
            ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
            ...(data.departmentId !== undefined ? { departmentId: data.departmentId } : {}),
            ...(data.employeeId !== undefined ? { employeeId: data.employeeId } : {})
        };

        return prisma.asset.update({ where: { id }, data: updateData });
    }

    static async softDelete(id: string) {
        return prisma.asset.update({
            where: { id },
            data: { deletedAt: new Date() }
        });
    }
}
