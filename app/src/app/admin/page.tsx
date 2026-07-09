import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireCurrentUser } from '@/lib/auth';
import { storeWhereForUser } from '@/lib/store-access';
import { VOTE_ROW_FILTER } from '@/lib/feedback-filters';
import { parseRatingsBreakdown } from '@/lib/notifications';
import { buildTrendSeries, type DashboardPeriod } from '@/lib/dashboard-trends';
import { resolveDashboardRange } from '@/lib/dashboard-range';
import { MetricCardsWithTrends } from './metric-cards-with-trends';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const periodLabels: Record<DashboardPeriod, string> = {
  daily: 'Сегодня',
  weekly: 'Эта неделя',
  monthly: 'Этот месяц',
  yearly: 'Этот год',
};

function formatDateTime(date: Date): string {
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tashkent',
  });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Tashkent',
  });
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'RESOLVED':
      return 'bg-blue-50 text-blue-700 ring-blue-100';
    case 'ARCHIVED':
      return 'bg-slate-100 text-slate-600 ring-slate-200';
    default:
      return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
  }
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const params = searchParams ? await searchParams : {};
  const range = resolveDashboardRange(params);
  const period = range.period;
  const generatedAt = new Date();

  console.log(
    `[admin-dashboard] START render custom=${range.isCustom} period=${range.period} ` +
      `from=${range.from ?? '-'} to=${range.to ?? '-'}`,
  );
  console.log(
    `[admin-dashboard] range resolved bucketMode=${range.bucketMode} ` +
      `start=${range.start.toISOString()} end=${range.end.toISOString()} label="${range.label}"`,
  );

  const user = await requireCurrentUser();
  const storeWhere = storeWhereForUser(user);
  const feedbackPeriodWhere = { createdAt: { gte: range.start, lt: range.end } };
  const voteCountWhere = { ...feedbackPeriodWhere, ...VOTE_ROW_FILTER };

  const stores = await prisma.store.findMany({
    where: storeWhere,
    select: {
      id: true,
      name: true,
      qrCodes: { select: { scans: true } },
      feedbacks: {
        where: voteCountWhere,
        select: { rating: true, createdAt: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  const latestFeedback = await prisma.feedback.findMany({
    where: {
      store: storeWhere,
      ...feedbackPeriodWhere,
      ...VOTE_ROW_FILTER,
    },
    select: {
      id: true,
      rating: true,
      comment: true,
      contact: true,
      status: true,
      createdAt: true,
      store: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const totalStores = stores.length;
  const totalScans = stores.reduce(
    (sum, store) => sum + store.qrCodes.reduce((qrSum, qr) => qrSum + qr.scans, 0),
    0,
  );
  const totalVotes = stores.reduce((sum, store) => sum + store.feedbacks.length, 0);
  const avgRating = totalVotes === 0
    ? 0
    : stores.reduce(
        (sum, store) => sum + store.feedbacks.reduce((ratingSum, feedback) => ratingSum + feedback.rating, 0),
        0,
      ) / totalVotes;
  const zeroVoteStores = stores.filter((store) => store.feedbacks.length === 0).length;
  const trends = buildTrendSeries(range.bucketMode, range.start, range.end, stores);

  console.log(
    `[admin-dashboard] END render stores=${totalStores} votes=${totalVotes} ` +
      `avgRating=${avgRating.toFixed(2)} zeroVoteStores=${zeroVoteStores} latest=${latestFeedback.length}`,
  );

  const storeRows = stores
    .map((store) => {
      const votes = store.feedbacks.length;
      const storeAvgRating = votes === 0
        ? 0
        : store.feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0) / votes;
      const scans = store.qrCodes.reduce((sum, qr) => sum + qr.scans, 0);
      const latestFeedbackDate = votes === 0
        ? null
        : store.feedbacks.reduce(
            (latest, feedback) => (feedback.createdAt > latest ? feedback.createdAt : latest),
            store.feedbacks[0].createdAt,
          );

      return {
        id: store.id,
        name: store.name,
        votes,
        avgRating: storeAvgRating,
        scans,
        latestFeedbackDate,
      };
    })
    .sort((a, b) => {
      if (b.votes !== a.votes) return b.votes - a.votes;
      if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
              Аналитика голосования
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-950">
              Дашборд голосования
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Период: {range.periodLabel} ({range.label}). Обновлено: {formatDateTime(generatedAt)} (Ташкент).
            </p>
          </div>
          <div className="flex flex-col gap-3 lg:items-end">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(periodLabels) as DashboardPeriod[]).map((key) => (
                <Link
                  key={key}
                  href={`/admin?period=${key}`}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    !range.isCustom && key === period
                      ? 'bg-slate-950 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {periodLabels[key]}
                </Link>
              ))}
            </div>
            <form method="get" action="/admin" className="flex flex-wrap items-end gap-2">
              <label className="flex flex-col text-xs font-semibold text-slate-500">
                С даты
                <input
                  type="date"
                  name="from"
                  defaultValue={range.from ?? ''}
                  className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
              </label>
              <label className="flex flex-col text-xs font-semibold text-slate-500">
                По дату
                <input
                  type="date"
                  name="to"
                  defaultValue={range.to ?? ''}
                  className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
              </label>
              <button
                type="submit"
                className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
              >
                Показать
              </button>
              {range.isCustom && (
                <Link
                  href="/admin?period=daily"
                  className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  Сбросить
                </Link>
              )}
            </form>
            <p className="text-[11px] text-slate-400 lg:text-right">
              Выберите одну дату или диапазон, затем нажмите «Показать».
            </p>
          </div>
        </div>
      </header>

      <MetricCardsWithTrends
        periodLabel={periodLabels[period]}
        totalStores={totalStores}
        totalVotes={totalVotes}
        avgRating={avgRating}
        zeroVoteStores={zeroVoteStores}
        totalScans={totalScans}
        trends={trends}
      />

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <h3 className="text-xl font-bold text-slate-950">Магазины</h3>
          <p className="mt-1 text-sm text-slate-500">
            Отсортировано по голосам, затем по рейтингу. Магазины без голосов остаются видны.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">#</th>
                <th className="px-5 py-3">Магазин</th>
                <th className="px-5 py-3 text-right">Голосов</th>
                <th className="px-5 py-3 text-right">Средняя</th>
                <th className="px-5 py-3 text-right">Сканов</th>
                <th className="px-5 py-3 text-right">Последний голос</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {storeRows.map((row, index) => (
                <tr key={row.id} className={row.votes === 0 ? 'bg-slate-50/60 text-slate-500' : 'text-slate-800'}>
                  <td className="px-5 py-4">{index + 1}</td>
                  <td className="px-5 py-4 font-semibold text-slate-900">{row.name}</td>
                  <td className="px-5 py-4 text-right">
                    {row.votes === 0 ? (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                        0 голосов
                      </span>
                    ) : (
                      row.votes
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">{row.votes === 0 ? '-' : row.avgRating.toFixed(1)}</td>
                  <td className="px-5 py-4 text-right">{row.scans}</td>
                  <td className="px-5 py-4 text-right">
                    {row.latestFeedbackDate ? formatDate(row.latestFeedbackDate) : '-'}
                  </td>
                </tr>
              ))}
              {storeRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    Магазинов не найдено.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <h3 className="text-xl font-bold text-slate-950">Последние голоса</h3>
          <p className="mt-1 text-sm text-slate-500">Последние голоса за выбранный период.</p>
        </div>
        {latestFeedback.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            Голосов за этот период нет.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {latestFeedback.map((feedback) => (
              <article key={feedback.id} className="grid gap-4 p-6 lg:grid-cols-[180px_1fr_auto]">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    {formatDateTime(feedback.createdAt)}
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">{feedback.store.name}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-600">Оценка {feedback.rating}/5</p>
                  {(() => {
                    const breakdown = parseRatingsBreakdown(feedback.comment ?? '');
                    return breakdown ? (
                      <p className="mt-1 text-sm text-slate-700">
                        Сервис {breakdown.service}/5 · Качество {breakdown.quality}/5 · Цены {breakdown.prices}/5
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-slate-700">
                        {feedback.comment || 'Комментария нет.'}
                      </p>
                    );
                  })()}
                  {feedback.contact && (
                    <p className="mt-2 text-xs text-slate-500">Контакт: {feedback.contact}</p>
                  )}
                </div>
                <div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusBadgeClass(feedback.status)}`}>
                    {feedback.status}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
