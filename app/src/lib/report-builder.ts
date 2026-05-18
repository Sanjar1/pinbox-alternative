import { prisma } from './db';

const TASHKENT_MS = 5 * 60 * 60 * 1000; // UTC+5

function nowTashkent(): Date {
  return new Date(Date.now() + TASHKENT_MS);
}

function toUtc(tashkentDate: Date): Date {
  return new Date(tashkentDate.getTime() - TASHKENT_MS);
}

type DateRange = { start: Date; end: Date; label: string };

export function getDailyRange(): DateRange {
  const t = nowTashkent();
  const startT = new Date(t);
  startT.setUTCHours(0, 0, 0, 0);
  const day = t.getUTCDate();
  const month = t.toLocaleString('ru-RU', { month: 'long', timeZone: 'UTC' });
  return { start: toUtc(startT), end: new Date(), label: `${day} ${month} ${t.getUTCFullYear()}` };
}

export function getWeeklyRange(): DateRange {
  const t = nowTashkent();
  const todayT = new Date(t);
  todayT.setUTCHours(0, 0, 0, 0);
  const startT = new Date(todayT);
  startT.setUTCDate(startT.getUTCDate() - 7);
  const sd = startT.getUTCDate();
  const ed = todayT.getUTCDate() - 1;
  const sm = startT.toLocaleString('ru-RU', { month: 'long', timeZone: 'UTC' });
  const em = new Date(todayT.getTime() - 86400000).toLocaleString('ru-RU', { month: 'long', timeZone: 'UTC' });
  const label = sm === em ? `${sd}-${ed} ${sm} ${t.getUTCFullYear()}` : `${sd} ${sm} - ${ed} ${em} ${t.getUTCFullYear()}`;
  return { start: toUtc(startT), end: new Date(), label };
}

export function getMonthlyRange(): DateRange {
  const t = nowTashkent();
  const firstThisT = new Date(t);
  firstThisT.setUTCDate(1);
  firstThisT.setUTCHours(0, 0, 0, 0);
  const startT = new Date(firstThisT);
  startT.setUTCMonth(startT.getUTCMonth() - 1);
  const name = startT.toLocaleString('ru-RU', { month: 'long', timeZone: 'UTC' });
  const label = name.charAt(0).toUpperCase() + name.slice(1) + ' ' + startT.getUTCFullYear();
  return { start: toUtc(startT), end: toUtc(firstThisT), label };
}

export async function buildReportMessage(period: 'daily' | 'weekly' | 'monthly'): Promise<string> {
  const range = period === 'daily' ? getDailyRange() : period === 'weekly' ? getWeeklyRange() : getMonthlyRange();
  const { start, end, label } = range;

  const feedbacks = await prisma.feedback.findMany({
    where: { createdAt: { gte: start, lt: end } },
    include: { store: { select: { name: true } } },
  });

  const heading = period === 'daily'
    ? `Отчет за сегодня - ${label}`
    : period === 'weekly'
      ? `Отчет за неделю - ${label}`
      : `Отчет за ${label}`;

  if (feedbacks.length === 0) {
    return `<b>${heading}</b>\n\nОтзывов за этот период не поступало.`;
  }

  const byStore = new Map<string, number[]>();
  for (const feedback of feedbacks) {
    const name = feedback.store.name;
    if (!byStore.has(name)) byStore.set(name, []);
    byStore.get(name)!.push(feedback.rating);
  }

  const rows = Array.from(byStore.entries())
    .map(([name, ratings]) => ({
      name,
      count: ratings.length,
      avg: ratings.reduce((a, b) => a + b, 0) / ratings.length,
    }))
    .sort((a, b) => {
      // Business priority: more votes first, then higher average score.
      if (b.count !== a.count) return b.count - a.count;
      return b.avg - a.avg;
    });

  const totalReviews = rows.reduce((sum, row) => sum + row.count, 0);
  const nameWidth = 23;

  const lines = rows.map((row) => {
    const name = row.name.length > nameWidth ? row.name.slice(0, nameWidth - 1) + '...' : row.name.padEnd(nameWidth);
    const count = String(row.count).padStart(5);
    const avg = `* ${row.avg.toFixed(1)}`;
    return `${name}${count}   ${avg}`;
  });

  const divider = '-'.repeat(nameWidth + 12);
  const header = `${'Магазин'.padEnd(nameWidth)}${'Шт.'.padStart(5)}   Рейтинг`;
  const table = [header, divider, ...lines, divider, `Итого: ${totalReviews} отзывов по ${rows.length} магазинам`].join('\n');

  return `<b>${heading}</b>\n\n<pre>${table}</pre>`;
}

export async function sendTelegramReport(message: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) throw new Error('TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured');

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Telegram error ${res.status}: ${body}`);
  }
}

export function checkApiKey(req: Request): boolean {
  const key = process.env.REPORTS_API_KEY;
  if (!key) return false;
  const auth = req.headers.get('authorization') ?? '';
  return auth === `Bearer ${key}`;
}
