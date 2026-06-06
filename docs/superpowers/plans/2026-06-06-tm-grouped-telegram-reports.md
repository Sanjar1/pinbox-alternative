# TM-Grouped Telegram Reports Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the daily and weekly Telegram reports to group stores by their 4 territorial managers, with a global Top-5 leaderboard, per-manager reviewed-store tables, named silent stores, and one universal motivational line — fed by a Google-Sheet→DB manager sync.

**Architecture:** A new nullable `Store.territorialManager` column holds each store's TM, read at report time (no redeploy needed for updates). A sync module reads the "Менеджеры" sheet tab via a Google service account and upserts that column (update-only, never creates stores). Pure, dependency-free modules (`manager-match.ts` for name matching, `report-format.ts` for rendering) are unit-tested; `manager-sync.ts` and `report-builder.ts` wire them to Google + Prisma. Sync runs as the first (continue-on-error) step of the existing report GitHub Actions workflows, guaranteeing sync-then-report ordering.

**Tech Stack:** Next.js 16 (App Router, route handlers), Prisma 5 + Postgres, `googleapis` (new dep), `vitest` (new dev dep for pure-unit tests), GitHub Actions, Railway.

---

## Reference data (used across tasks)

**The 4 territorial managers** and their stores (DB names). This is the canonical
seed/fallback mapping (`app/data/manager-assignments.json`):

```json
{
  "Юнусабад": "Абдухамитова Арофат",
  "Навруз": "Абдухамитова Арофат",
  "Чирчик": "Абдухамитова Арофат",
  "Госпитальный": "Абдухамитова Арофат",
  "ТТЗ": "Абдухамитова Арофат",
  "Корасув": "Абдухамитова Арофат",
  "Сайрам": "Абдухамитова Арофат",
  "Газалкент": "Абдухамитова Арофат",
  "Хасанбой": "Абдухамитова Арофат",
  "Самарканд": "Абдухамитова Арофат",
  "Глоток Юнусабад": "Абдухамитова Арофат",
  "Аския": "Хасанов Даврон",
  "Янги Хаёт": "Хасанов Даврон",
  "Учтепа": "Хасанов Даврон",
  "Чорсу": "Хасанов Даврон",
  "Тансикбаев": "Хасанов Даврон",
  "Фарход": "Хасанов Даврон",
  "Торговый Центр": "Хасанов Даврон",
  "Янгиюль": "Хасанов Даврон",
  "Бухара": "Хасанов Даврон",
  "Урикзор": "Хасанов Даврон",
  "Келес": "Хасанов Даврон",
  "Авиасозлар": "Юсупова Дурдона",
  "Олой": "Юсупова Дурдона",
  "Кадышева": "Юсупова Дурдона",
  "Бектемир": "Юсупова Дурдона",
  "Паркентский": "Юсупова Дурдона",
  "Food city": "Юсупова Дурдона",
  "Сергели оптом": "Юсупова Дурдона",
  "Цум": "Юсупова Дурдона",
  "Дубовый": "Юсупова Дурдона",
  "Буз бозор": "Музаффаров Фазлиддин",
  "Чилонзор 21": "Музаффаров Фазлиддин",
  "Ялангач": "Музаффаров Фазлиддин",
  "ЭКО": "Музаффаров Фазлиддин",
  "Фергана": "Музаффаров Фазлиддин",
  "Рисовый": "Музаффаров Фазлиддин",
  "Метро Чиланзар": "Музаффаров Фазлиддин",
  "Панельный": "Музаффаров Фазлиддин",
  "Авайхон": "Музаффаров Фазлиддин",
  "Глоток Панельный": "Музаффаров Фазлиддин"
}
```

41 stores. The 2 unassigned DB stores (no TM): **Катортол**, **Чилонзор Торговый**.

**Sheet-name → DB-name alias table** (sheet names that don't equal the DB name
after normalizing). Used by `manager-match.ts`. Keys are the *normalized* sheet
name (prefix stripped, lowercased, ё→е, trimmed); values are exact DB names:

| Normalized sheet name | DB name |
|---|---|
| `юнусобод` | Юнусабад |
| `тансикбоев` | Тансикбаев |
| `фуд сити` | Food city |
| `буз базар` | Буз бозор |
| `ялангоч` | Ялангач |
| `фаргона` | Фергана |
| `чилонзор метро` | Метро Чиланзар |
| `панелный` | Панельный |

Plus two **exact, pre-normalization** aliases (raw sheet name → DB name) for the
Глоток stores, which must NOT have their prefix stripped:

| Raw sheet name (trimmed) | DB name |
|---|---|
| `Глоток Панелный` | Глоток Панельный |
| `Глоток Юнусабад` | Глоток Юнусабад |

**Sheet columns** (tab "Менеджеры", gid 1105476357): col A = store name, col D =
`Роль`, col E = `ФИО ТМ`. Only rows with `Роль === 'MANAGER'` and a non-empty
store name + non-empty ТМ are store assignments. Skip `НЕ НАЗНАЧЕН`, `Магазин
Тест`, `Магазин #1`, and all non-MANAGER rows.

---

## Task 1: Add `territorialManager` column to Store

**Files:**
- Modify: `app/prisma/schema.prisma` (Store model, after `archivedAt`)
- Create: `app/prisma/migrations/<timestamp>_add_store_territorial_manager/migration.sql`

- [ ] **Step 1: Add the field to the schema**

In `app/prisma/schema.prisma`, inside `model Store`, add after the `archivedAt`
line (`archivedAt  DateTime?`):

