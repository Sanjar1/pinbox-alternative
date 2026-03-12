import crypto from 'node:crypto';

const DEVICE_COOKIE = 'qr_device_id';
const IP_HEADER_KEYS = [
  'x-forwarded-for',
  'x-real-ip',
  'cf-connecting-ip',
  'x-client-ip',
] as const;

type HeaderReader = {
  get(name: string): string | null;
};

type CookieReader = {
  get(name: string): { value: string } | undefined;
  set(name: string, value: string, options?: Record<string, unknown>): void;
};

export function getClientIp(inputHeaders: HeaderReader): string {
  for (const key of IP_HEADER_KEYS) {
    const value = inputHeaders.get(key);
    if (!value) {
      continue;
    }
    const first = value.split(',')[0]?.trim();
    if (first) {
      return first;
    }
  }
  return '';
}

export function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function getOrCreateDeviceId(cookieStore: CookieReader, clientDeviceId: string): string {
  if (clientDeviceId) {
    cookieStore.set(DEVICE_COOKIE, clientDeviceId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    });
    return clientDeviceId;
  }

  const fromCookie = cookieStore.get(DEVICE_COOKIE)?.value ?? '';
  if (fromCookie) {
    return fromCookie;
  }

  const generated = crypto.randomUUID();
  cookieStore.set(DEVICE_COOKIE, generated, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  });
  return generated;
}

