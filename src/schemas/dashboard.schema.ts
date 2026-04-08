import { z } from 'zod';

export const dashboardOverviewSchema = z.object({
    success: z.boolean(),
    data: z.object({
        kpis: z.object({
            totalAssets: z.number(),
            totalPortfolioValue: z.number(),
            actionRequiredCount: z.number(),
            unassignedCount: z.number()
        }),
        statusBreakdown: z.array(
            z.object({
                name: z.string(),
                value: z.number(),
                color: z.string()
            })
        ),
        departmentAllocation: z.array(
            z.object({
                name: z.string(),
                code: z.string(),
                count: z.number()
            })
        )
    })
});

export type DashboardOverview = z.infer<typeof dashboardOverviewSchema>;
