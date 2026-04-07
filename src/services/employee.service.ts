// src/services/employee.service.ts
import { prisma } from '../lib/prisma.js';
import { z } from 'zod';
import { createEmployeeSchema } from '../schemas/employee.schema.js';

// ✨ THE FIX: Infer the exact TypeScript type directly from your Zod validation schema!
type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

export class EmployeeService {

    static async getAll() {
        return prisma.employee.findMany({
            where: { deletedAt: null },
            include: { department: true }
        });
    }

    // Get a single employee by ID
    static async getById(id: string) {
        return prisma.employee.findUnique({
            where: {
                id: id
            },
            include: {
                department: true // Automatically join the department name for the UI
            }
        });
    }

    static async create(data: CreateEmployeeInput) {
        return prisma.employee.create({ data });
    }

    static async softDelete(id: string) {
        return prisma.employee.update({
            where: { id },
            data: { deletedAt: new Date() }
        });
    }
}