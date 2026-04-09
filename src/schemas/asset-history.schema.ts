import { z } from 'zod';

export const assetHistoryParamsSchema = z.object({
    id: z.string().uuid()
});

export const assetHistoryByAssetParamsSchema = z.object({
    assetId: z.string().uuid()
});

export const assetHistoryQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(50),
    assetId: z.string().uuid().optional(),
    action: z.string().optional(),
    performedBy: z.string().optional()
});

export const createAssetHistorySchema = z.object({
    assetId: z.string().uuid('Invalid Asset ID'),
    date: z.coerce.date().optional(),
    action: z.string().min(1, 'Action is required'),
    description: z.string().min(1, 'Description is required'),
    changes: z.unknown().optional().nullable()
});
