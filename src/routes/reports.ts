//  src/routes/reports.ts
import { type FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

// Schema shared by PAR and ICS
const reportQuerySchema = z.object({
    assetId: z.string().optional(),
    employeeId: z.string().optional()
}).refine(data => data.assetId || data.employeeId, {
    message: "You must provide either an assetId or an employeeId to generate this report."
});

// Schema specifically for PTR
const ptrQuerySchema = z.object({
    historyId: z.string().min(1, { message: "Asset History ID is required to generate a Transfer Report" })
});

// Define expected JSON structure for our changes array
interface HistoryChange {
    field: string;
    from: string;
    to: string;
    fromId?: string | null;
    toId?: string | null;
}

export async function reportRoutes(fastify: FastifyInstance) {

    // ============================================================================
    // 1. PAR ENDPOINT (Capitalized PPE >= ₱50,000)
    // ============================================================================
    fastify.get('/par', async (request, reply) => {
        try {
            const query = reportQuerySchema.parse(request.query);

            // Extract the GSO Officer generating the report
            const currentUserStr = (request.user as any)?.employeeId;
            const gsoOfficer = await prisma.employee.findUnique({
                where: { id: currentUserStr }
            });

            if (!gsoOfficer) {
                return reply.status(401).send({ message: "Unauthorized: Issuer details not found." });
            }

            let accountableEmployee: any = null;
            let targetAssets: any[] = [];

            // SCENARIO A: SINGLE ASSET
            if (query.assetId) {
                const asset = await prisma.asset.findUnique({
                    where: { id: query.assetId },
                    include: { employee: { include: { department: true } } }
                });

                if (!asset || !asset.employee) {
                    return reply.status(404).send({ message: "Asset not found or not assigned to an employee." });
                }

                if (asset.cost < 50000) {
                    return reply.status(400).send({ message: "Asset cost is below ₱50,000. Please generate an ICS instead." });
                }

                accountableEmployee = asset.employee;
                targetAssets = [asset];
            }
            // SCENARIO B: MASTER EMPLOYEE LIST
            else if (query.employeeId) {
                accountableEmployee = await prisma.employee.findUnique({
                    where: { id: query.employeeId },
                    include: { department: true }
                });

                if (!accountableEmployee) {
                    return reply.status(404).send({ message: "Employee not found." });
                }

                targetAssets = await prisma.asset.findMany({
                    where: {
                        employeeId: query.employeeId,
                        cost: { gte: 50000 }, // ONLY >= 50k
                        status: { not: 'Archived' }
                    }
                });

                if (targetAssets.length === 0) {
                    return reply.status(404).send({ message: "This employee has no high-value assets requiring a PAR." });
                }
            }

            const currentDate = new Date();
            const formattedDate = new Intl.DateTimeFormat('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }).format(currentDate);
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            const parNo = `PAR-${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${randomSuffix}`;

            const parData = {
                parNo: parNo,
                entityName: "Municipality of Calaca",
                fundCluster: "01 - Regular Agency Fund",

                issuedBy: {
                    name: `${gsoOfficer.firstName} ${gsoOfficer.lastName}`,
                    designation: gsoOfficer.position || "General Services Officer",
                    date: formattedDate
                },

                receivedBy: {
                    name: `${accountableEmployee.firstName} ${accountableEmployee.lastName}`,
                    designation: accountableEmployee.position || "Employee",
                    date: formattedDate
                },

                items: targetAssets.map(asset => ({
                    qty: 1,
                    unit: 'unit',
                    description: `${asset.brand} ${asset.model} ${asset.name} (SN: ${asset.serialNo})`,
                    propertyNo: asset.propertyNo,
                    dateAcquired: new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(asset.dateAcquired)),
                    amount: Number(asset.cost)
                }))
            };

            return reply.send(parData);

        } catch (error) {
            console.error("PAR Generation Error:", error);
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ message: error.issues?.[0]?.message || "Validation error" });
            }
            return reply.status(500).send({ message: "Internal server error generating PAR." });
        }
    });

    // ============================================================================
    // 2. ICS ENDPOINT (Semi-Expendable Property < ₱50,000)
    // ============================================================================
    fastify.get('/ics', async (request, reply) => {
        try {
            const query = reportQuerySchema.parse(request.query);

            const currentUserStr = (request.user as any)?.employeeId;
            const gsoOfficer = await prisma.employee.findUnique({
                where: { id: currentUserStr }
            });

            if (!gsoOfficer) {
                return reply.status(401).send({ message: "Unauthorized: Issuer details not found." });
            }

            let accountableEmployee: any = null;
            let targetAssets: any[] = [];

            // SCENARIO A: SINGLE ASSET
            if (query.assetId) {
                const asset = await prisma.asset.findUnique({
                    where: { id: query.assetId },
                    include: { employee: { include: { department: true } } }
                });

                if (!asset || !asset.employee) {
                    return reply.status(404).send({ message: "Asset not found or not assigned to an employee." });
                }

                // Ensure it meets COA threshold for ICS (< 50,000)
                if (asset.cost >= 50000) {
                    return reply.status(400).send({ message: "Asset cost is ₱50,000 or above. Please generate a PAR instead." });
                }

                accountableEmployee = asset.employee;
                targetAssets = [asset];
            }
            // SCENARIO B: MASTER EMPLOYEE LIST
            else if (query.employeeId) {
                accountableEmployee = await prisma.employee.findUnique({
                    where: { id: query.employeeId },
                    include: { department: true }
                });

                if (!accountableEmployee) {
                    return reply.status(404).send({ message: "Employee not found." });
                }

                // Fetch ALL active, low-value assets for this specific employee
                targetAssets = await prisma.asset.findMany({
                    where: {
                        employeeId: query.employeeId,
                        cost: { lt: 50000 }, // ONLY < 50k
                        status: { not: 'Archived' }
                    }
                });

                if (targetAssets.length === 0) {
                    return reply.status(404).send({ message: "This employee has no semi-expendable assets requiring an ICS." });
                }
            }

            const currentDate = new Date();
            const formattedDate = new Intl.DateTimeFormat('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }).format(currentDate);

            // Pseudo-generate an ICS No. (e.g., ICS-2026-04-0892)
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            const icsNo = `ICS-${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${randomSuffix}`;

            // Construct the final JSON matching the ICSReact Component's exact structure
            const icsData = {
                icsNo: icsNo,
                entityName: "Municipality of Calaca",
                fundCluster: "01 - Regular Agency Fund",

                issuedBy: {
                    name: `${gsoOfficer.firstName} ${gsoOfficer.lastName}`,
                    designation: gsoOfficer.position || "General Services Officer",
                    date: formattedDate
                },

                receivedBy: {
                    name: `${accountableEmployee.firstName} ${accountableEmployee.lastName}`,
                    designation: accountableEmployee.position || "Employee",
                    date: formattedDate
                },

                // ICS requires slightly different fields (unitCost, totalCost, usefulLife)
                items: targetAssets.map(asset => ({
                    qty: 1,
                    unit: 'unit',
                    unitCost: Number(asset.cost),
                    totalCost: Number(asset.cost), // qty * unitCost
                    description: `${asset.brand} ${asset.model} ${asset.name} (SN: ${asset.serialNo})`,
                    inventoryItemNo: asset.propertyNo,
                    usefulLife: asset.usefulLife ? `${asset.usefulLife} years` : '5 years'
                }))
            };

            return reply.send(icsData);

        } catch (error) {
            console.error("ICS Generation Error:", error);
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ message: error.issues?.[0]?.message || "Validation error" });
            }
            return reply.status(500).send({ message: "Internal server error generating ICS." });
        }
    });

    // ============================================================================
    // 3. PTR ENDPOINT (Property Transfer Report - Sourced from JSON Diff Engine)
    // ============================================================================
    fastify.get('/ptr', async (request, reply) => {
        try {
            const query = ptrQuerySchema.parse(request.query);

            // Extract the GSO Officer generating the report
            const currentUserStr = (request.user as any)?.employeeId;
            const gsoOfficer = await prisma.employee.findUnique({
                where: { id: currentUserStr }
            });

            if (!gsoOfficer) {
                return reply.status(401).send({ message: "Unauthorized: Issuer details not found." });
            }
            console.log("Generating PTR for History ID:", query.historyId);
            // 1. Fetch the immutable History Record and the Asset
            const historyRecord = await prisma.assetHistory.findUnique({
                where: { id: query.historyId },
                include: { asset: true }
            });

            if (!historyRecord || !historyRecord.asset) {
                return reply.status(404).send({ message: "Transfer history record not found." });
            }

            // 2. Parse the flexible JSON payload
            const changes = historyRecord.changes as HistoryChange[] | null;

            // Find the specific change that triggered this transfer
            const officerChange = changes?.find(c => c.field === "Accountable Officer");

            if (!officerChange) {
                return reply.status(400).send({
                    message: "Invalid Report: This history record does not contain an employee transfer event."
                });
            }

            // 3. Fetch exact Employee records using the UUIDs saved by our Diff Engine
            let relinquishingEmployee = null;
            if (officerChange.fromId) {
                relinquishingEmployee = await prisma.employee.findUnique({
                    where: { id: officerChange.fromId },
                    include: { department: true }
                });
            }

            let receivingEmployee = null;
            if (officerChange.toId) {
                receivingEmployee = await prisma.employee.findUnique({
                    where: { id: officerChange.toId },
                    include: { department: true }
                });
            }

            // 4. Formatting Utilities
            const transferDate = new Date(historyRecord.date);
            const formattedDate = new Intl.DateTimeFormat('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }).format(transferDate);
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            const ptrNo = `PTR-${transferDate.getFullYear()}-${String(transferDate.getMonth() + 1).padStart(2, '0')}-${randomSuffix}`;

            // 5. Construct the JSON matching the COA PTR Layout
            const ptrData = {
                ptrNo: ptrNo,
                entityName: "Municipality of Calaca",
                fundCluster: "01 - Regular Agency Fund",
                date: formattedDate,
                transferType: "Relocation/Reassignment",
                reasonForTransfer: historyRecord.description || "Reassignment of accountability",

                // The Relinquishing Officer (Sender)
                // We prioritize the live DB data, but fall back to the text saved in JSON if they were deleted
                source: {
                    name: relinquishingEmployee
                        ? `${relinquishingEmployee.firstName} ${relinquishingEmployee.lastName}`
                        : (officerChange.from || "Unassigned"),
                    designation: relinquishingEmployee?.position || "Relinquishing Officer",
                    department: relinquishingEmployee?.department?.name || "LGU"
                },

                // The Receiving Officer (Receiver)
                destination: {
                    name: receivingEmployee
                        ? `${receivingEmployee.firstName} ${receivingEmployee.lastName}`
                        : (officerChange.to || "Unassigned"),
                    designation: receivingEmployee?.position || "Receiving Officer",
                    department: receivingEmployee?.department?.name || "LGU"
                },

                // Who approved the transfer?
                approvedBy: {
                    name: `${gsoOfficer.firstName} ${gsoOfficer.lastName}`,
                    designation: gsoOfficer.position || "General Services Officer",
                },

                // The item being transferred
                items: [{
                    dateAcquired: new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(historyRecord.asset.dateAcquired)),
                    propertyNo: historyRecord.asset.propertyNo,
                    description: `${historyRecord.asset.brand} ${historyRecord.asset.model} ${historyRecord.asset.name} (SN: ${historyRecord.asset.serialNo})`,
                    amount: Number(historyRecord.asset.cost),
                    condition: historyRecord.asset.status || "Serviceable"
                }]
            };

            return reply.send(ptrData);

        } catch (error) {
            console.error("PTR Generation Error:", error);
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ message: error.issues?.[0]?.message || "Validation error" });
            }
            return reply.status(500).send({ message: "Internal server error generating PTR." });
        }
    });
}