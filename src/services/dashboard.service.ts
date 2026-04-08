import { prisma } from '../lib/prisma.js';

const COLORS = {
    serviceable: '#10b981',
    repair: '#f59e0b',
    unserviceable: '#ef4444'
};

export class DashboardService {
    static async getOverview() {
        // --- EFFICIENT KPI CALCULATIONS (Database-level aggregations) ---

        // 1. Total count & portfolio value using aggregate
        const kpiData = await prisma.asset.aggregate({
            where: { deletedAt: null },
            _count: true,
            _sum: { cost: true }
        });

        // 2. Count assets with non-Serviceable status (action required)
        const actionRequiredCount = await prisma.asset.count({
            where: {
                deletedAt: null,
                status: { not: 'Serviceable' }
            }
        });

        // 3. Count unassigned assets (missing department OR employee)
        const unassignedCount = await prisma.asset.count({
            where: {
                deletedAt: null,
                OR: [
                    { departmentId: null },
                    { employeeId: null }
                ]
            }
        });

        // --- STATUS BREAKDOWN (Group by status) ---
        const statusCounts = await prisma.asset.groupBy({
            by: ['status'],
            where: { deletedAt: null },
            _count: true
        });

        const statusBreakdown = [
            { name: 'Serviceable', value: statusCounts.find(s => s.status === 'Serviceable')?._count ?? 0, color: COLORS.serviceable },
            { name: 'For Repair', value: statusCounts.find(s => s.status === 'For Repair')?._count ?? 0, color: COLORS.repair },
            { name: 'Unserviceable', value: statusCounts.find(s => s.status === 'Unserviceable')?._count ?? 0, color: COLORS.unserviceable }
        ].filter((d) => d.value > 0);

        // --- DEPARTMENT ALLOCATION (Top 5) ---
        const deptAllocation = await prisma.asset.groupBy({
            by: ['departmentId'],
            where: {
                deletedAt: null,
                departmentId: { not: null }
            },
            _count: { departmentId: true }
        });

        // Sort by count and take top 5
        const topDeptAllocations = deptAllocation
            .sort((a, b) => (b._count.departmentId || 0) - (a._count.departmentId || 0))
            .slice(0, 5);

        // Fetch department details for the top 5 (minimal query)
        const deptIds = topDeptAllocations.map(d => d.departmentId).filter(Boolean) as string[];
        const depts = await prisma.department.findMany({
            where: { id: { in: deptIds } },
            select: { id: true, name: true, code: true }
        });

        const departmentAllocation = topDeptAllocations.map((allocation) => {
            const dept = depts.find(d => d.id === allocation.departmentId);
            return {
                name: dept?.name ?? 'Unknown',
                code: dept?.code ?? 'N/A',
                count: allocation._count.departmentId ?? 0
            };
        });

        return {
            kpis: {
                totalAssets: kpiData._count,
                totalPortfolioValue: kpiData._sum.cost ?? 0,
                actionRequiredCount,
                unassignedCount
            },
            statusBreakdown,
            departmentAllocation
        };
    }
}
