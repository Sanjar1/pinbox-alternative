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
  it('renders every silent store as its own 0 / — row, plus the universal line', () => {
    // Silent stores now appear as explicit rows (0 count, "—" score), not a
    // compressed "Молчат:" line.
    expect(text).not.toContain('Молчат:');
    expect(text).toMatch(/Бухара\s+0\s+—/);
    expect(text).toMatch(/Янгиюль\s+0\s+—/);
    expect(text).toContain('8 из 11 магазинов молчат — продавцы не просят оценить. Нет голоса = нет работы с клиентом.');
  });
  it('unassigned silent stores stay visible in the "Без менеджера, молчат" footer', () => {
    expect(text).toContain('Без менеджера, молчат: Катортол, Чилонзор Торговый');
  });
});

describe('formatGroupedReport edge cases', () => {
  it('fully covered block shows the ✅ line', () => {
    const out = formatGroupedReport('daily', 'x', [
      { name: 'A', tm: 'TM1', count: 2, avg: 5 },
      { name: 'B', tm: 'TM1', count: 1, avg: 4 },
    ]);
    const text = Array.isArray(out) ? out.join('\n') : out;
    expect(text).toContain('Все магазины с отзывами ✅');
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
