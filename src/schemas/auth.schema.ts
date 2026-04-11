import { z } from 'zod';

export const registerSchema = z.object({
    employeeId: z.string().min(1, "Employee ID is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(['ADMIN', 'GSO', 'USER']).default('USER')
});

export const loginSchema = z.object({
    employeeId: z.string().min(1, "Employee ID is required"),
    password: z.string().min(1, "Password is required")
});