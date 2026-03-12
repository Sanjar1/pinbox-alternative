import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const HASH_PREFIX = 'scrypt';
const KEY_LENGTH = 64;

function toBuffer(hex: string): Buffer {
  return Buffer.from(hex, 'hex');
}

export function hashPassword(plainText: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(plainText, salt, KEY_LENGTH).toString('hex');
  return `${HASH_PREFIX}$${salt}$${derived}`;
}

export function verifyPassword(plainText: string, storedHash: string): boolean {
  const [prefix, salt, storedDerived] = storedHash.split('$');

  if (prefix !== HASH_PREFIX || !salt || !storedDerived) {
    // Backward compatibility for old plain-text local seeds.
    return storedHash === plainText;
  }

  const calculated = scryptSync(plainText, salt, KEY_LENGTH).toString('hex');
  const a = toBuffer(storedDerived);
  const b = toBuffer(calculated);
  return a.length === b.length && timingSafeEqual(a, b);
}

