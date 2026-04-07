import { prisma } from '../lib/prisma.js';
import { z } from 'zod';
import { createDepartmentSchema } from '../schemas/department.schema.js';

type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;

export class DepartmentService {

    static async getAll() {
        return prisma.department.findMany({
            where: { deletedAt: null }
        });
    }

    static async getById(id: string) {
        return prisma.department.findUnique({
            where: { id }
        });
    }

    static async create(data: CreateDepartmentInput) {
        return prisma.department.create({ data });
    }

    static async softDelete(id: string) {
        return prisma.department.update({
            where: { id },
            data: { deletedAt: new Date() }
        });
    }
}
