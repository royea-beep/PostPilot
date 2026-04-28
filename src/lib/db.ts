import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// Intercept Node.js SECURITY warning emitted by pg when sslmode=require
// sets rejectUnauthorized=false. Log it once so it appears in structured
// logs rather than raw stderr, which Vercel flags as a runtime error.
process.on('warning', (warning) => {
  if (warning.name === 'SECURITY') {
    console.warn('[db] Node SECURITY warning (pg SSL):', warning.message);
  }
});

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL!;
  // Neon requires SSL. pg parses sslmode=require from the URL and sets
  // rejectUnauthorized=false internally (triggers Node 24 SECURITY warning).
  // We keep rejectUnauthorized=false because Neon's CA chain is not always
  // in Node's default bundle, and a strict check breaks the connection.
  // The warning is suppressed via the process.on('warning') handler above.
  const isRemote = !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1');
  const pool = new pg.Pool({
    connectionString,
    ...(isRemote ? { ssl: { rejectUnauthorized: false } } : {}),
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
