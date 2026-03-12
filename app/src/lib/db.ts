import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

const TRANSIENT_DB_MESSAGES = [
  'the database system is starting up',
  "can't reach database server",
  'connection reset',
  'connection closed',
];

function isTransientDbError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return TRANSIENT_DB_MESSAGES.some((needle) => message.includes(needle));
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withDbRetry<T>(
  operation: () => Promise<T>,
  { attempts = 5, delayMs = 500 }: { attempts?: number; delayMs?: number } = {},
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isTransientDbError(error) || attempt === attempts) {
        throw error;
      }

      await sleep(delayMs * attempt);
    }
  }

  throw lastError;
}
