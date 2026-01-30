import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

// Mirroring the initialization from backend/src/database/client.ts
const createPrismaClient = () => {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is not set');
    }

    // Based on client.ts usage
    // Note: Standard docs say PrismaPg takes a pool, but client.ts passes { connectionString }
    // We will try to match client.ts exactly first.
    // If client.ts logic is wrong, that would explain the breakage!
    // But client.ts seems to infer it takes an object.
    // Let's assume client.ts is correct for now or might be using a helper I don't see?
    // Wait, client.ts imports { PrismaPg } from '@prisma/adapter-pg'.

    // Actually, let's verify if `pg` is needed. package.json has `pg`?
    // package.json does NOT list `pg` in dependencies.
    // It has `@prisma/adapter-pg`.
    // Maybe @prisma/adapter-pg v7 allows connection string?

    const adapter = new PrismaPg({ connectionString } as any); // Casting as any to avoid TS check issues in script if signatures differ
    return new PrismaClient({ adapter });
};

const prisma = createPrismaClient();

async function main() {
    try {
        console.log('Connecting to database...');
        // Try to count profiles to verify table existence
        const count = await prisma.profile.count();
        console.log(`Current profile count: ${count}`);

        console.log('Attempting to create a test profile...');
        const profile = await prisma.profile.create({
            data: {
                name: `Test Profile ${Date.now()}`,
                screen_width: 1920,
                screen_height: 1080,
                locale: 'en-US',
                storage_type: 'local',
                proxy_mode: 'none',
                is_active: true,
                is_running: false
            }
        });
        console.log('Successfully created profile:', profile);

        // Clean up
        console.log('Deleting test profile...');
        await prisma.profile.delete({
            where: { id: profile.id }
        });
        console.log('Cleanup successful');

    } catch (error) {
        console.error('Error during test:', error);
        // Print full error structure
        console.dir(error, { depth: null });
    } finally {
        await prisma.$disconnect();
    }
}

main();
