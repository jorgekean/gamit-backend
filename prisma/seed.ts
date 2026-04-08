// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import * as argon2 from 'argon2';

// 1. Load the environment variables
dotenv.config();

// 2. Set up the exact same connection pool we use in the main app
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// 3. Initialize Prisma WITH the adapter
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Starting database seed...');

    // 1. Seed Departments
    const defaultDepartments = [
        { code: 'GSO', name: 'General Services Office' },
        { code: 'MAYOR', name: 'Office of the Mayor' },
        { code: 'ENG', name: 'Municipal Engineering Office' },
        { code: 'IT', name: 'Information Technology Division' }
    ];

    for (const dept of defaultDepartments) {
        await prisma.department.upsert({
            where: { code: dept.code },
            update: {},
            create: { code: dept.code, name: dept.name }
        });
    }
    console.log(`✅ Seeded ${defaultDepartments.length} Departments.`);

    // 2. Seed COA Standard Asset Categories
    const defaultCategories = [
        { code: '1-07-05-010', name: 'Machinery', useLifeYears: 10 },
        { code: '1-07-05-020', name: 'Office Equipment', useLifeYears: 5 },
        { code: '1-07-05-030', name: 'Information and Communication Technology (ICT) Equipment', useLifeYears: 5 },
        { code: '1-07-05-070', name: 'Communications Equipment', useLifeYears: 5 },
        { code: '1-07-05-110', name: 'Medical Equipment', useLifeYears: 10 },
        { code: '1-07-05-130', name: 'Sports Equipment', useLifeYears: 5 },
        { code: '1-07-05-140', name: 'Technical and Scientific Equipment', useLifeYears: 10 },
        { code: '1-07-06-010', name: 'Motor Vehicles', useLifeYears: 7 },
        { code: '1-07-07-010', name: 'Furniture and Fixtures', useLifeYears: 10 },
        { code: '1-07-99-000', name: 'Other Property, Plant and Equipment', useLifeYears: 5 }
    ];

    for (const cat of defaultCategories) {
        await prisma.assetCategory.upsert({
            where: { code: cat.code },
            update: {
                name: cat.name,
                useLifeYears: cat.useLifeYears
            }, // Ensure names/years update if they change in the future
            create: { code: cat.code, name: cat.name, useLifeYears: cat.useLifeYears }
        });
    }
    console.log(`✅ Seeded ${defaultCategories.length} COA Asset Categories.`);

    // 3. Seed Default Admin User
    const adminEmail = 'admin@calaca.gov.ph';
    const adminPassword = await argon2.hash('GamitAdmin2026!');

    await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            name: 'System Administrator',
            password: adminPassword,
            role: 'ADMIN'
        }
    });
    console.log(`✅ Seeded default Admin user (${adminEmail}).`);

    console.log('🏁 Seeding finished successfully.');
}

// Execute the main function
main()
    .catch((e) => {
        console.error('❌ Seeding failed:');
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });