export const BRANDS_DATA = {
  kaas: {
    id: 'kaas',
    primary: '#F46F00',
    votingPrimary: '#F46F00',
    dark: '#323136',
    light: '#FEFEFE',
    votingLight: '#FDF5ED',
    votingBorder: '#F1DDC3',
    title: 'KAAS',
    sub: 'KAAS \u0421\u044b\u0440\u043d\u0430\u044f \u041b\u0430\u0432\u043a\u0430',
  },
  glotok: {
    id: 'glotok',
    primary: '#C92121',
    votingPrimary: '#C92121',
    dark: '#871313',
    light: '#FFF5F5',
    votingLight: '#FCF2F2',
    votingBorder: '#F3DADA',
    title: 'GLOTOK',
    sub: 'GLOTOK',
  },
  ruba: {
    id: 'ruba',
    primary: '#1D6FA8',
    votingPrimary: '#1352A8',
    dark: '#0F2D3F',
    light: '#F0F8FF',
    votingLight: '#F1F5FC',
    votingBorder: '#CFDCF1',
    title: 'RUBA',
    sub: 'RUBA',
  },
};

/**
 * Shared brand detection logic usable in both React and Node.js scripts.
 */
export function getBrandIdByStoreName(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('ruba')) return 'ruba';
  if (n.includes('\u0433\u043b\u043e\u0442\u043e\u043a') || n.includes('glotok')) return 'glotok';

  // Specific locations known to be RUBA
  const rubaLocations = [
    '\u0443\u0440\u0438\u043a\u0437\u043e\u0440',
    '\u0441\u0435\u0440\u0433\u0435\u043b\u0438 \u043e\u043f\u0442\u043e\u043c',
    '\u0431\u0443\u0445\u0430\u0440\u0430',
  ];
  if (rubaLocations.some((loc) => n.includes(loc))) return 'ruba';

  return 'kaas';
}

export function getStoreDisplayName(name, brandId) {
  const trimmed = (name || '').trim();
  if (!trimmed) return 'Store';

  let display = trimmed
    .replace(/^lavka\s+/i, '')
    .replace(/^ruba\s+/i, '')
    .replace(/^glotok\s+/i, '')
    .replace(/^\u043b\u0430\u0432\u043a\u0430\s+/i, '')
    .replace(/^\u0433\u043b\u043e\u0442\u043e\u043a\s+/i, '')
    .trim();

  return display || trimmed;
}

export function getVotingTitle(brand, storeName) {
  return `${brand.sub} ${getStoreDisplayName(storeName, brand.id).toLocaleUpperCase('ru-RU')}`;
}
