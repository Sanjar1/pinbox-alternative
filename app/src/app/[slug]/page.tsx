import { prisma, withDbRetry } from '@/lib/db';
import { notFound } from 'next/navigation';
import PublicRatingClient from './client';

function toInternalId(name: string): string {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z', и: 'i', й: 'y',
    к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
    х: 'x', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sh', ъ: '', ы: 'i', ь: '', э: 'e', ю: 'yu', я: 'ya',
    қ: 'q', ғ: 'g', ҳ: 'h', ў: 'o', ':': ' ', '"': ' ', "'": ' ', '(': ' ', ')': ' ', ',': ' ',
  };

  return name
    .toLowerCase()
    .split('')
    .map((c) => map[c] ?? c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

export default async function PublicQRPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const qr = await withDbRetry(() =>
    prisma.qRCode.findUnique({
      where: { slug },
      include: {
        store: {
          include: {
            locationLinks: true, // Updated from platformLinks
          },
        },
      },
    }),
  );

  if (!qr) notFound();

  // Track scan (async, non-blocking)
  await withDbRetry(() =>
    prisma.qRCode.update({
      where: { id: qr.id },
      data: { scans: { increment: 1 } },
    }),
  );
  const internalId = toInternalId(qr.store.name || 'store').toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 text-center">
          <h1 className="text-xl font-bold mb-2">{internalId} — Сырная Лавка</h1>
          <div className="mb-4" />

          <PublicRatingClient store={qr.store} />
        </div>
      </div>
      <p className="mt-8 text-xs text-gray-400">Powered by Pinbox Alt</p>
    </div>
  );
}
