export type Platform = 'GOOGLE' | 'YANDEX' | 'TWOGIS';

const URL_PATTERNS: Record<Platform, RegExp[]> = {
  GOOGLE: [/google\./i, /g\.page/i, /maps\.app\.goo\.gl/i],
  YANDEX: [/yandex\./i],
  TWOGIS: [/2gis\./i],
};

const DIRECT_URL_PATTERNS: Record<Platform, RegExp[]> = {
  GOOGLE: [
    /google\.[^/]+\/maps\/place\//i,
    /google\.[^/]+\/maps\?.*(cid=|ftid=|q=place_id:)/i,
    /maps\.app\.goo\.gl/i,
    /g\.page/i,
  ],
  YANDEX: [/yandex\.[^/]+\/maps\/org\//i, /yandex\.[^/]+\/org\//i],
  TWOGIS: [/2gis\.[^/]+\/[^?]*\/firm\//i],
};

export type StoreInput = {
  name: string;
  address: string;
  googleUrl: string;
  yandexUrl: string;
  twogisUrl: string;
};

export function toCleanString(value: FormDataEntryValue | null): string {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isValidPlatformUrl(platform: Platform, value: string): boolean {
  if (!value) {
    return true;
  }
  if (!isHttpUrl(value)) {
    return false;
  }
  return URL_PATTERNS[platform].some((pattern) => pattern.test(value));
}

export function isDirectPlatformLocationUrl(platform: Platform, value: string): boolean {
  if (!value) {
    return true;
  }
  if (!isValidPlatformUrl(platform, value)) {
    return false;
  }
  return DIRECT_URL_PATTERNS[platform].some((pattern) => pattern.test(value));
}

export function validateStoreInput(input: StoreInput): string | null {
  if (!input.name || input.name.length < 2 || input.name.length > 120) {
    return 'Store name must be between 2 and 120 characters';
  }
  if (input.address.length > 255) {
    return 'Address is too long';
  }
  if (!isDirectPlatformLocationUrl('GOOGLE', input.googleUrl)) {
    return 'Google URL must be a direct place/card link';
  }
  if (!isDirectPlatformLocationUrl('YANDEX', input.yandexUrl)) {
    return 'Yandex URL must be a direct org/card link';
  }
  if (!isDirectPlatformLocationUrl('TWOGIS', input.twogisUrl)) {
    return '2GIS URL must be a direct firm/card link';
  }
  return null;
}

export type FeedbackInput = {
  storeId: string;
  rating: number;
  comment: string;
  contact: string;
};

export function validateFeedbackInput(input: FeedbackInput): string | null {
  if (!input.storeId) {
    return 'Invalid store';
  }
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    return 'Rating must be between 1 and 5';
  }
  if (input.comment.length > 1000) {
    return 'Comment is too long';
  }
  if (input.contact.length > 200) {
    return 'Contact is too long';
  }
  return null;
}

type CsvRow = Record<string, string>;

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }

  values.push(current.trim());
  return values.map((value) => value.replace(/^"(.*)"$/, '$1').trim());
}

export function parseCsv(text: string): CsvRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    return [];
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const values = parseCsvLine(lines[i]);
    const row: CsvRow = {};
    headers.forEach((header, index) => {
      row[header] = (values[index] || '').trim();
    });
    rows.push(row);
  }

  return rows;
}
