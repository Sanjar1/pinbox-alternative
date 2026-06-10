'use server';

import { createHash, timingSafeEqual } from 'node:crypto';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { createUserSession } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit';
import type { ActionState } from '@/lib/action-state';
import { redirect } from 'next/navigation';

const TEAM_USER_EMAIL = 'team@kaas.local';

// Brute-force guard: max 5 failed attempts per IP per 15 minutes. In-memory is
// acceptable here (single Railway replica; a restart just resets the window).
const FAILED_LIMIT = 5;
const FAILED_WINDOW_MS = 15 * 60_000;
const failedAttempts = new Map<string, { count: number; resetAt: number }>();

function loginRateLimited(ip: string): boolean {
  const entry = failedAttempts.get(ip);
  if (!entry || Date.now() > entry.resetAt) return false;
  return entry.count >= FAILED_LIMIT;
}

function recordFailedLogin(ip: string): void {
  const now = Date.now();
  const entry = failedAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    failedAttempts.set(ip, { count: 1, resetAt: now + FAILED_WINDOW_MS });
  } else {
    entry.count++;
  }
}

// Constant-time comparison of the plaintext team password.
function passwordMatches(input: string, expected: string): boolean {
  const a = createHash('sha256').update(input).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function login(_: ActionState, formData: FormData): Promise<ActionState> {
  const passwordValue = formData.get('password');
  const password = typeof passwordValue === 'string' ? passwordValue : '';

  if (!password) {
    return { error: 'Введите пароль' };
  }

  const hdrs = await headers();
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (loginRateLimited(ip)) {
    return { error: 'Слишком много попыток. Подождите 15 минут.' };
  }

  const expected = process.env.TEAM_PASSWORD?.trim();
  if (!expected) {
    return { error: 'Сервер не настроен — обратитесь к администратору' };
  }

  if (!passwordMatches(password, expected)) {
    recordFailedLogin(ip);
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
