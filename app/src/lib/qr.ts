import { randomBytes } from 'crypto';
import { prisma } from '@/lib/db';

export async function generateUniqueSlug(maxAttempts = 5): Promise<string> {
  for (let i = 0; i < maxAttempts; i += 1) {
    const slug = randomBytes(3).toString('hex');
    const existing = await prisma.qRCode.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing) {
      return slug;
    }
  }

  return randomBytes(6).toString('hex');
}

