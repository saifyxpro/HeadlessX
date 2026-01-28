import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

declare global {
    var prisma: PrismaClient | undefined;
}

const createPrismaClient = () => {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is not set');
    }
    
    const adapter = new PrismaPg({ connectionString });
    return new PrismaClient({ adapter });
};

export const prisma = global.prisma || createPrismaClient();
