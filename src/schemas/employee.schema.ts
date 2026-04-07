import { z } from 'zod';

export const createEmployeeSchema = z.object({
    employeeNo: z.string().min(1, "Employee Number is required"),
    firstName: z.string().min(1, "First Name is required"),
    lastName: z.string().min(1, "Last Name is required"),
    position: z.string().min(1, "Position is required"),
    departmentId: z.string().uuid("Invalid Department ID format")
});

export const employeeParamsSchema = z.object({
    id: z.string().uuid()
});