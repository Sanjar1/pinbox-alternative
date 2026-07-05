import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const DB_CHECK_TIMEOUT_MS = 5000;
const TIMEOUT_MESSAGE = `db check timed out after ${DB_CHECK_TIMEOUT_MS}ms`;

// Full error detail (may include host/port/driver internals) goes ONLY to the
// server log. The HTTP response body must never leak connection details, so
// it gets a short, fixed, non-identifying reason instead.
function fullErrorDetail(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function publicReason(error: unknown): string {
  if (error instanceof Error && error.message === TIMEOUT_MESSAGE) {
    return TIMEOUT_MESSAGE;
  }
  return 'database unreachable';
}

export async function GET() {
  console.log('[health] START db-select-1');

  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(TIMEOUT_MESSAGE));
    }, DB_CHECK_TIMEOUT_MS);
  });

  try {
    await Promise.race([prisma.$queryRaw`SELECT 1`, timeout]);
    console.log('[health] END db-select-1 ok');
    return Response.json({ ok: true, db: true });
  } catch (error) {
    const message = fullErrorDetail(error);
    console.error('[health] db check failed', { step: 'db-select-1', message });
    return Response.json({ ok: false, db: false, error: publicReason(error) }, { status: 503 });
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }
}
