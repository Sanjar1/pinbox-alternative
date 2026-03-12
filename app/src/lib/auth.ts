import { createHash, randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';

const SESSION_COOKIE_NAME = 'pinbox_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;

export type AppRole = 'OWNER' | 'STORE_MANAGER';

export type AuthUser = {
  id: string;
  email: string;
  tenantId: string;
  role: AppRole;
};

function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function toAuthUser(user: {
  id: string;
  email: string;
  tenantId: string;
  role: string;
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    tenantId: user.tenantId,
    role: user.role === 'OWNER' ? 'OWNER' : 'STORE_MANAGER',
  };
}

function noAuthModeEnabled(): boolean {
  const value = process.env.DISABLE_AUTH_FOR_TESTING;
  if (value) {
    return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
  }
  return process.env.NODE_ENV !== 'production';
}

export function isAuthDisabledForTesting(): boolean {
  return noAuthModeEnabled();
}

async function getBypassUser(): Promise<AuthUser | null> {
  const owner = await prisma.user.findFirst({
    where: { role: 'OWNER' },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      email: true,
      tenantId: true,
      role: true,
    },
  });

  if (owner) {
    return toAuthUser(owner);
  }

  const anyUser = await prisma.user.findFirst({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      email: true,
      tenantId: true,
      role: true,
    },
  });

  if (anyUser) {
    return toAuthUser(anyUser);
  }

  const createdTenant = await prisma.tenant.create({
    data: {
      name: 'Testing Tenant',
    },
  });

  const createdUser = await prisma.user.create({
    data: {
      email: 'testing-owner@pinbox.local',
      password: 'testing-only',
      role: 'OWNER',
      tenantId: createdTenant.id,
    },
    select: {
      id: true,
      email: true,
      tenantId: true,
      role: true,
    },
  });

  return toAuthUser(createdUser);
}

export async function createUserSession(userId: string): Promise<void> {
  const sessionToken = randomBytes(32).toString('hex');
  const tokenHash = hashSessionToken(sessionToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  await prisma.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (noAuthModeEnabled()) {
    return getBypassUser();
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const tokenHash = hashSessionToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    return null;
  }

  return toAuthUser(session.user);
}

export async function requireCurrentUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}

export async function requireOwner(): Promise<AuthUser> {
  const user = await requireCurrentUser();
  if (user.role !== 'OWNER') {
    redirect('/admin');
  }
  return user;
}

export async function destroyCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const tokenHash = hashSessionToken(token);
    await prisma.session.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}
