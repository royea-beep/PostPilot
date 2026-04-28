import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL!;
  // Explicitly set ssl.rejectUnauthorized=true for remote connections.
  // Without this, pg defaults to rejectUnauthorized=false when sslmode=require
  // is in the URL, which triggers a Node.js [SECURITY] warning in Node 22+.
  const isRemote = !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1');
  const pool = new pg.Pool({
    connectionString,
    ...(isRemote ? { ssl: { rejectUnauthorized: true } } : {}),
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
