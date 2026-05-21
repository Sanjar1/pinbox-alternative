import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: ReturnType<typeof makePrisma> };

// QR slugs were frozen on 2026-05-21 after 41 A5 posters were printed and
// distributed. Changing any slug breaks the physical QR code on a real
// poster, so we block writes that touch the slug column at the Prisma
// client layer. See data/qr-links-frozen-2026-05-21.json and
// docs/QR_SLUG_PROTECTION.md for the full rule.
const QR_SLUG_FROZEN_ERROR =
  'QRCode.slug is immutable (frozen 2026-05-21, 41 posters printed). ' +
  'See docs/QR_SLUG_PROTECTION.md before changing.';

function makePrisma() {
  const base = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
  });

  return base.$extends({
    name: 'qr-slug-immutability',
    query: {
      qRCode: {
        async update({ args, query }) {
          if (args.data && 'slug' in args.data && args.data.slug !== undefined) {
            throw new Error(QR_SLUG_FROZEN_ERROR);
          }
          return query(args);
        },
        async updateMany({ args, query }) {
          if (args.data && 'slug' in args.data && args.data.slug !== undefined) {
            throw new Error(QR_SLUG_FROZEN_ERROR);
          }
          return query(args);
        },
        async upsert({ args, query }) {
          if (args.update && 'slug' in args.update && args.update.slug !== undefined) {
            throw new Error(QR_SLUG_FROZEN_ERROR);
          }
          return query(args);
        },
      },
    },
  });
}

export const prisma = globalForPrisma.prisma || makePrisma();

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
