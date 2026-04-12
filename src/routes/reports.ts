// src/routes/reports.ts
import { type FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

// Define the query schema to accept EITHER assetId OR employeeId
const parQuerySchema = z.object({
    assetId: z.string().optional(),
    employeeId: z.string().optional()
}).refine(data => data.assetId || data.employeeId, {
    message: "You must provide either an assetId or an employeeId to generate a PAR."
});

export async function reportRoutes(fastify: FastifyInstance) {

    // Ensure this route is protected by your JWT authentication middleware
    fastify.get('/par', async (request, reply) => {
        try {
            // 1. Validate Query Parameters
            const query = parQuerySchema.parse(request.query);
            console.log("Asset fetched for PAR generation:", request.user);
            // 2. Extract the GSO Officer (The person currently logged in generating the report)
            // Assuming your JWT middleware attaches the user to request.user
            const currentUserStr = (request.user as any)?.employeeId; // This should be the internal DB UUID of the employee
            const gsoOfficer = await prisma.employee.findUnique({
                where: { id: currentUserStr }
            });
            console.log("Asset fetched for PAR generation:", currentUserStr, gsoOfficer);
            if (!gsoOfficer) {
                return reply.status(401).send({ message: "Unauthorized: Issuer details not found." });
            }

            // 3. Initialize Variables for Data Mapping
            let accountableEmployee: any = null;
            let targetAssets: any[] = [];

            // ---------------------------------------------------------
            // SCENARIO A: Generating PAR for a SINGLE ASSET
            // ---------------------------------------------------------
            if (query.assetId) {
                const asset = await prisma.asset.findUnique({
                    where: { id: query.assetId },
                    include: {
                        employee: { include: { department: true } }
                    }
                });

                if (!asset || !asset.employee) {
                    return reply.status(404).send({ message: "Asset not found or not assigned to an employee." });
                }

                // Ensure it meets COA threshold for PAR (>= 50,000)
                if (asset.cost < 50000) {
                    return reply.status(400).send({ message: "Asset cost is below ₱50,000. Please generate an ICS instead." });
                }

                accountableEmployee = asset.employee;
                targetAssets = [asset];
            }
            // ---------------------------------------------------------
            // SCENARIO B: Generating Master PAR for an EMPLOYEE
            // ---------------------------------------------------------
            else if (query.employeeId) {
                accountableEmployee = await prisma.employee.findUnique({
                    where: { id: query.employeeId },
                    include: { department: true }
                });

                if (!accountableEmployee) {
                    return reply.status(404).send({ message: "Employee not found." });
                }

                // Fetch ALL active, high-value assets for this specific employee
                targetAssets = await prisma.asset.findMany({
                    where: {
                        employeeId: query.employeeId,
                        cost: { gte: 50000 }, // ONLY fetch Capitalized PPE for PAR
                        status: { not: 'Archived' } // Ignore deleted/archived items
                    }
                });

                if (targetAssets.length === 0) {
                    return reply.status(404).send({ message: "This employee has no high-value assets requiring a PAR." });
                }
            }

            // 4. Formatting Utilities
            const currentDate = new Date();
            const formattedDate = new Intl.DateTimeFormat('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }).format(currentDate);

            // Pseudo-generate a PAR No. (e.g., PAR-2026-04-0892)
            // FUTURE: Replace Math.random with a proper DB sequence counter
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            const parNo = `PAR-${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${randomSuffix}`;

            // 5. Construct the final JSON matching the React Component's exact structure
            const parData = {
                parNo: parNo,
                entityName: "Municipality of Calaca", // This could also come from a global config DB table
                fundCluster: "01 - Regular Agency Fund", // FUTURE: Pull this from Asset table

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
                    unit: 'unit', // FUTURE: Pull from Asset table if added
                    description: `${asset.brand} ${asset.model} ${asset.name} (SN: ${asset.serialNo})`,
                    propertyNo: asset.propertyNo,
                    // Format the DB date to a readable string
                    dateAcquired: new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(asset.dateAcquired)),
                    amount: Number(asset.cost)
                }))
            };

            // 6. Return the perfectly structured data
            return reply.send(parData);

        } catch (error) {
            console.error("PAR Generation Error:", error);
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ message: error.issues?.[0]?.message || "Validation error" });
            }
            return reply.status(500).send({ message: "Internal server error generating PAR." });
        }
    });
}