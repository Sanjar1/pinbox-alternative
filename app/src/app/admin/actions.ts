'use server';

import { redirect } from 'next/navigation';
import { destroyCurrentSession, getCurrentUser } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit';

export async function logout(): Promise<void> {
  const user = await getCurrentUser();
  if (user) {
    await writeAuditLog({
      action: 'AUTH_LOGOUT',
      userId: user.id,
      tenantId: user.tenantId,
    });
  }

  await destroyCurrentSession();
  redirect('/login');
}

