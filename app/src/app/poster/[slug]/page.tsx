import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { prisma, withDbRetry } from '@/lib/db';

function toInternalId(name: string): string {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z', и: 'i', й: 'y',
    к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
    х: 'x', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sh', ъ: '', ы: 'i', ь: '', э: 'e', ю: 'yu', я: 'ya',
    қ: 'q', ғ: 'g', ҳ: 'h', ӯ: 'o', ':': ' ', '"': ' ', "'": ' ', '(': ' ', ')': ' ', ',': ' ',
  };

  return name
    .toLowerCase()
    .split('')
    .map((char) => map[char] ?? char)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

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

  const internalId = toInternalId(qr.store.name || 'store').toUpperCase();
  const brandName = `${internalId} | Сырная Лавка`;

  const headerStore = await headers();
  const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host') ?? 'localhost:3000';
  const baseUrl = buildPublicBaseUrl(host, headerStore.get('x-forwarded-proto'));
  const voteUrl = `${baseUrl}/${slug}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1400x1400&data=${encodeURIComponent(voteUrl)}`;

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20 }}>
      <style>{`
        :root {
          --bg: #fff4ea;
          --paper: #ffffff;
          --ink: #171412;
          --muted: #7b5b47;
          --accent: #f26a21;
          --line: rgba(23, 20, 18, 0.08);
        }
        * { box-sizing: border-box; }
      `}</style>

      <main
        style={{
          width: 1080,
          height: 1520,
          padding: 52,
          borderRadius: 40,
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.84), rgba(255,255,255,0.96)), var(--paper)',
          boxShadow: '0 32px 90px rgba(23, 20, 18, 0.16)',
          display: 'grid',
          gridTemplateRows: '20% 60% 10% 10%',
          gap: 22,
          overflow: 'hidden',
          fontFamily: 'Georgia, "Times New Roman", serif',
          color: 'var(--ink)',
        }}
      >
        <section
          style={{
            borderRadius: 30,
            padding: '24px 28px 18px',
            background: 'linear-gradient(135deg, #fffdfb, #fff6ef)',
            border: '1px solid var(--line)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '8px 16px',
                borderRadius: 999,
                background: 'rgba(181, 74, 49, 0.10)',
                color: 'var(--accent)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontSize: 20,
                fontWeight: 700,
              }}
            >
              Оцените нас
            </div>
            <div style={{ textAlign: 'right', fontSize: 28, color: 'var(--muted)' }}>{brandName}</div>
          </div>
          <div>
            <h1 style={{ margin: '12px 0 10px', fontSize: 76, lineHeight: 0.96 }}>Как вам у нас?</h1>
            <p style={{ margin: 0, maxWidth: 860, fontSize: 36, lineHeight: 1.15, color: '#302925' }}>
              Отсканируйте и оцените — это займёт <strong style={{ color: 'var(--accent)' }}>1 минуту</strong>.
            </p>
          </div>
        </section>

        <section
          style={{
            borderRadius: 34,
            background: '#ffffff',
            border: '1px solid var(--line)',
            display: 'grid',
            placeItems: 'center',
            padding: 34,
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 18,
              left: 28,
              fontSize: 26,
              letterSpacing: '0.22em',
              color: 'rgba(23, 20, 18, 0.18)',
            }}
          >
            SCAN
          </div>
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 28,
              display: 'grid',
              placeItems: 'center',
              background:
                'radial-gradient(circle at center, rgba(242, 106, 33, 0.08), transparent 52%), linear-gradient(180deg, #fffefc 0%, #fff4ea 100%)',
              border: '1px solid rgba(23, 20, 18, 0.06)',
            }}
          >
            <div
              style={{
                width: 660,
                height: 660,
                borderRadius: 34,
                padding: 26,
                background: '#fff',
                border: '1px solid rgba(23, 20, 18, 0.10)',
                boxShadow: '0 18px 40px rgba(23, 20, 18, 0.08), inset 0 0 0 1px rgba(255,255,255,0.9)',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrImageUrl}
                alt="QR"
                style={{ width: '100%', height: '100%', display: 'block', borderRadius: 16 }}
              />
            </div>
          </div>
        </section>

        <section
          style={{
            borderRadius: 28,
            background: '#ffffff',
            border: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 18,
            padding: '0 30px',
          }}
        >
          <div
            style={{
              fontSize: 22,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--accent)',
            }}
          >
            Как это работает
          </div>
          <div style={{ flex: 1, fontSize: 24, lineHeight: 1.25, color: '#2d2622' }}>
            Наведите камеру на QR-код. Откроется страница — поставьте оценку.
          </div>
        </section>

        <section
          style={{
            borderRadius: 28,
            background: 'linear-gradient(135deg, #f26a21, #ff8438)',
            color: '#ffffff',
            padding: '20px 28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 20,
          }}
        >
          <div style={{ fontSize: 28, lineHeight: 1.18 }}>
            Ваш отзыв помогает нам <strong style={{ color: '#fff4d8' }}>стать лучше</strong>!
          </div>
        </section>
      </main>
    </div>
  );
}
