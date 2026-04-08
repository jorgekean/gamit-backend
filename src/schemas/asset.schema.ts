import { z } from 'zod';

export const createAssetSchema = z.object({
    propertyNo: z.string().min(1, 'Property number is required'),
    name: z.string().min(1, 'Asset name is required'),
    brand: z.string().optional(),
    model: z.string().optional(),
    serialNo: z.string().optional(),
    cost: z.number().positive('Cost must be a positive number'),
    dateAcquired: z.coerce.date(),
    usefulLife: z.number().int().min(1).optional(),
    status: z.string().optional(),
    categoryId: z.string().uuid('Invalid Category ID'),
    departmentId: z.string().uuid('Invalid Department ID').optional().nullable(),
    employeeId: z.string().uuid('Invalid Employee ID').optional().nullable()
});

export const updateAssetSchema = createAssetSchema
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: 'At least one field is required for update'
    });

export const assetParamsSchema = z.object({
    id: z.string().uuid()
});
