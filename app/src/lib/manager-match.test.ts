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
