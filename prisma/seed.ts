// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import * as argon2 from 'argon2';

// 1. Load the environment variables
dotenv.config();

// 2. Set up connection pool with adapter
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Starting database seed...');

    // 1. Seed Departments
    const defaultDepartments = [
        { code: 'GSO', name: 'General Services Office' },
        { code: 'MAYOR', name: 'Office of the Mayor' },
        { code: 'ENG', name: 'Municipal Engineering Office' },
        { code: 'IT', name: 'Information Technology Division' },
        { code: 'BUDGET', name: 'Budget Office' },
        { code: 'HRMO', name: 'Human Resource Management Office' },
        { code: 'TREAS', name: 'Municipal Treasury Office' },
        { code: 'HEALTH', name: 'Rural Health Unit' }
    ];

    for (const dept of defaultDepartments) {
        await prisma.department.upsert({
            where: { code: dept.code },
            update: {},
            create: { code: dept.code, name: dept.name }
        });
    }
    console.log(`✅ Seeded ${defaultDepartments.length} Departments.`);

    // 1.1 Seed Employees and attach valid department IDs
    const departments = await prisma.department.findMany({
        where: { code: { in: defaultDepartments.map((d) => d.code) } },
        select: { id: true, code: true }
    });

    const departmentIdByCode = new Map(departments.map((d) => [d.code, d.id]));

    const defaultEmployees = [
        // Added Specific Accounts for Auth Testing
        { employeeNo: 'EMP-ADMIN-001', firstName: 'Jorge', lastName: 'Gamit', position: 'General Services Officer', departmentCode: 'GSO' },
        { employeeNo: 'EMP-ENG-002', firstName: 'Juan', lastName: 'Dela Cruz', position: 'Municipal Engineer', departmentCode: 'ENG' },
        // Standard Employee Pool
        { employeeNo: 'EMP-2026-001', firstName: 'Maria', lastName: 'Santos', position: 'Property Officer I', departmentCode: 'GSO' },
        { employeeNo: 'EMP-2026-002', firstName: 'Paolo', lastName: 'Dela Cruz', position: 'Supply Officer', departmentCode: 'GSO' },
        { employeeNo: 'EMP-2026-003', firstName: 'Liza', lastName: 'Reyes', position: 'Administrative Assistant', departmentCode: 'MAYOR' },
        { employeeNo: 'EMP-2026-004', firstName: 'Jerome', lastName: 'Castro', position: 'Executive Aide', departmentCode: 'MAYOR' },
        { employeeNo: 'EMP-2026-005', firstName: 'Carlo', lastName: 'Villanueva', position: 'Engineer II', departmentCode: 'ENG' },
        { employeeNo: 'EMP-2026-006', firstName: 'Rina', lastName: 'Fernandez', position: 'Draftsman', departmentCode: 'ENG' },
        { employeeNo: 'EMP-2026-007', firstName: 'Noel', lastName: 'Garcia', position: 'Systems Administrator', departmentCode: 'IT' },
        { employeeNo: 'EMP-2026-008', firstName: 'Camille', lastName: 'Torres', position: 'IT Officer I', departmentCode: 'IT' },
        { employeeNo: 'EMP-2026-009', firstName: 'Aileen', lastName: 'Mendoza', position: 'Budget Officer I', departmentCode: 'BUDGET' },
        { employeeNo: 'EMP-2026-010', firstName: 'Ralph', lastName: 'Bautista', position: 'Budget Analyst', departmentCode: 'BUDGET' },
        { employeeNo: 'EMP-2026-011', firstName: 'Joanne', lastName: 'Aquino', position: 'HR Officer I', departmentCode: 'HRMO' },
        { employeeNo: 'EMP-2026-012', firstName: 'Mark', lastName: 'Salazar', position: 'Administrative Officer II', departmentCode: 'HRMO' },
        { employeeNo: 'EMP-2026-013', firstName: 'Ellen', lastName: 'Pascual', position: 'Treasurer', departmentCode: 'TREAS' },
        { employeeNo: 'EMP-2026-014', firstName: 'Victor', lastName: 'Natividad', position: 'Revenue Collection Clerk', departmentCode: 'TREAS' },
        { employeeNo: 'EMP-2026-015', firstName: 'Nina', lastName: 'Lopez', position: 'Nurse II', departmentCode: 'HEALTH' },
        { employeeNo: 'EMP-2026-016', firstName: 'Arthur', lastName: 'Ramos', position: 'Medical Technologist', departmentCode: 'HEALTH' },
        { employeeNo: 'EMP-2026-017', firstName: 'Cindy', lastName: 'Valdez', position: 'Property Custodian', departmentCode: 'GSO' },
        { employeeNo: 'EMP-2026-018', firstName: 'Leo', lastName: 'Mercado', position: 'Project Engineer', departmentCode: 'ENG' },
        { employeeNo: 'EMP-2026-019', firstName: 'Hazel', lastName: 'Domingo', position: 'Programmer', departmentCode: 'IT' },
        { employeeNo: 'EMP-2026-020', firstName: 'Ian', lastName: 'Morales', position: 'Administrative Aide', departmentCode: 'MAYOR' },
        { employeeNo: 'EMP-2026-021', firstName: 'Tricia', lastName: 'Diaz', position: 'HR Assistant', departmentCode: 'HRMO' },
        { employeeNo: 'EMP-2026-022', firstName: 'Gilbert', lastName: 'Romero', position: 'Accounting Clerk', departmentCode: 'TREAS' }
    ];

    let seededEmployees = 0;
    for (const emp of defaultEmployees) {
        const departmentId = departmentIdByCode.get(emp.departmentCode);
        if (!departmentId) throw new Error(`Department code ${emp.departmentCode} not found.`);

        await prisma.employee.upsert({
            where: { employeeNo: emp.employeeNo },
            update: {
                firstName: emp.firstName,
                lastName: emp.lastName,
                position: emp.position,
                departmentId
            },
            create: {
                employeeNo: emp.employeeNo,
                firstName: emp.firstName,
                lastName: emp.lastName,
                position: emp.position,
                departmentId
            }
        });
        seededEmployees += 1;
    }
    console.log(`✅ Seeded ${seededEmployees} Employees.`);

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
            update: { name: cat.name, useLifeYears: cat.useLifeYears },
            create: { code: cat.code, name: cat.name, useLifeYears: cat.useLifeYears }
        });
    }
    console.log(`✅ Seeded ${defaultCategories.length} Asset Categories.`);

    // 2.1 Seed Assets
    const employees = await prisma.employee.findMany({ select: { id: true, departmentId: true }, orderBy: { employeeNo: 'asc' } });
    const categories = await prisma.assetCategory.findMany({ select: { id: true, useLifeYears: true }, orderBy: { code: 'asc' } });

    const assetNamePool = ['Desktop Computer', 'Laptop Computer', 'Printer', 'Office Chair', 'Office Table', 'Projector', 'Filing Cabinet', 'Biometric Device', 'Network Switch', 'Router', 'Air Conditioner', 'Generator Set', 'Photocopier', 'LED Monitor', 'Vehicle Unit'];
    const brandPool = ['Dell', 'HP', 'Epson', 'Canon', 'Toyota', 'Mitsubishi', 'Acer', 'Lenovo'];
    const statusPool = ['Serviceable', 'Under Repair', 'Unserviceable'];

    let seededAssets = 0;
    for (let i = 1; i <= 120; i += 1) {
        const employee = employees[(i - 1) % employees.length];
        const category = categories[(i - 1) % categories.length];
        const propertyNo = `PROP-2026-${String(i).padStart(4, '0')}`;

        await prisma.asset.upsert({
            where: { propertyNo },
            update: {
                name: `${assetNamePool[(i - 1) % assetNamePool.length]} ${i}`,
                brand: brandPool[(i - 1) % brandPool.length],
                model: `Model-${(i % 12) + 1}`,
                serialNo: `SN-${String(i).padStart(6, '0')}`,
                cost: 4500 + (i % 15) * 1750,
                dateAcquired: new Date(2024, i % 12, ((i - 1) % 28) + 1),
                usefulLife: category.useLifeYears,
                status: statusPool[(i - 1) % statusPool.length],
                categoryId: category.id,
                departmentId: employee.departmentId,
                employeeId: employee.id
            },
            create: {
                propertyNo,
                name: `${assetNamePool[(i - 1) % assetNamePool.length]} ${i}`,
                brand: brandPool[(i - 1) % brandPool.length],
                model: `Model-${(i % 12) + 1}`,
                serialNo: `SN-${String(i).padStart(6, '0')}`,
                cost: 4500 + (i % 15) * 1750,
                dateAcquired: new Date(2024, i % 12, ((i - 1) % 28) + 1),
                usefulLife: category.useLifeYears,
                status: statusPool[(i - 1) % statusPool.length],
                categoryId: category.id,
                departmentId: employee.departmentId,
                employeeId: employee.id
            }
        });
        seededAssets += 1;
    }
    console.log(`✅ Seeded ${seededAssets} Assets.`);

    // 3. Seed Users (Linked via employeeId instead of email)
    const adminPassword = await argon2.hash('GamitAdmin2026!');
    const userPassword = await argon2.hash('GamitUser2026!');

    // Fetch the DB UUIDs for the specific accounts we injected earlier
    const adminEmp = await prisma.employee.findUnique({ where: { employeeNo: 'EMP-ADMIN-001' } });
    const standardEmp = await prisma.employee.findUnique({ where: { employeeNo: 'EMP-ENG-002' } });

    if (adminEmp) {
        await prisma.user.upsert({
            where: { employeeId: adminEmp.id },
            update: { password: adminPassword, role: 'ADMIN' },
            create: { employeeId: adminEmp.id, password: adminPassword, role: 'ADMIN' }
        });
        console.log(`✅ Seeded Admin User (EMP-ADMIN-001)`);
    }

    if (standardEmp) {
        await prisma.user.upsert({
            where: { employeeId: standardEmp.id },
            update: { password: userPassword, role: 'USER' },
            create: { employeeId: standardEmp.id, password: userPassword, role: 'USER' }
        });
        console.log(`✅ Seeded Standard User (EMP-ENG-002)`);
    }

    console.log('🏁 Seeding finished successfully.');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });