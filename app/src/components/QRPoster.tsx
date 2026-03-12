'use client';

/**
 * QR Poster — Сырная Лавка
 *
 * Print-ready A5 poster (148 × 210 mm at 96dpi ≈ 559 × 794px).
 * QR placeholder is a realistic SVG pattern — replace `QR_URL` prop with
 * an actual QR image URL (PNG) for production.
 *
 * Usage:
 *   <QRPoster storeName="Авиасозлар" qrUrl="/qr/aviasozlar.png" />
 */

// Realistic-looking QR code SVG placeholder (version 1, 21×21 modules)
function QRPlaceholder({ size = 260 }: { size?: number }) {
  const modules = 21;
  const cell = size / modules;

  // Pre-defined module map (1 = dark, 0 = light)
  // Built from: 3 finder patterns + timing + realistic data fill
  const grid: number[][] = Array.from({ length: modules }, (_, r) =>
    Array.from({ length: modules }, (_, c) => {
      // Finder TL (rows 0-6, cols 0-6)
      if (r <= 6 && c <= 6) {
        if (r === 0 || r === 6 || c === 0 || c === 6) return 1;
        if (r === 1 || r === 5 || c === 1 || c === 5) return 0;
        return 1;
      }
      // Finder TR (rows 0-6, cols 14-20)
      if (r <= 6 && c >= 14) {
        const rc = c - 14;
        if (r === 0 || r === 6 || rc === 0 || rc === 6) return 1;
        if (r === 1 || r === 5 || rc === 1 || rc === 5) return 0;
        return 1;
      }
      // Finder BL (rows 14-20, cols 0-6)
      if (r >= 14 && c <= 6) {
        const rr = r - 14;
        if (rr === 0 || rr === 6 || c === 0 || c === 6) return 1;
        if (rr === 1 || rr === 5 || c === 1 || c === 5) return 0;
        return 1;
      }
      // Separator bars around finders
      if ((r === 7 && c <= 7) || (r <= 7 && c === 7)) return 0;
      if ((r === 7 && c >= 13) || (r <= 7 && c === 13)) return 0;
      if ((r === 13 && c <= 7) || (r >= 13 && c === 7)) return 0;
      // Timing patterns
      if (r === 6 && c >= 8 && c <= 12) return c % 2 === 0 ? 1 : 0;
      if (c === 6 && r >= 8 && r <= 12) return r % 2 === 0 ? 1 : 0;
      // Format info strip
      if (r === 8 && (c <= 8 || c >= 13)) return [1,0,1,1,0,1,0,0,1][c <= 8 ? c : c - 13] ?? 0;
      // Data area — pseudo-random but dense (deterministic from position)
      const seed = (r * 31 + c * 17 + r * c * 7) % 100;
      return seed < 52 ? 1 : 0;
    })
  );

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      <rect width={size} height={size} fill="white" />
      {grid.map((row, r) =>
        row.map((val, c) =>
          val === 1 ? (
            <rect
              key={`${r}-${c}`}
              x={c * cell}
              y={r * cell}
              width={cell}
              height={cell}
              fill="#111111"
            />
          ) : null
        )
      )}
    </svg>
  );
}

interface QRPosterProps {
  storeName?: string;
  qrUrl?: string;   // If provided, renders an <img> instead of SVG placeholder
  qrSize?: number;
}

