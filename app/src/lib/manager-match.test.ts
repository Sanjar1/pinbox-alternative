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

  it('full real dataset → 41/41, no unmatched, no dupes', () => {
    const DB_FULL = [
      'Аския', 'Чирчик', 'ЭКО', 'Чорсу', 'Авайхон', 'Глоток Панельный', 'Навруз',
      'Сергели оптом', 'Фергана', 'Цум', 'Ялангач', 'Янги Хаёт', 'Food city',
      'Авиасозлар', 'Бектемир', 'Буз бозор', 'Бухара', 'Газалкент',
      'Глоток Юнусабад', 'Госпитальный', 'Дубовый', 'Кадышева', 'Катортол',
      'Келес', 'Корасув', 'Метро Чиланзар', 'Олой', 'Панельный', 'Паркентский',
      'Рисовый', 'Сайрам', 'Самарканд', 'Тансикбаев', 'Торговый Центр', 'ТТЗ',
      'Урикзор', 'Учтепа', 'Фарход', 'Хасанбой', 'Чилонзор 21',
      'Чилонзор Торговый', 'Юнусабад', 'Янгиюль',
    ].map((name, i) => ({ id: `db-${i}`, name }));

    const SHEET_FULL: Array<[string, string, string]> = [
      // Абдухамитова Арофат (11)
      ['Лавка Юнусобод', 'MANAGER', 'Абдухамитова Арофат'],
      ['Лавка Навруз', 'MANAGER', 'Абдухамитова Арофат'],
      ['Лавка Чирчик', 'MANAGER', 'Абдухамитова Арофат'],
      ['Лавка Госпитальный', 'MANAGER', 'Абдухамитова Арофат'],
      ['Лавка ТТЗ', 'MANAGER', 'Абдухамитова Арофат'],
      ['Лавка Корасув', 'MANAGER', 'Абдухамитова Арофат'],
      ['Лавка Сайрам', 'MANAGER', 'Абдухамитова Арофат'],
      ['Лавка Газалкент', 'MANAGER', 'Абдухамитова Арофат'],
      ['Лавка Хасанбой', 'MANAGER', 'Абдухамитова Арофат'],
      ['Лавка Самарканд', 'MANAGER', 'Абдухамитова Арофат'],
      ['Глоток Юнусабад', 'MANAGER', 'Абдухамитова Арофат'],
      // Хасанов Даврон (11)
      ['Лавка Аския', 'MANAGER', 'Хасанов Даврон'],
      ['Лавка Янги хает', 'MANAGER', 'Хасанов Даврон'],
      ['Лавка Учтепа', 'MANAGER', 'Хасанов Даврон'],
      ['Лавка Чорсу', 'MANAGER', 'Хасанов Даврон'],
      ['Лавка Тансикбоев', 'MANAGER', 'Хасанов Даврон'],
      ['Лавка Фарход', 'MANAGER', 'Хасанов Даврон'],
      ['Лавка Торговый Центр', 'MANAGER', 'Хасанов Даврон'],
      ['Лавка Янгиюль', 'MANAGER', 'Хасанов Даврон'],
      ['Ruba Бухара', 'MANAGER', 'Хасанов Даврон'],
      ['Ruba Урикзор', 'MANAGER', 'Хасанов Даврон'],
      ['Лавка Келес', 'MANAGER', 'Хасанов Даврон'],
      // Юсупова Дурдона (9)
      ['Лавка Авиасозлар', 'MANAGER', 'Юсупова Дурдона'],
      ['Лавка Олой', 'MANAGER', 'Юсупова Дурдона'],
      ['Лавка Кадышева', 'MANAGER', 'Юсупова Дурдона'],
      ['Лавка Бектемир', 'MANAGER', 'Юсупова Дурдона'],
      ['Лавка Паркентский', 'MANAGER', 'Юсупова Дурдона'],
      ['Лавка Фуд сити', 'MANAGER', 'Юсупова Дурдона'],
      ['Ruba Сергели Оптом', 'MANAGER', 'Юсупова Дурдона'],
      ['Лавка ЦУМ', 'MANAGER', 'Юсупова Дурдона'],
      ['Лавка Дубовый', 'MANAGER', 'Юсупова Дурдона'],
      // Музаффаров Фазлиддин (10)
      ['Лавка Буз Базар', 'MANAGER', 'Музаффаров Фазлиддин'],
      ['Лавка Чилонзор 21', 'MANAGER', 'Музаффаров Фазлиддин'],
      ['Лавка Ялангоч', 'MANAGER', 'Музаффаров Фазлиддин'],
      ['Лавка Эко ', 'MANAGER', 'Музаффаров Фазлиддин'],
      ['Лавка Фаргона', 'MANAGER', 'Музаффаров Фазлиддин'],
      ['Лавка Рисовый', 'MANAGER', 'Музаффаров Фазлиддин'],
      ['Лавка Чилонзор Метро', 'MANAGER', 'Музаффаров Фазлиддин'],
      ['Лавка Панелный', 'MANAGER', 'Музаффаров Фазлиддин'],
      ['Лавка Авайхон', 'MANAGER', 'Музаффаров Фазлиддин'],
      ['Глоток Панелный', 'MANAGER', 'Музаффаров Фазлиддин'],
    ];

    const r = resolveAssignments(SHEET_FULL, DB_FULL);

    // HARD REQUIREMENT: every one of the 41 sheet rows matches a DB store.
    expect(r.unmatched).toEqual([]);
    expect(r.duplicateTargets).toEqual([]);
    expect(r.assignments.size).toBe(41);

    // Tally assignments per TM by iterating values (Map is storeId → tmName).
    const perTm = new Map<string, number>();
    for (const tm of r.assignments.values()) {
      perTm.set(tm, (perTm.get(tm) ?? 0) + 1);
    }
    expect(perTm.get('Абдухамитова Арофат')).toBe(11);
    expect(perTm.get('Хасанов Даврон')).toBe(11);
    expect(perTm.get('Юсупова Дурдона')).toBe(9);
    expect(perTm.get('Музаффаров Фазлиддин')).toBe(10);

    // CRITICAL: Глоток Юнусабад and plain Юнусабад resolve to DIFFERENT ids,
    // both assigned to Абдухамитова Арофат (proves no collision).
    const glotok = DB_FULL.find((s) => s.name === 'Глоток Юнусабад')!;
    const plain = DB_FULL.find((s) => s.name === 'Юнусабад')!;
    expect(glotok.id).not.toBe(plain.id);
    expect(r.assignments.get(glotok.id)).toBe('Абдухамитова Арофат');
    expect(r.assignments.get(plain.id)).toBe('Абдухамитова Арофат');
  });
});
