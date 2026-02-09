import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
    pool: Pool | undefined;
};

function createPrismaClient() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        throw new Error("DATABASE_URL environment variable is not set");
    }

    // Create a pg Pool
    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
    });

    // Create the Prisma adapter using the pg Pool
    const adapter = new PrismaPg(pool);

    // Create Prisma Client with the adapter
    return {
        prisma: new PrismaClient({ adapter }),
        pool
    };
}

if (!globalForPrisma.prisma) {
    const { prisma, pool } = createPrismaClient();
    globalForPrisma.prisma = prisma;
    globalForPrisma.pool = pool;
}

export const prisma = globalForPrisma.prisma;

// Cleanup function if needed
export async function disconnect() {
    await prisma?.$disconnect();
    await globalForPrisma.pool?.end();
}
