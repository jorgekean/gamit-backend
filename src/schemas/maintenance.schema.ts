import { z } from 'zod';

export const createMaintenanceSchema = z.object({
  assetId: z.string().uuid(),
  type: z.string().min(1, 'Maintenance type is required'),
  status: z.enum(['Scheduled', 'In Progress', 'Completed', 'Cancelled']).default('Scheduled'),
  description: z.string().min(1, 'Description is required'),
  scheduledDate: z.string().datetime(),
  completedDate: z.string().datetime().optional(),
  cost: z.number().nonnegative().optional(),
  performedBy: z.string().optional(),
});

export const updateMaintenanceSchema = z.object({
  type: z.string().min(1).optional(),
  status: z.enum(['Scheduled', 'In Progress', 'Completed', 'Cancelled']).optional(),
  description: z.string().min(1).optional(),
  scheduledDate: z.string().datetime().optional(),
  completedDate: z.string().datetime().optional(),
  cost: z.number().nonnegative().optional(),
  performedBy: z.string().optional(),
});

export const maintenanceQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(50),
  search: z.string().optional(),
  status: z.string().optional(),
  assetId: z.string().uuid().optional(),
});

export const maintenanceParamsSchema = z.object({
  id: z.string().uuid(),
});

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;
export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceSchema>;
