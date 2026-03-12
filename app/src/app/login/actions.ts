'use server';

import { prisma } from '@/lib/db';
import { createUserSession } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit';
import { verifyPassword, hashPassword } from '@/lib/password';
import type { ActionState } from '@/lib/action-state';
import { redirect } from 'next/navigation';

export async function login(_: ActionState, formData: FormData): Promise<ActionState> {
  const emailValue = formData.get('email');
  const passwordValue = formData.get('password');

  const email = typeof emailValue === 'string' ? emailValue.trim().toLowerCase() : '';
  const password = typeof passwordValue === 'string' ? passwordValue : '';

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !verifyPassword(password, user.password)) {
    await writeAuditLog({
      action: 'AUTH_LOGIN_FAILED',
      details: { email },
    });
    return { error: 'Invalid credentials' };
  }

  // Upgrade old plain-text seed users to hashed passwords at login.
  if (!user.password.startsWith('scrypt$')) {
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashPassword(password) },
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
