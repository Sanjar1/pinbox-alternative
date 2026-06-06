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
