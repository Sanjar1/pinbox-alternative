'use server';

import { prisma } from '@/lib/db';
import { createUserSession } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit';
import type { ActionState } from '@/lib/action-state';
import { redirect } from 'next/navigation';

const TEAM_USER_EMAIL = 'team@kaas.local';

export async function login(_: ActionState, formData: FormData): Promise<ActionState> {
  const passwordValue = formData.get('password');
  const password = typeof passwordValue === 'string' ? passwordValue : '';

  if (!password) {
    return { error: 'Введите пароль' };
  }

  const expected = process.env.TEAM_PASSWORD?.trim();
  if (!expected) {
    return { error: 'Сервер не настроен — обратитесь к администратору' };
  }

  if (password !== expected) {
    await writeAuditLog({
      action: 'AUTH_LOGIN_FAILED',
      details: { email: TEAM_USER_EMAIL },
    });
    return { error: 'Неверный пароль' };
  }

  // Find or lazily create the single shared team user. Password column is
  // unused for auth — TEAM_PASSWORD env var is the source of truth.
  let user = await prisma.user.findUnique({ where: { email: TEAM_USER_EMAIL } });
  if (!user) {
    const owner = await prisma.user.findFirst({
      where: { role: 'OWNER' },
      orderBy: { createdAt: 'asc' },
    });
    const tenantId = owner?.tenantId ?? (await prisma.tenant.create({ data: { name: 'KAAS' } })).id;
    user = await prisma.user.create({
      data: {
        email: TEAM_USER_EMAIL,
        password: 'env-managed',
        role: 'OWNER',
        tenantId,
      },
    });
  }

  await createUserSession(user.id);
  await writeAuditLog({
    action: 'AUTH_LOGIN_SUCCESS',
    userId: user.id,
    tenantId: user.tenantId,
  });

  redirect('/admin');
}
