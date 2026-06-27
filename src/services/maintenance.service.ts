import { prisma } from '../lib/prisma.js';
import type { CreateMaintenanceInput, UpdateMaintenanceInput } from '../schemas/maintenance.schema.js';

export class MaintenanceService {
  async getAll(filters: { status?: string; assetId?: string; search?: string; page?: number; limit?: number }) {
    const { status, assetId, search, page = 1, limit = 50 } = filters;
    
    const where: any = {};
    if (status !== undefined) where.status = status;
    if (assetId !== undefined) where.assetId = assetId;

    if (search) {
      where.OR = [
        { asset: { name: { contains: search } } },
        { asset: { propertyNo: { contains: search } } },
        { description: { contains: search } }
      ];
    }

    const skip = (page - 1) * limit;

    const [total, data] = await Promise.all([
      prisma.maintenanceRecord.count({ where }),
      prisma.maintenanceRecord.findMany({
        where,
        include: {
          asset: {
            select: {
              name: true,
              propertyNo: true,
            }
          }
        },
        orderBy: { scheduledDate: 'asc' },
        skip,
        take: limit,
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

  async getById(id: string) {
    return prisma.maintenanceRecord.findUnique({
      where: { id },
      include: {
        asset: true
      }
    });
  }

  async create(data: CreateMaintenanceInput) {
    return prisma.maintenanceRecord.create({
      data: {
        assetId: data.assetId,
        type: data.type,
        status: data.status,
        description: data.description,
        scheduledDate: new Date(data.scheduledDate),
        completedDate: data.completedDate ? new Date(data.completedDate) : null,
        cost: data.cost ?? null,
        performedBy: data.performedBy ?? null,
      },
    });
  }

  async update(id: string, data: UpdateMaintenanceInput) {
    const updateData: any = { ...data };
    if (data.scheduledDate) updateData.scheduledDate = new Date(data.scheduledDate);
    if (data.completedDate) updateData.completedDate = new Date(data.completedDate);
    else if (data.status === 'Completed' && !updateData.completedDate) {
      updateData.completedDate = new Date();
    }

    return prisma.maintenanceRecord.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    return prisma.maintenanceRecord.delete({
      where: { id },
    });
  }
}
