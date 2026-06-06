import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { google } from 'googleapis';
import { prisma } from './db';
import { reportLog, newReqId } from './report-builder';
import { resolveAssignments, type SheetRow, type DbStore } from './manager-match';

const SHEET_ID = '1N7Ysr2C8ivoXAbU0fZc07_aDFAvDhny-M5Zg2yxDgkw';
const SHEET_GID = 1105476357;

type SyncResult = {
  used: 'live' | 'fallback';
  matched: number;
  unmatched: string[];
  cleared: number;
};

// Read the Менеджеры tab rows via the service account. Returns [storeName, role, tmName][].
async function fetchSheetRows(): Promise<SheetRow[]> {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON not set');
  const creds = JSON.parse(raw);
  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  // googleapis accepts a GoogleAuth instance directly as `auth`.
  const sheets = google.sheets({ version: 'v4', auth });

  // Resolve the tab title for SHEET_GID (values.get needs a title, not a gid).
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const tab = (meta.data.sheets ?? []).find((s) => s.properties?.sheetId === SHEET_GID);
  const title = tab?.properties?.title;
  if (!title) throw new Error(`Sheet tab gid ${SHEET_GID} not found`);

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${title}!A2:E`, // skip header row; A=store, D=role, E=ТМ
  });
  const values = res.data.values ?? [];
  return values.map((r) => [String(r[0] ?? ''), String(r[3] ?? ''), String(r[4] ?? '')] as SheetRow);
}

// Fallback: DB-name → TM map loaded from the committed seed file, turned into
// sheet-like rows so the same resolve path runs.
function fallbackRows(): SheetRow[] {
  const file = join(process.cwd(), 'data', 'manager-assignments.json');
  const map = JSON.parse(readFileSync(file, 'utf8')) as Record<string, string>;
  return Object.entries(map).map(([dbName, tm]) => [dbName, 'MANAGER', tm] as SheetRow);
}

export async function syncManagers(reqId = newReqId()): Promise<SyncResult> {
  const ctx = { reqId, tag: 'manager-sync' };
  reportLog('manager_sync_start', ctx);

  const dbStores: DbStore[] = await prisma.store.findMany({
    where: { archivedAt: null },
    select: { id: true, name: true },
  });

  let rows: SheetRow[];
  let used: 'live' | 'fallback' = 'live';
  try {
    rows = await fetchSheetRows();
    reportLog('manager_sync_fetched', { ...ctx, rows: rows.length });
  } catch (err) {
    used = 'fallback';
    rows = fallbackRows();
    reportLog('manager_sync_fallback', { ...ctx, error: String(err), rows: rows.length });
  }

  const { assignments, unmatched, duplicateTargets } = resolveAssignments(rows, dbStores);
  reportLog('manager_sync_resolved', {
    ...ctx, used, matched: assignments.size, unmatched, duplicateTargets,
  });
  if (duplicateTargets.length > 0) {
    throw new Error(`manager-sync: duplicate store targets: ${duplicateTargets.join(', ')}`);
  }

  // Update-only: set territorialManager for every active store to its assigned TM
  // (or null if not in the mapping). NEVER create a store.
  let cleared = 0;
  await prisma.$transaction(
    dbStores.map((s) => {
      const tm = assignments.get(s.id) ?? null;
      if (tm === null) cleared++;
      return prisma.store.update({ where: { id: s.id }, data: { territorialManager: tm } });
    }),
  );

  reportLog('manager_sync_done', { ...ctx, used, matched: assignments.size, cleared });
  return { used, matched: assignments.size, unmatched, cleared };
}
