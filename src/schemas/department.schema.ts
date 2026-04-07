import { z } from 'zod';

export const createDepartmentSchema = z.object({
    code: z.string().min(1, "Department code is required"),
    name: z.string().min(1, "Department name is required")
});

export const departmentParamsSchema = z.object({
    id: z.string().uuid()
});
