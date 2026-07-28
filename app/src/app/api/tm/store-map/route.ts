import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkApiKey, newReqId, reportLog } from '@/lib/report-builder';
import { buildStoreIndex, matchStoreName } from '@/lib/manager-match';

/**
 * Resolve Менеджеры-sheet store names to QR-app store ids for the TM checklist bot.
 *
 * The bot's 30-minute QR-vote task needs to know which store id a vote belongs to, but
 * the sheet says "Лавка Сергели" where this database says "Сергели" (plus a maintained
 * alias table: Юнусобод→Юнусабад, Фуд сити→Food city, …). Rather than let the bot keep a
 * second copy of that table — which would drift and silently stop matching some stores —
 * the bot asks here and caches the answer.
 *
 * Called ONCE A DAY by the bot, deliberately: this service sleeps when idle and runs
 * under a $1/month usage budget, so nothing may poll it.
 */
export async function POST(req: Request) {
  const reqId = newReqId();

  if (!checkApiKey(req)) {
    reportLog('tm_store_map_unauthorized', { reqId });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let names: unknown;
  try {
    ({ names } = (await req.json()) as { names?: unknown });
  } catch {
    return NextResponse.json({ error: 'Malformed JSON body' }, { status: 400 });
  }
  if (!Array.isArray(names) || names.some((n) => typeof n !== 'string')) {
    return NextResponse.json({ error: 'Body must be { names: string[] }' }, { status: 400 });
  }

  const stores = await prisma.store.findMany({
    where: { archivedAt: null },
    select: { id: true, name: true },
  });
  const index = buildStoreIndex(stores);

  const map: Record<string, { storeId: string; dbName: string }> = {};
  const unmatched: string[] = [];
  for (const name of names as string[]) {
    const hit = matchStoreName(name, index);
    if (hit) map[name] = { storeId: hit.id, dbName: hit.name };
    else unmatched.push(name);
  }

  reportLog('tm_store_map_done', {
    reqId,
    asked: names.length,
    dbStores: stores.length,
    matched: Object.keys(map).length,
    unmatched,
  });

  return NextResponse.json({ map, unmatched });
}
