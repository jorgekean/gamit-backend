// src/services/auth.service.ts
import { prisma } from '../lib/prisma.js';
import * as argon2 from 'argon2';
import { z } from 'zod';
import { registerSchema } from '../schemas/auth.schema.js';

type RegisterInput = z.infer<typeof registerSchema>;

export class AuthService {

    static async registerUser(data: RegisterInput) {
        // 1. VALIDATION: The 'employeeId' from the frontend is actually the human-readable 'employeeNo' (e.g., EMP-2026-001).
        // Search the Employee table using the employeeNo field.
        const employeeRecord = await prisma.employee.findUnique({
            where: { employeeNo: data.employeeId }
        });

        if (!employeeRecord) {
            throw new Error("Registration Failed: Employee Number not found in the HR database.");
        }

        // 2. Check if this employee already has an active user account
        // CRITICAL: We use the internal DB UUID (employeeRecord.id) for this relational check.
        const existingUser = await prisma.user.findUnique({
            where: { employeeId: employeeRecord.id }
        });

        if (existingUser) {
            throw new Error("An account is already registered to this Employee Number.");
        }

        // 3. Hash the password using modern Argon2id algorithm
        const hashedPassword = await argon2.hash(data.password);

        // 4. Save to database using the internal relational UUID
        const user = await prisma.user.create({
            data: {
                employeeId: employeeRecord.id, // Links via internal UUID
                password: hashedPassword,
                role: data.role || 'USER'
            }
        });

        // 5. Return user WITHOUT the password
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    // The 'employeeId' parameter passed here from the login form is the human-readable 'employeeNo'
    static async verifyLogin(employeeId: string, plainPassword: string) {

        // 1. Find the user by querying through the relation. 
        // This looks for a User whose linked Employee has the matching 'employeeNo'.
        const user = await prisma.user.findFirst({
            where: {
                employee: {
                    employeeNo: employeeId
                }
            },
            include: { employee: true } // Fetches the joined Employee record
        });

        if (!user) return null;

        // 2. Verify the plain text password against the Argon2 hash
        const isValid = await argon2.verify(user.password, plainPassword);
        if (!isValid) return null;

        // 3. Strip the password and format the return object
        const { password, employee, ...userData } = user;

        return {
            ...userData,
            // Construct the full name dynamically from the HR record
            name: `${employee.firstName} ${employee.lastName}`
        };
    }
}