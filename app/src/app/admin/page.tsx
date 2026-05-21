import { prisma } from '@/lib/db';
import { requireCurrentUser } from '@/lib/auth';
import { storeWhereForUser } from '@/lib/store-access';

type DashboardPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const TASHKENT_MS = 5 * 60 * 60 * 1000;

const periodLabels: Record<DashboardPeriod, string> = {
  daily: 'Сегодня',
  weekly: 'Эта неделя',
  monthly: 'Этот месяц',
  yearly: 'Этот год',
};

function nowTashkent(): Date {
  return new Date(Date.now() + TASHKENT_MS);
}

function toUtc(tashkentDate: Date): Date {
  return new Date(tashkentDate.getTime() - TASHKENT_MS);
}

function getPeriodRange(period: DashboardPeriod): { start: Date; end: Date; label: string } {
  const t = nowTashkent();
  const startT = new Date(t);
  startT.setUTCHours(0, 0, 0, 0);

  if (period === 'weekly') {
    startT.setUTCDate(startT.getUTCDate() - 6);
  }

  if (period === 'monthly') {
    startT.setUTCDate(1);
  }

  if (period === 'yearly') {
    startT.setUTCMonth(0, 1);
  }

  const label = period === 'daily'
    ? t.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
    : `${startT.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })} - ${t.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })}`;

  return { start: toUtc(startT), end: new Date(), label };
}

function normalizePeriod(value: string | string[] | undefined): DashboardPeriod {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === 'weekly' || raw === 'monthly' || raw === 'yearly' ? raw : 'daily';
}

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
  const period = normalizePeriod(params.period);
  const range = getPeriodRange(period);
  const generatedAt = new Date();

  const user = await requireCurrentUser();
  const storeWhere = storeWhereForUser(user);
  const feedbackPeriodWhere = { createdAt: { gte: range.start, lt: range.end } };

  const stores = await prisma.store.findMany({
    where: storeWhere,
    select: {
      id: true,
      name: true,
      qrCodes: { select: { scans: true } },
      feedbacks: {
        where: feedbackPeriodWhere,
        select: { rating: true, createdAt: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  const latestFeedback = await prisma.feedback.findMany({
    where: {
      store: storeWhere,
      ...feedbackPeriodWhere,
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
              Период: {periodLabels[period]} ({range.label}). Обновлено: {formatDateTime(generatedAt)} (Ташкент).
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(periodLabels) as DashboardPeriod[]).map((key) => (
              <a
                key={key}
                href={`/admin?period=${key}`}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  key === period
                    ? 'bg-slate-950 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {periodLabels[key]}
              </a>
            ))}
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Всего магазинов" value={String(totalStores)} note="Активные магазины в данном разрезе" />
        <MetricCard label={`${periodLabels[period]} — голосов`} value={String(totalVotes)} note="Голосов получено за период" />
        <MetricCard label="Средняя оценка" value={totalVotes === 0 ? '-' : avgRating.toFixed(1)} note="За выбранный период" />
        <MetricCard label="Магазины без голосов" value={String(zeroVoteStores)} note="Видны в таблице ниже" />
        <MetricCard label="Сканов QR" value={String(totalScans)} note="Всего за всё время (история сканов не датируется)" />
      </section>

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
                  <p className="mt-1 text-sm text-slate-700">
                    {feedback.comment || 'Комментария нет.'}
                  </p>
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

function MetricCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold text-slate-950">{value}</p>
      <p className="mt-2 text-xs text-slate-400">{note}</p>
    </div>
  );
}
