import type { Prisma } from '@prisma/client';
import type { AuthUser } from '@/lib/auth';

export function storeWhereForUser(user: AuthUser): Prisma.StoreWhereInput {
  if (user.role === 'OWNER') {
    return { tenantId: user.tenantId, archivedAt: null };
  }

  return {
    tenantId: user.tenantId,
    archivedAt: null,
    managers: {
      some: { id: user.id },
    },
  };
}

export function storeByIdWhereForUser(user: AuthUser, id: string): Prisma.StoreWhereInput {
  return {
    id,
    ...storeWhereForUser(user),
  };
}