```prisma
  territorialManager String?   // TM full name from the Менеджеры sheet; null = unassigned
```

- [ ] **Step 2: Generate the migration (additive only)**

If a dev/shadow Postgres is available via `DATABASE_URL`, run from `app/`:

Run: `npx prisma migrate dev --name add_store_territorial_manager --create-only`

If no dev DB is available, create the file by hand at
`app/prisma/migrations/<timestamp>_add_store_territorial_manager/migration.sql`
with EXACTLY this content (nothing else — additive, safe on production):

```sql
-- AlterTable
ALTER TABLE "Store" ADD COLUMN "territorialManager" TEXT;
```

- [ ] **Step 3: Regenerate the Prisma client**

Run: `npx prisma generate`
Expected: client regenerates with `territorialManager` on the Store type.

- [ ] **Step 4: Verify the migration is purely additive**

Open the generated `migration.sql` and confirm it contains ONLY the
`ADD COLUMN` statement above — no `DROP`, no change to `slug`, no other table.
This protects the frozen-slug rule (the Prisma slug guard only blocks `qRCode`
writes, but we verify regardless).

- [ ] **Step 5: Commit**

```bash
git add app/prisma/schema.prisma app/prisma/migrations
git commit -m "feat(db): add Store.territorialManager (additive migration)"
```

---

## Task 2: Add vitest for pure-unit tests

**Files:**
- Modify: `app/package.json` (devDependencies + `test` script)
- Create: `app/vitest.config.ts`

- [ ] **Step 1: Install vitest**

Run from `app/`: `npm install -D vitest`
Expected: `vitest` added to devDependencies.

- [ ] **Step 2: Add a test script**

In `app/package.json` `scripts`, add:

```json
    "test": "vitest run",
```

- [ ] **Step 3: Create the vitest config**

Create `app/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 4: Smoke-test the runner**

Create a throwaway `app/src/lib/__smoke__.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
describe('smoke', () => { it('runs', () => { expect(1 + 1).toBe(2); }); });
```

Run from `app/`: `npm test`
Expected: 1 passing test. Then delete the smoke file:

```bash
rm app/src/lib/__smoke__.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add app/package.json app/package-lock.json app/vitest.config.ts
git commit -m "chore(test): add vitest for pure-unit tests"
```

---

## Task 3: Name normalization + alias matching (pure, tested)

**Files:**
- Create: `app/src/lib/manager-match.ts`
- Test: `app/src/lib/manager-match.test.ts`

- [ ] **Step 1: Write the failing test**

Create `app/src/lib/manager-match.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { normalizeStoreName, resolveAssignments } from './manager-match';

// Minimal DB-store stand-ins.
const DB = [
  'Юнусабад', 'Навруз', 'Чирчик', 'Госпитальный', 'ТТЗ', 'Корасув', 'Сайрам',
  'Газалкент', 'Хасанбой', 'Самарканд', 'Глоток Юнусабад',
  'Аския', 'Янги Хаёт', 'Учтепа', 'Чорсу', 'Тансикбаев', 'Фарход',
  'Торговый Центр', 'Янгиюль', 'Бухара', 'Урикзор', 'Келес',
  'Авиасозлар', 'Олой', 'Кадышева', 'Бектемир', 'Паркентский', 'Food city',
  'Сергели оптом', 'Цум', 'Дубовый',
  'Буз бозор', 'Чилонзор 21', 'Ялангач', 'ЭКО', 'Фергана', 'Рисовый',
  'Метро Чиланзар', 'Панельный', 'Авайхон', 'Глоток Панельный',
  // The 2 unassigned + extras present in DB but not the sheet:
  'Катортол', 'Чилонзор Торговый',
].map((name, i) => ({ id: `id-${i}`, name }));

// Sheet rows: [storeName, role, tmName]
const SHEET: Array<[string, string, string]> = [
  ['Лавка Юнусобод', 'MANAGER', 'Абдухамитова Арофат'],
  ['Глоток Юнусабад', 'MANAGER', 'Абдухамитова Арофат'],
  ['Глоток Панелный', 'MANAGER', 'Музаффаров Фазлиддин'],
  ['Лавка Эко ', 'MANAGER', 'Музаффаров Фазлиддин'],
  ['Лавка Ялангоч', 'MANAGER', 'Музаффаров Фазлиддин'],
  ['Лавка Фуд сити', 'MANAGER', 'Юсупова Дурдона'],
  ['Ruba Бухара', 'MANAGER', 'Хасанов Даврон'],
  ['Лавка ЦУМ', 'MANAGER', 'Юсупова Дурдона'],
  ['Лавка Чилонзор Метро', 'MANAGER', 'Музаффаров Фазлиддин'],
  ['НЕ НАЗНАЧЕН', 'MANAGER', ''],
  ['', 'TERRITORIAL_MANAGER', ''],
];

describe('normalizeStoreName', () => {
  it('strips Лавка / Ruba prefixes, lowercases, folds ё→е, trims', () => {
    expect(normalizeStoreName('Лавка Янги хает')).toBe('янги хает');
    expect(normalizeStoreName('Ruba Бухара')).toBe('бухара');
    expect(normalizeStoreName('Лавка Эко ')).toBe('эко');
  });
  it('does NOT strip Глоток', () => {
    expect(normalizeStoreName('Глоток Юнусабад')).toBe('глоток юнусабад');
  });
});