export default function QRPoster({
  storeName = 'Авиасозлар',
  qrUrl,
  qrSize = 264,
}: QRPosterProps) {
  const steps = [
    { n: '1', uz: 'Камерани очинг', ru: 'Откройте камеру' },
    { n: '2', uz: 'QR кодни скан қилинг', ru: 'Сканируйте QR-код' },
    { n: '3', uz: 'Баҳо қолдиринг', ru: 'Оставьте оценку' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,400;0,500;0,700;1,400;1,600&family=Jost:wght@300;400;500;600&display=swap');

        .poster-root {
          font-family: 'Jost', sans-serif;
          width: 559px;       /* A5 @ 96dpi */
          min-height: 794px;
          background: #1A3A2A;
          color: #F7EDD0;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          box-sizing: border-box;
        }

        /* Corner diamonds */
        .poster-root::before {
          content: '';
          position: absolute;
          top: -60px; right: -60px;
          width: 200px; height: 200px;
          border: 1px solid rgba(200,134,26,0.18);
          transform: rotate(45deg);
        }
        .poster-root::after {
          content: '';
          position: absolute;
          bottom: -60px; left: -60px;
          width: 180px; height: 180px;
          border: 1px solid rgba(200,134,26,0.12);
          transform: rotate(45deg);
        }

        .poster-serif { font-family: 'Cormorant', serif; }

        .poster-header {
          padding: 32px 36px 24px;
          position: relative;
          z-index: 1;
        }

        .poster-store-badge {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 4px;
        }

        .poster-store-line {
          width: 24px;
          height: 1.5px;
          background: #C8861A;
        }

        /* Amber decorative line */
        .poster-amber-rule {
          width: 40px;
          height: 2px;
          background: linear-gradient(90deg, #C8861A, #E8A840);
          margin: 14px 0;
          border-radius: 1px;
        }

        /* QR container */
        .poster-qr-wrap {
          margin: 0 auto;
          position: relative;
          z-index: 1;
          padding: 20px 36px;
          display: flex;
          justify-content: center;
        }

        .poster-qr-frame {
          background: #F7EDD0;
          padding: 18px;
          position: relative;
        }
        /* Ornamental corners */
        .poster-qr-frame::before,
        .poster-qr-frame::after {
          content: '';
          position: absolute;
          width: 20px; height: 20px;
          border-color: #C8861A;
          border-style: solid;
        }
        .poster-qr-frame::before {
          top: -4px; left: -4px;
          border-width: 3px 0 0 3px;
        }
        .poster-qr-frame::after {
          bottom: -4px; right: -4px;
          border-width: 0 3px 3px 0;
        }
        /* Extra corners via inner elements */

        /* CTA section */
        .poster-cta {
          padding: 20px 36px 0;
          position: relative;
          z-index: 1;
        }

        /* Steps section */
        .poster-steps {
          padding: 20px 36px 32px;
          position: relative;
          z-index: 1;
          margin-top: auto;
        }

        .poster-step {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 10px 0;
        }
        .poster-step + .poster-step {
          border-top: 1px solid rgba(247,237,208,0.1);
        }

        .poster-step-num {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 1.5px solid rgba(200,134,26,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 600;
          color: #C8861A;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .poster-footer {
          padding: 16px 36px 24px;
          border-top: 1px solid rgba(247,237,208,0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
          z-index: 1;
        }
      `}</style>

      <div className="poster-root">
        {/* Header */}
        <div className="poster-header">
          <div className="poster-store-badge">
            <div className="poster-store-line" />
            <span style={{
              fontFamily: 'Jost',
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#C8861A',
            }}>
              {storeName}
            </span>
          </div>
          <h1 className="poster-serif" style={{
            fontSize: 28,
            fontWeight: 700,
            fontStyle: 'italic',
            color: '#F7EDD0',
            margin: '4px 0 0',
            lineHeight: 1.1,
          }}>
            Сырная Лавка
          </h1>
          <div className="poster-amber-rule" />
        </div>

        {/* QR Code — dominant visual block */}
        <div className="poster-qr-wrap">
          <div className="poster-qr-frame">
            {/* Extra ornamental corners */}
            <div style={{
              position: 'absolute',
              top: -4, right: -4,
              width: 20, height: 20,
              borderTop: '3px solid #C8861A',
              borderRight: '3px solid #C8861A',
            }} />
            <div style={{
              position: 'absolute',
              bottom: -4, left: -4,
              width: 20, height: 20,
              borderBottom: '3px solid #C8861A',
              borderLeft: '3px solid #C8861A',
            }} />

            {qrUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrUrl} alt="QR code" width={qrSize} height={qrSize} style={{ display: 'block' }} />
            ) : (
              <QRPlaceholder size={qrSize} />
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="poster-cta">
          <p className="poster-serif" style={{
            fontSize: 22,
            fontStyle: 'italic',
            fontWeight: 600,
            color: '#F7EDD0',
            margin: '0 0 4px',
            lineHeight: 1.3,
          }}>
            Хизматимизни баҳоланг
          </p>
          <p style={{
            fontFamily: 'Jost',
            fontSize: 12,
            fontWeight: 300,
            color: 'rgba(247,237,208,0.6)',
            margin: 0,
            letterSpacing: '0.04em',
          }}>
            Оцените наш сервис
          </p>
        </div>

        {/* Steps */}
        <div className="poster-steps">
          <p style={{
            fontFamily: 'Jost',
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'rgba(200,134,26,0.7)',
            marginBottom: 10,
          }}>
            Қандай баҳолаш керак
          </p>
          {steps.map((s, i) => (
            <div key={i} className="poster-step">
              <div className="poster-step-num">{s.n}</div>
              <div>
                <p style={{
                  fontFamily: 'Jost',
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#F7EDD0',
                  margin: '0 0 2px',
                }}>
                  {s.uz}
                </p>
                <p style={{
                  fontFamily: 'Jost',
                  fontSize: 11,
                  fontWeight: 300,
                  color: 'rgba(247,237,208,0.45)',
                  margin: 0,
                }}>
                  {s.ru}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="poster-footer">
          <span style={{
            fontFamily: 'Jost',
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(200,134,26,0.5)',
          }}>
            sirnayalavka.uz
          </span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {[1,2,3,4,5].map(s => (
              <span key={s} style={{ fontSize: 10, color: s <= 4 ? '#C8861A' : 'rgba(200,134,26,0.3)' }}>★</span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
