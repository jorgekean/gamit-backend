import { z } from 'zod';

export const createAssetCategorySchema = z.object({
    code: z.string().min(1, 'Asset category code is required'),
    name: z.string().min(1, 'Asset category name is required'),
    description: z.string().optional(),
    useLifeYears: z.number().int().min(1, 'Useful life must be at least 1 year').optional()
});

export const updateAssetCategorySchema = createAssetCategorySchema
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: 'At least one field is required for update'
    });

export const assetCategoryParamsSchema = z.object({
    id: z.string().uuid()
});
