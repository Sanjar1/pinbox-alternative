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

// One monospace row: "<name padded>  <count>  <avg>". Stores with no reviews
// show a 0 count and a "—" score so the whole TM roster is visible.
const NAME_W = 18;
function tableRow(s: StoreStat): string {
  const name = s.name.length > NAME_W ? s.name.slice(0, NAME_W - 1) + '…' : s.name.padEnd(NAME_W);
  const score = s.count === 0 ? '—' : s.avg.toFixed(1);
  return `${escapeHtml(name)}${String(s.count).padStart(4)}   ${score}`;
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
  const avg = total > 0 ? weightedAvg(stores).toFixed(1) : '—';
  const withReviews = stores.filter((s) => s.count > 0).sort(byPerformance);
  const silent = stores.filter((s) => s.count === 0).sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  // Every store gets a row: reviewed stores first (by performance), then the
  // silent ones (0 count, "—" score) so the full TM roster is always visible.
  const ordered = [...withReviews, ...silent];

  const lines: string[] = [`👤 <b>${escapeHtml(tm)}</b> — ${total} отзывов · средняя ${avg}`];
  lines.push('<pre>' + ordered.map(tableRow).join('\n') + '</pre>');
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
