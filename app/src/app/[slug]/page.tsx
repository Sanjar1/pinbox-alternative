import { prisma, withDbRetry } from '@/lib/db';
import { notFound } from 'next/navigation';
import PublicRatingClient from './client';
import { getBrandByStoreName, getVotingTitle } from '@/lib/brands';

export default async function PublicQRPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const qr = await withDbRetry(() =>
    prisma.qRCode.findUnique({
      where: { slug },
      include: {
        store: {
          include: {
            locationLinks: true,
          },
        },
      },
    }),
  );

  if (!qr) notFound();

  // Show archived message instead of 404 — QR codes on printed posters must never break
  if (qr.store.archivedAt) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: '#e9e8e4' }}>
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-4xl mb-4">📦</div>
          <h1 className="text-xl font-semibold text-gray-700 mb-2">Этот магазин закрыт</h1>
          <p className="text-gray-500 text-sm">Данная точка больше не принимает отзывы.</p>
        </div>
        <p className="mt-8 text-xs text-gray-400">Powered by Pinbox Alt</p>
      </div>
    );
  }

  // Track scan (async, non-blocking)
  await withDbRetry(() =>
    prisma.qRCode.update({
      where: { id: qr.id },
      data: { scans: { increment: 1 } },
    }),
  );

  const brand = getBrandByStoreName(qr.store.name || '');
  const storeName = qr.store.name || 'Store';
  const title = getVotingTitle(brand, storeName);

  return (
    <div className="min-h-screen flex flex-col items-center p-4" style={{ background: '#e9e8e4' }}>
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 text-center">
          <PublicRatingClient store={qr.store} brand={brand} title={title} />
        </div>
      </div>
      <p className="mt-8 text-xs text-gray-400">Powered by Pinbox Alt</p>
    </div>
  );
}
