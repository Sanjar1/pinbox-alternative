import overrides from './store-link-overrides.generated.json';
import { isDirectPlatformLocationUrl } from './validation';

type OverrideRow = {
  internalId: string;
  yandexUrl?: string;
  twogisUrl?: string;
  googleUrl?: string;
};

type OverrideLinks = {
  YANDEX?: string;
  TWOGIS?: string;
  GOOGLE?: string;
};

const rows = overrides as OverrideRow[];

function normalizeStoreKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/['"`,.()\-–—]/g, ' ')
    .replace(/\b(сырная|сырный|лавка|домик|магазин)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildAliases(internalId: string): string[] {
  const raw = internalId.trim();
  const aliasSet = new Set<string>();

  if (!raw) {
    return [];
  }

  aliasSet.add(raw);
  aliasSet.add(raw.replace(/^лавка\s+/i, ''));
  aliasSet.add(raw.replace(/^сырная\s+лавка\s+/i, ''));
  aliasSet.add(raw.replace(/^сырный\s+домик\s+/i, ''));

  return [...aliasSet]
    .map((alias) => normalizeStoreKey(alias))
    .filter((alias) => alias.length > 0);
}

const linksByStoreKey = new Map<string, OverrideLinks>();

for (const row of rows) {
  const links: OverrideLinks = {};
  if (row.yandexUrl && isDirectPlatformLocationUrl('YANDEX', row.yandexUrl)) {
    links.YANDEX = row.yandexUrl;
  }
  if (row.twogisUrl && isDirectPlatformLocationUrl('TWOGIS', row.twogisUrl)) {
    links.TWOGIS = row.twogisUrl;
  }
  if (row.googleUrl && isDirectPlatformLocationUrl('GOOGLE', row.googleUrl)) {
    links.GOOGLE = row.googleUrl;
  }

  if (Object.keys(links).length === 0) {
    continue;
  }

  for (const key of buildAliases(row.internalId)) {
    const current = linksByStoreKey.get(key) ?? {};
    linksByStoreKey.set(key, {
      YANDEX: current.YANDEX ?? links.YANDEX,
      TWOGIS: current.TWOGIS ?? links.TWOGIS,
      GOOGLE: current.GOOGLE ?? links.GOOGLE,
    });
  }
}

export function getStoreLinkOverrides(storeName: string): OverrideLinks | null {
  const key = normalizeStoreKey(storeName);
  if (!key) {
    return null;
  }
  return linksByStoreKey.get(key) ?? null;
}

