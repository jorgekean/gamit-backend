import { prisma } from '../lib/prisma.js';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { createAssetSchema, updateAssetSchema, assetQuerySchema } from '../schemas/asset.schema.js';

type CreateAssetInput = z.infer<typeof createAssetSchema>;
type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
type AssetQueryParams = z.infer<typeof assetQuerySchema>;

const assetIncludes = {
    category: true,
    department: true,
    employee: true
};

export class AssetService {

    static async getAll(params: AssetQueryParams) {
        const { page, limit, search, status, departmentId, categoryId, employeeId } = params;
        const skip = (page - 1) * limit;

        // 1. Build a dynamic WHERE clause
        const where: Prisma.AssetWhereInput = {
            deletedAt: null,
            ...(status && { status }),
            ...(departmentId && { departmentId }),
            ...(categoryId && { categoryId }),
            ...(employeeId && { employeeId }),
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { propertyNo: { contains: search, mode: 'insensitive' } },
                    { serialNo: { contains: search, mode: 'insensitive' } }
                ]
            })
        };

        // 2. Execute Count and Fetch in parallel for maximum performance
        const [total, data] = await Promise.all([
            prisma.asset.count({ where }),
            prisma.asset.findMany({
                where,
                include: assetIncludes,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            })
        ]);

        // 3. Return the data along with pagination metadata
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

        return prisma.asset.update({
            where: { id },
            data: updateData
        });
    }

    static async softDelete(id: string) {
        return prisma.asset.update({
            where: { id },
            data: { deletedAt: new Date() }
        });
    }
}