import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client/client.js';

export function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required to create PrismaClient');
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  // Create client with adapter
  return new PrismaClient({ adapter }) as unknown as PrismaClient;
}