describe('resolveAssignments', () => {
  it('maps every sheet store row to a DB store id (no unmatched, no dupes)', () => {
    const r = resolveAssignments(SHEET, DB);
    expect(r.unmatched).toEqual([]);
    expect(r.duplicateTargets).toEqual([]);
    // Глоток Юнусабад must NOT collide with plain Юнусабад
    const glotok = DB.find((s) => s.name === 'Глоток Юнусабад')!;
    const plain = DB.find((s) => s.name === 'Юнусабад')!;
    expect(r.assignments.get(glotok.id)).toBe('Абдухамитова Арофат');
    expect(r.assignments.get(plain.id)).toBe('Абдухамитова Арофат');
    expect(glotok.id).not.toBe(plain.id);
  });
  it('skips non-MANAGER rows and the НЕ НАЗНАЧЕН / blank rows', () => {
    const r = resolveAssignments(SHEET, DB);
    // 9 real MANAGER rows above, 2 skipped → 9 assignments
    expect(r.assignments.size).toBe(9);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run from `app/`: `npm test -- manager-match`
Expected: FAIL — `manager-match.ts` / its exports don't exist.

- [ ] **Step 3: Implement `manager-match.ts`**

Create `app/src/lib/manager-match.ts`:

```ts
// Pure name-matching for the Менеджеры sheet → DB stores. No I/O, no deps —
// unit-tested in manager-match.test.ts.

export type SheetRow = [storeName: string, role: string, tmName: string];
export type DbStore = { id: string; name: string };

// Raw (pre-normalization) exact aliases. These store names must NOT have their
// prefix stripped, because stripping "Глоток" would collide with a different store.
const RAW_ALIASES: Record<string, string> = {
  'Глоток Панелный': 'Глоток Панельный',
  'Глоток Юнусабад': 'Глоток Юнусабад',
};

// Normalized-sheet-name → DB name, for names that differ after normalization.
const NORMALIZED_ALIASES: Record<string, string> = {
  'юнусобод': 'Юнусабад',
  'тансикбоев': 'Тансикбаев',
  'фуд сити': 'Food city',
  'буз базар': 'Буз бозор',
  'ялангоч': 'Ялангач',
  'фаргона': 'Фергана',
  'чилонзор метро': 'Метро Чиланзар',
  'панелный': 'Панельный',
};

const STORE_PREFIXES = [/^лавка\s+/i, /^ruba\s+/i];
const SKIP_NAMES = new Set(['НЕ НАЗНАЧЕН', 'Магазин Тест', 'Магазин #1']);

export function normalizeStoreName(raw: string): string {
  let s = (raw ?? '').trim();
  for (const re of STORE_PREFIXES) s = s.replace(re, '');
  s = s.toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
  return s;
}

export type ResolveResult = {
  assignments: Map<string, string>; // storeId → TM name
  unmatched: string[];              // sheet store names with no DB match
  duplicateTargets: string[];       // DB store ids two sheet rows resolved to
};

// Build a lookup from normalized DB name → DB store. Latin names (e.g. "Food
// city") normalize to themselves lowercased so the alias values still resolve.
function indexDbStores(db: DbStore[]): Map<string, DbStore> {
  const byNorm = new Map<string, DbStore>();
  for (const store of db) {
    byNorm.set(store.name.toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim(), store);
  }
  return byNorm;
}

export function resolveAssignments(rows: SheetRow[], db: DbStore[]): ResolveResult {
  const byNorm = indexDbStores(db);
  const byExactName = new Map(db.map((s) => [s.name, s]));
  const assignments = new Map<string, string>();
  const unmatched: string[] = [];
  const seen = new Map<string, string>(); // storeId → first sheet name (dupe check)
  const duplicateTargets: string[] = [];

  for (const [rawName, role, tmName] of rows) {
    const storeName = (rawName ?? '').trim();
    const tm = (tmName ?? '').trim();
    if (role !== 'MANAGER') continue;
    if (!storeName || !tm) continue;
    if (SKIP_NAMES.has(storeName)) continue;

    // 1) raw exact alias (Глоток stores) → DB store by exact name
    let store: DbStore | undefined;
    const aliasDbName = RAW_ALIASES[storeName];
    if (aliasDbName) {
      store = byExactName.get(aliasDbName);
    } else {
      // 2) normalized alias, else 3) normalized direct match
      const norm = normalizeStoreName(storeName);
      const target = NORMALIZED_ALIASES[norm];
      store = target
        ? byExactName.get(target)
        : byNorm.get(norm);
    }

    if (!store) { unmatched.push(storeName); continue; }
    if (seen.has(store.id)) { duplicateTargets.push(store.id); continue; }
    seen.set(store.id, storeName);
    assignments.set(store.id, tm);
  }

  return { assignments, unmatched, duplicateTargets };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run from `app/`: `npm test -- manager-match`
Expected: PASS (all cases green).

- [ ] **Step 5: Commit**

```bash
git add app/src/lib/manager-match.ts app/src/lib/manager-match.test.ts
git commit -m "feat(reports): pure sheet-name→store matching with alias + collision guard"
```

---

## Task 4: Manager sync module (Sheets → DB) + seed/fallback

**Files:**
- Create: `app/data/manager-assignments.json` (the 41-entry map from Reference data)
- Create: `app/src/lib/manager-sync.ts`
- Modify: `app/package.json` (add `googleapis` dependency)

- [ ] **Step 1: Create the seed/fallback file**

Create `app/data/manager-assignments.json` with the exact 41-entry JSON object
from the **Reference data** section above (DB name → TM name).

- [ ] **Step 2: Install googleapis**

Run from `app/`: `npm install googleapis`
Expected: `googleapis` in dependencies.

- [ ] **Step 3: Implement `manager-sync.ts`**

Create `app/src/lib/manager-sync.ts`:

```ts
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
```

- [ ] **Step 4: Manually verify the seed fallback resolves 41/41**

Add a temporary script `app/scripts/tmp-verify-seed.mjs`:

```js
import { readFileSync } from 'node:fs';
const map = JSON.parse(readFileSync('data/manager-assignments.json', 'utf8'));
console.log('seed entries:', Object.keys(map).length);
const tms = new Set(Object.values(map));
console.log('TMs:', [...tms]);
```

Run from `app/`: `node scripts/tmp-verify-seed.mjs`
Expected: `seed entries: 41` and 4 TM names. Then delete the script:

```bash
rm app/scripts/tmp-verify-seed.mjs
```

- [ ] **Step 5: Commit**

```bash
git add app/data/manager-assignments.json app/src/lib/manager-sync.ts app/package.json app/package-lock.json
git commit -m "feat(reports): manager sync (Sheets→DB, update-only) + seed fallback"
```

---

## Task 5: Sync endpoint

**Files:**
- Create: `app/src/app/api/admin/sync-managers/route.ts`

- [ ] **Step 1: Implement the route**

Create `app/src/app/api/admin/sync-managers/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { checkApiKey, newReqId, reportLog } from '@/lib/report-builder';
import { syncManagers } from '@/lib/manager-sync';

export async function POST(req: Request) {
  const reqId = newReqId();
  if (!checkApiKey(req)) {
    reportLog('manager_sync_unauthorized', { reqId });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const result = await syncManagers(reqId);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    reportLog('manager_sync_error', { reqId, error: String(err) });
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
```

- [ ] **Step 2: Typecheck**

Run from `app/`: `npx tsc --noEmit`
Expected: no errors (confirms `checkApiKey`, `newReqId`, `reportLog`, `syncManagers` signatures line up).

- [ ] **Step 3: Commit**

```bash
git add app/src/app/api/admin/sync-managers/route.ts
git commit -m "feat(reports): POST /api/admin/sync-managers (REPORTS_API_KEY auth)"
```

---

## Task 6: Report formatter (pure, tested) — daily + weekly shape

**Files:**
- Create: `app/src/lib/report-format.ts`
- Test: `app/src/lib/report-format.test.ts`

This module renders the message from already-fetched data. No Prisma, no Next.

- [ ] **Step 1: Write the failing test (5 June fixture)**

Create `app/src/lib/report-format.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { formatGroupedReport, type StoreStat } from './report-format';

// 5 June 2026 real data. avg is per-store average; count is vote count.
const STORES: StoreStat[] = [
  { name: 'Аския', tm: 'Хасанов Даврон', count: 26, avg: 5.0 },
  { name: 'Чорсу', tm: 'Хасанов Даврон', count: 3, avg: 5.0 },
  { name: 'Янги Хаёт', tm: 'Хасанов Даврон', count: 1, avg: 5.0 },
  { name: 'Учтепа', tm: 'Хасанов Даврон', count: 0, avg: 0 },
  { name: 'Тансикбаев', tm: 'Хасанов Даврон', count: 0, avg: 0 },
  { name: 'Фарход', tm: 'Хасанов Даврон', count: 0, avg: 0 },
  { name: 'Торговый Центр', tm: 'Хасанов Даврон', count: 0, avg: 0 },
  { name: 'Янгиюль', tm: 'Хасанов Даврон', count: 0, avg: 0 },
  { name: 'Бухара', tm: 'Хасанов Даврон', count: 0, avg: 0 },
  { name: 'Урикзор', tm: 'Хасанов Даврон', count: 0, avg: 0 },
  { name: 'Келес', tm: 'Хасанов Даврон', count: 0, avg: 0 },
  { name: 'Чирчик', tm: 'Абдухамитова Арофат', count: 15, avg: 5.0 },
  { name: 'Навруз', tm: 'Абдухамитова Арофат', count: 1, avg: 5.0 },
  { name: 'Юнусабад', tm: 'Абдухамитова Арофат', count: 0, avg: 0 },
  { name: 'Госпитальный', tm: 'Абдухамитова Арофат', count: 0, avg: 0 },
  { name: 'ТТЗ', tm: 'Абдухамитова Арофат', count: 0, avg: 0 },
  { name: 'Корасув', tm: 'Абдухамитова Арофат', count: 0, avg: 0 },
  { name: 'Сайрам', tm: 'Абдухамитова Арофат', count: 0, avg: 0 },
  { name: 'Газалкент', tm: 'Абдухамитова Арофат', count: 0, avg: 0 },
  { name: 'Хасанбой', tm: 'Абдухамитова Арофат', count: 0, avg: 0 },
  { name: 'Самарканд', tm: 'Абдухамитова Арофат', count: 0, avg: 0 },
  { name: 'Глоток Юнусабад', tm: 'Абдухамитова Арофат', count: 0, avg: 0 },
  { name: 'ЭКО', tm: 'Музаффаров Фазлиддин', count: 8, avg: 4.9 },
  { name: 'Авайхон', tm: 'Музаффаров Фазлиддин', count: 1, avg: 5.0 },
  { name: 'Глоток Панельный', tm: 'Музаффаров Фазлиддин', count: 1, avg: 5.0 },
  { name: 'Фергана', tm: 'Музаффаров Фазлиддин', count: 1, avg: 5.0 },
  { name: 'Ялангач', tm: 'Музаффаров Фазлиддин', count: 1, avg: 5.0 },
  { name: 'Буз бозор', tm: 'Музаффаров Фазлиддин', count: 0, avg: 0 },
  { name: 'Чилонзор 21', tm: 'Музаффаров Фазлиддин', count: 0, avg: 0 },
  { name: 'Рисовый', tm: 'Музаффаров Фазлиддин', count: 0, avg: 0 },
  { name: 'Метро Чиланзар', tm: 'Музаффаров Фазлиддин', count: 0, avg: 0 },
  { name: 'Панельный', tm: 'Музаффаров Фазлиддин', count: 0, avg: 0 },
  { name: 'Сергели оптом', tm: 'Юсупова Дурдона', count: 1, avg: 5.0 },
  { name: 'Цум', tm: 'Юсупова Дурдона', count: 1, avg: 5.0 },
  { name: 'Авиасозлар', tm: 'Юсупова Дурдона', count: 0, avg: 0 },
  { name: 'Олой', tm: 'Юсупова Дурдона', count: 0, avg: 0 },
  { name: 'Кадышева', tm: 'Юсупова Дурдона', count: 0, avg: 0 },
  { name: 'Бектемир', tm: 'Юсупова Дурдона', count: 0, avg: 0 },
  { name: 'Паркентский', tm: 'Юсупова Дурдона', count: 0, avg: 0 },
  { name: 'Food city', tm: 'Юсупова Дурдона', count: 0, avg: 0 },
  { name: 'Дубовый', tm: 'Юсупова Дурдона', count: 0, avg: 0 },
  // 2 unassigned, 0 reviews this day:
  { name: 'Катортол', tm: null, count: 0, avg: 0 },
  { name: 'Чилонзор Торговый', tm: null, count: 0, avg: 0 },
];

describe('formatGroupedReport (daily, 5 June)', () => {
  const out = formatGroupedReport('daily', '5 июня 2026', STORES);
  const text = Array.isArray(out) ? out.join('\n') : out;

  it('summary reconciles to 60 / 12 / 43', () => {
    expect(text).toContain('Всего отзывов: 60');
    expect(text).toContain('Магазинов с отзывами: 12 из 43');
    expect(text).toContain('без отзывов: 31');
  });
  it('Top-5 is the five highest-count stores', () => {
    expect(text).toContain('1. Аския — 26 — 5.0');
    expect(text).toContain('5. Авайхон — 1 — 5.0');
    expect(text).not.toContain('6. ');
  });
  it('renders all 4 TM headers with their totals', () => {
    expect(text).toContain('Хасанов Даврон');
    expect(text).toContain('Абдухамитова Арофат');
    expect(text).toContain('Музаффаров Фазлиддин');
    expect(text).toContain('Юсупова Дурдона');
  });
  it('lists silent stores (alphabetical) and the universal line per block', () => {
    // formatter sorts silent stores by name (ru) for deterministic output
    expect(text).toContain('Молчат: Бухара, Келес, Тансикбаев, Торговый Центр, Урикзор, Учтепа, Фарход, Янгиюль');
    expect(text).toContain('8 из 11 магазинов молчат — продавцы не просят оценить. Нет голоса = нет работы с клиентом.');
  });
  it('does NOT give the unassigned stores a block, and (0 reviews) shows no footer', () => {
    expect(text).not.toContain('Катортол');
    expect(text).not.toContain('Без менеджера');
  });
});

describe('formatGroupedReport edge cases', () => {
  it('fully covered block shows the ✅ line, no Молчат', () => {
    const out = formatGroupedReport('daily', 'x', [
      { name: 'A', tm: 'TM1', count: 2, avg: 5 },
      { name: 'B', tm: 'TM1', count: 1, avg: 4 },
    ]);
    const text = Array.isArray(out) ? out.join('\n') : out;
    expect(text).toContain('Все магазины с отзывами ✅');
    expect(text).not.toContain('Молчат:');
  });
  it('fully empty day shows the Top-5 fallback line', () => {
    const out = formatGroupedReport('daily', 'x', [
      { name: 'A', tm: 'TM1', count: 0, avg: 0 },
    ]);
    const text = Array.isArray(out) ? out.join('\n') : out;
    expect(text).toContain('Топ-5: отзывов сегодня не поступало');
  });
  it('shows the footer when an unassigned store has reviews', () => {
    const out = formatGroupedReport('daily', 'x', [
      { name: 'A', tm: 'TM1', count: 1, avg: 5 },
      { name: 'Катортол', tm: null, count: 2, avg: 5 },
    ]);
    const text = Array.isArray(out) ? out.join('\n') : out;
    expect(text).toContain('Без менеджера (Катортол): 2 отзывов');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run from `app/`: `npm test -- report-format`
Expected: FAIL — module/exports missing.

- [ ] **Step 3: Implement `report-format.ts`**

Create `app/src/lib/report-format.ts`:

```ts
// Pure rendering of the grouped Telegram report. No I/O. Unit-tested.

export type StoreStat = { name: string; tm: string | null; count: number; avg: number };
type Period = 'daily' | 'weekly';

const SAFE_LIMIT = 3900;

function escapeHtml(t: string): string {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Sort by count desc → avg desc → name asc.
function byPerformance(a: StoreStat, b: StoreStat): number {
  if (b.count !== a.count) return b.count - a.count;
  if (b.avg !== a.avg) return b.avg - a.avg;
  return a.name.localeCompare(b.name, 'ru');
}

// One monospace row: "<name padded>  <count>  <avg>".
const NAME_W = 18;
function tableRow(s: StoreStat): string {
  const name = s.name.length > NAME_W ? s.name.slice(0, NAME_W - 1) + '…' : s.name.padEnd(NAME_W);
  return `${escapeHtml(name)}${String(s.count).padStart(4)}   ${s.avg.toFixed(1)}`;
}

function weightedAvg(stores: StoreStat[]): number {
  const total = stores.reduce((n, s) => n + s.count, 0);
  if (total === 0) return 0;
  return stores.reduce((n, s) => n + s.avg * s.count, 0) / total;
}

function universalLine(silent: number, total: number): string {
  if (silent === 0) return 'Все магазины с отзывами ✅';
  return `${silent} из ${total} магазинов молчат — продавцы не просят оценить. Нет голоса = нет работы с клиентом.`;
}

function tmBlock(tm: string, stores: StoreStat[]): string {
  const total = stores.reduce((n, s) => n + s.count, 0);
  const avg = weightedAvg(stores).toFixed(1);
  const withReviews = stores.filter((s) => s.count > 0).sort(byPerformance);
  const silent = stores.filter((s) => s.count === 0).sort((a, b) => a.name.localeCompare(b.name, 'ru'));

  const lines: string[] = [`👤 <b>${escapeHtml(tm)}</b> — ${total} отзывов · средняя ${avg}`];
  if (withReviews.length > 0) {
    lines.push('<pre>' + withReviews.map(tableRow).join('\n') + '</pre>');
  }
  if (silent.length > 0) {
    lines.push('Молчат: ' + silent.map((s) => escapeHtml(s.name)).join(', '));
  }
  lines.push(universalLine(silent.length, stores.length));
  return lines.join('\n');
}

export function formatGroupedReport(period: Period, label: string, stores: StoreStat[]): string | string[] {
  const totalVotes = stores.reduce((n, s) => n + s.count, 0);
  const withVotes = stores.filter((s) => s.count > 0).length;
  const totalStores = stores.length;
  const avg = totalVotes > 0 ? weightedAvg(stores).toFixed(1) : 'нет';

  const periodWord = period === 'daily' ? 'сегодня' : 'за неделю';
  const heading = period === 'daily'
    ? `<b>Ежедневный отчёт по QR-отзывам — ${escapeHtml(label)}</b>`
    : `<b>Отчёт за неделю — ${escapeHtml(label)}</b>`;

  const summary = [
    '<b>Сводка:</b>',
    `Всего отзывов: ${totalVotes} · средняя ${avg}`,
    `Магазинов с отзывами: ${withVotes} из ${totalStores} · без отзывов: ${totalStores - withVotes}`,
  ].join('\n');

  // Top-5 (global, count>0 only).
  const top = stores.filter((s) => s.count > 0).sort(byPerformance).slice(0, 5);
  const topTitle = period === 'daily' ? '🏆 <b>Топ-5 магазинов дня:</b>' : '🏆 <b>Топ-5 магазинов недели:</b>';
  const topSection = top.length === 0
    ? `🏆 Топ-5: отзывов ${periodWord} не поступало`
    : topTitle + '\n' + top.map((s, i) => `${i + 1}. ${escapeHtml(s.name)} — ${s.count} — ${s.avg.toFixed(1)}`).join('\n');

  // Group by TM (assigned only), order by block total desc.
  const tmNames = [...new Set(stores.filter((s) => s.tm).map((s) => s.tm as string))];
  const blocks = tmNames
    .map((tm) => ({ tm, stores: stores.filter((s) => s.tm === tm) }))
    .sort((a, b) => b.stores.reduce((n, s) => n + s.count, 0) - a.stores.reduce((n, s) => n + s.count, 0))
    .map((b) => tmBlock(b.tm, b.stores));

  // Unassigned footer — only when those stores actually have reviews.
  const unassigned = stores.filter((s) => !s.tm && s.count > 0);
  const footer = unassigned.length > 0
    ? `Без менеджера (${unassigned.map((s) => escapeHtml(s.name)).join(', ')}): ${unassigned.reduce((n, s) => n + s.count, 0)} отзывов`
    : null;

  // Sections that must never be split mid-way.
  const sections = [[heading, '', summary, '', topSection].join('\n'), ...blocks];
  if (footer) sections.push(footer);

  // Pack sections into ≤ SAFE_LIMIT messages on section boundaries.
  const messages: string[] = [];
  let current = '';
  for (const section of sections) {
    const next = current ? `${current}\n\n${section}` : section;
    if (next.length > SAFE_LIMIT && current) {
      messages.push(current);
      current = section;
    } else {
      current = next;
    }
  }
  if (current) messages.push(current);
  return messages.length === 1 ? messages[0] : messages;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run from `app/`: `npm test -- report-format`
Expected: PASS (all assertions, including the 60/12/43 reconciliation).

- [ ] **Step 5: Commit**

```bash
git add app/src/lib/report-format.ts app/src/lib/report-format.test.ts
git commit -m "feat(reports): pure TM-grouped report formatter (Top-5 + tables + universal line)"
```

---

## Task 7: Wire daily + weekly builders to the formatter

**Files:**
- Modify: `app/src/lib/report-builder.ts`

- [ ] **Step 1: Add a shared data-fetch helper**

In `app/src/lib/report-builder.ts`, add this near the top (after the imports),
and import the formatter. Add to the existing import block:

```ts
import { formatGroupedReport, type StoreStat } from './report-format';
```

Then add the helper:

```ts
// Fetch every active store with its TM, plus its vote count/avg in [start,end).
async function fetchStoreStats(start: Date, end: Date): Promise<StoreStat[]> {
  const [stores, feedbacks] = await Promise.all([
    prisma.store.findMany({
      where: { archivedAt: null },
      select: { id: true, name: true, territorialManager: true },
    }),
    prisma.feedback.findMany({
      where: { createdAt: { gte: start, lt: end }, ...VOTE_ROW_FILTER },
      select: { rating: true, storeId: true },
    }),
  ]);

  const byStore = new Map<string, number[]>();
  for (const fb of feedbacks) {
    if (!byStore.has(fb.storeId)) byStore.set(fb.storeId, []);
    byStore.get(fb.storeId)!.push(fb.rating);
  }

  return stores.map((s) => {
    const ratings = byStore.get(s.id) ?? [];
    const count = ratings.length;
    const avg = count > 0 ? ratings.reduce((a, b) => a + b, 0) / count : 0;
    return { name: s.name, tm: s.territorialManager, count, avg };
  });
}
```

- [ ] **Step 2: Replace the daily builder body**

Replace the entire body of `buildDailyReportMessage` (everything between the
function signature and its closing brace) with:

```ts
async function buildDailyReportMessage(ctx: ReportCtx): Promise<string | string[]> {
  const { start, end, label } = getDailyRange();
  reportLog('range_computed', { ...ctx, start: start.toISOString(), end: end.toISOString(), label });

  const stats = await fetchStoreStats(start, end);
  const totalVotes = stats.reduce((n, s) => n + s.count, 0);
  reportLog('data_fetched', {
    ...ctx,
    activeStores: stats.length,
    totalVotes,
    storesWithVotes: stats.filter((s) => s.count > 0).length,
  });

  return formatGroupedReport('daily', label, stats);
}
```

- [ ] **Step 3: Replace the weekly path in `buildReportMessage`**

In `buildReportMessage`, the `weekly` case currently shares code with `monthly`.
Split it: keep `monthly` on the old table renderer, route `weekly` through the
grouped formatter. Replace the section from `const range = period === 'weekly' …`
down to the final `return tableMessage;` with:

```ts
  if (period === 'weekly') {
    const { start, end, label } = getWeeklyRange();
    reportLog('range_computed', { ...ctx, start: start.toISOString(), end: end.toISOString(), label });
    const stats = await fetchStoreStats(start, end);
    reportLog('data_fetched', { ...ctx, activeStores: stats.length, totalVotes: stats.reduce((n, s) => n + s.count, 0) });
    const message = formatGroupedReport('weekly', label, stats);
    logMessageBuilt(ctx, message);
    return message;
  }

  // monthly (unchanged table format)
  const range = getMonthlyRange();
  const { start, end, label } = range;
  reportLog('range_computed', { ...ctx, start: start.toISOString(), end: end.toISOString(), label });

  const feedbacks = await prisma.feedback.findMany({
    where: { createdAt: { gte: start, lt: end }, ...VOTE_ROW_FILTER },
    include: { store: { select: { name: true } } },
  });
  reportLog('data_fetched', { ...ctx, feedbackRows: feedbacks.length });

  const heading = `Отчет за ${label}`;
```

> Note: this leaves the rest of the monthly code (the `byStore` map, `sortedRows`,
> the `<pre>` table build, and `return tableMessage`) intact below — only the
> `heading` ternary and the weekly branch change. The old daily-only multi-part
> splitting block inside `buildDailyReportMessage` is fully removed (splitting now
> lives in `report-format.ts`). The unused helpers `escapeHtml`/`truncateForTelegramLine`
> may remain (still used by the monthly path / send path) — leave them.

- [ ] **Step 4: Typecheck and run all unit tests**

Run from `app/`: `npx tsc --noEmit && npm test`
Expected: no type errors; all `manager-match` + `report-format` tests pass.

- [ ] **Step 5: Local smoke against a dev DB (if available)**

If a dev DB with seed data exists, hit the daily route locally:

Run from `app/`: `npm run dev` then in another shell
`curl -s -X POST -H "Authorization: Bearer $REPORTS_API_KEY" http://localhost:3000/api/reports/daily`
Expected: `{"ok":true,"sent":...}` and a structured `message_built` log line.
(If no dev DB/Telegram creds, skip — covered by Task 10 production verification.)

- [ ] **Step 6: Commit**

```bash
git add app/src/lib/report-builder.ts
git commit -m "feat(reports): daily + weekly use TM-grouped formatter"
```

---

## Task 8: Sync-then-report in the GitHub workflows

**Files:**
- Modify: `.github/workflows/daily-telegram-report.yml`
- Modify: `.github/workflows/weekly-telegram-report.yml`

- [ ] **Step 1: Add a sync step before the daily report step**

In `.github/workflows/daily-telegram-report.yml`, inside `jobs.send-report.steps`,
add this as the FIRST step (before `POST /api/reports/daily`):

```yaml
      - name: POST /api/admin/sync-managers (best-effort)
        continue-on-error: true
        run: |
          echo "[$(date -u +'%Y-%m-%d %H:%M:%S UTC')] sync managers"
          curl --fail-with-body -sS \
            --retry 2 --retry-delay 15 --retry-all-errors \
            --max-time 60 \
            -X POST \
            -H "Authorization: Bearer ${{ secrets.REPORTS_API_KEY }}" \
            https://web-production-370c1.up.railway.app/api/admin/sync-managers
          echo
```

- [ ] **Step 2: Add the same step to the weekly workflow**

Apply the identical first step to `.github/workflows/weekly-telegram-report.yml`
(before `POST /api/reports/weekly`).

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/daily-telegram-report.yml .github/workflows/weekly-telegram-report.yml
git commit -m "ci(reports): sync managers before sending daily/weekly report"
```

---

## Task 9: Service-account setup notes + project docs

**Files:**
- Modify: `CLAUDE.md` (Daily Telegram report section — add the sync dependency)
- Create: `docs/MANAGER_SYNC_SETUP.md`

- [ ] **Step 1: Write the setup doc**

Create `docs/MANAGER_SYNC_SETUP.md`:

```markdown
# Manager sync setup (Google service account)

The daily/weekly reports group stores by territorial manager. The mapping is
synced from the "Менеджеры" tab of the manager Google Sheet
(`1N7Ysr2C8ivoXAbU0fZc07_aDFAvDhny-M5Zg2yxDgkw`, gid 1105476357).

## One-time setup
1. Google Cloud Console → create a project (or reuse) → enable **Google Sheets API**.
2. Create a **service account**; create a JSON key for it.
3. Share the Google Sheet (read-only / Viewer) with the service account's email.
4. Put the JSON key (single line) in two places:
   - Railway → service `web` → Variables → `GOOGLE_SERVICE_ACCOUNT_JSON`.
   - GitHub repo secrets (already used by the report workflows) — not needed for
     the workflow itself (the workflow only calls the endpoint), so Railway alone
     is sufficient.
5. Redeploy: `cd app && railway up --service web`.

## How it runs
- The report workflows POST `/api/admin/sync-managers` first (best-effort), then
  POST the report. The endpoint reads the sheet, matches names, and writes
  `Store.territorialManager`.
- If the sheet is unreachable, the sync falls back to
  `app/data/manager-assignments.json` (committed snapshot) and logs
  `manager_sync_fallback`. The report still sends.

## When you reshuffle managers
Just edit the sheet. The next report (or a manual
`POST /api/admin/sync-managers`) picks it up — no redeploy.

## Adding a brand-new store
Assign it in the sheet. If a sheet store name doesn't match any DB store, the
sync logs it under `unmatched` and does NOT create a store. Add an alias in
`app/src/lib/manager-match.ts` if the spelling differs.
```

- [ ] **Step 2: Add a pointer in CLAUDE.md**

In `CLAUDE.md`, under the "## Daily Telegram report" section, append:

```markdown

The report is now grouped by territorial manager. The store→TM mapping is synced
from a Google Sheet before each report via `POST /api/admin/sync-managers`
(see `docs/MANAGER_SYNC_SETUP.md`). Mapping changes need only a sheet edit, no
redeploy. Fallback snapshot: `app/data/manager-assignments.json`.
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md docs/MANAGER_SYNC_SETUP.md
git commit -m "docs: manager-sync setup + CLAUDE.md pointer"
```

---

## Task 10: Production deploy + behavioral verification

**Files:** none (operational)

- [ ] **Step 1: Confirm the service-account env is set**

Confirm with the product owner that `GOOGLE_SERVICE_ACCOUNT_JSON` is set in
Railway and the sheet is shared with the service-account email
(per `docs/MANAGER_SYNC_SETUP.md`). If not yet done, this step blocks — the sync
will use the committed fallback until it's set (report still works).

- [ ] **Step 2: Deploy to Railway**

Run from `app/`: `railway up --service web`
Expected: build succeeds; `prisma migrate deploy` applies
`add_store_territorial_manager`; healthcheck passes.

- [ ] **Step 3: Run the sync, read the log trace**

Run: `curl -s -X POST -H "Authorization: Bearer $REPORTS_API_KEY" https://web-production-370c1.up.railway.app/api/admin/sync-managers`
Expected JSON: `{"ok":true,"used":"live","matched":41,"unmatched":[],"cleared":2}`.
Check Railway logs for `manager_sync_done` with `matched:41`, `cleared:2`,
`unmatched:[]`. If `used:"fallback"`, the service account isn't reachable — fix
env/sharing before continuing.

- [ ] **Step 4: Trigger the daily report and capture proof**

Run: `curl -s -X POST -H "Authorization: Bearer $REPORTS_API_KEY" https://web-production-370c1.up.railway.app/api/reports/daily`
Then:
- Open the Telegram group and **screenshot** the delivered message.
- Confirm on the screenshot: the 4 manager blocks render, the `<pre>` tables are
  column-aligned on mobile, the Top-5 is correct, and each block ends with the
  universal line.
- Grep Railway logs for the report's `message_built` line.

Paste the screenshot + the `manager_sync_done` and `message_built` log lines into
the final report as behavioral proof. Do not call the work done without them.

- [ ] **Step 5: Final commit / wrap**

If any alias gaps surfaced in Step 3 (`unmatched` non-empty), add them to
`NORMALIZED_ALIASES` in `manager-match.ts`, re-run Task 6 tests, redeploy, and
re-verify until `matched:41, unmatched:[]`.

---

## Self-review notes (coverage check)

- Spec §3 storage + sync → Tasks 1, 4, 5; §3 ordering → Task 8; §3.3 fallback → Task 4.
- Spec §4 matching + 41/41 + no-dupe + update-only → Task 3 (guards) + Task 4 (transaction) + Task 10 (verify).
- Spec §5 daily format (summary 43, Top-5, tables, Молчат, universal line, empty-day, footer) → Task 6 tests + impl.
- Spec §6 weekly (shared helper, group by id) → Tasks 6, 7.
- Spec §8 universal line → Task 6 `universalLine`.
- Spec §7 edge cases (inactive TM shown, unassigned counted-not-blocked) → Task 6 (TM grouping is data-driven; inactive TM still has stores → still a block) + footer test.
- Spec §10 verification (screenshot + logs) → Task 10.
```
