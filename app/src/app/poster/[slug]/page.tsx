import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import QRPoster from '@/components/QRPoster';
import { prisma, withDbRetry } from '@/lib/db';

function buildPublicBaseUrl(host: string, forwardedProto?: string | null): string {
  const proto = forwardedProto ?? (host.includes('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

export default async function PosterBySlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const qr = await withDbRetry(() =>
    prisma.qRCode.findUnique({
      where: { slug },
      include: { store: true },
    }),
  );

  if (!qr) notFound();

  const headerStore = await headers();
  const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host') ?? 'localhost:3000';
  const baseUrl = buildPublicBaseUrl(host, headerStore.get('x-forwarded-proto'));
  const voteUrl = `${baseUrl}/${slug}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1400x1400&data=${encodeURIComponent(voteUrl)}`;

  return (
    <div
      style={{
        background: '#E0D4B0',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
      }}
    >
      <QRPoster storeName={qr.store.name} qrUrl={qrImageUrl} />
    </div>
  );
}
