'use client';

import { useState } from 'react';

type Lang = 'uz' | 'ru';

const COPY = {
  uz: {
    tagline: 'Сизнинг фикрингиз бизга муҳим',
    categories: [
      { label: 'Хизмат', sub: 'Сотувчи яхши муомала қилдими?' },
      { label: 'Маҳсулот', sub: 'Маҳсулот янги ва сифатлими?' },
      { label: 'Нарх', sub: 'Нарх адолатли эдими, қўшниларга нисбатан?' },
    ],
    submit: 'Баҳолашни якунлаш',
    allRequired: 'Барча саволларга жавоб беринг',
    thankHigh: 'Баҳоингиз учун катта раҳмат',
    thankHighSub: 'Сизнинг мулоҳазаларингиз бошқа харидорларга ёрдам беради. Тажрибангизни улашинг:',
    thankLow: 'Фикрингиз учун раҳмат',
    thankLowSub: 'Биз доим яхшиланишга тайёрмиз. Нима камчилик борлигини ёзинг — жавобимизни кутинг:',
    feedbackPlaceholder: 'Нима яхши эмас эди? Батафсил ёзинг...',
    send: 'Юбориш',
    sent: 'Хабарингиз қабул қилинди',
    sentSub: 'Тез орада сиз билан боғланамиз',
  },
  ru: {
    tagline: 'Ваше мнение важно для нас',
    categories: [
      { label: 'Сервис', sub: 'Продавец вас хорошо обслужил?' },
      { label: 'Продукт', sub: 'Продукт был качественным и свежим?' },
      { label: 'Цена', sub: 'Цена привлекательная относительно соседей?' },
    ],
    submit: 'Завершить оценку',
    allRequired: 'Оцените все категории',
    thankHigh: 'Большое спасибо за оценку',
    thankHighSub: 'Ваш отзыв помогает другим покупателям. Поделитесь впечатлениями:',
    thankLow: 'Спасибо за ваш отзыв',
    thankLowSub: 'Мы всегда стремимся стать лучше. Расскажите, что пошло не так — мы ответим:',
    feedbackPlaceholder: 'Что было не так? Опишите подробно...',
    send: 'Отправить',
    sent: 'Сообщение получено',
    sentSub: 'Мы скоро свяжемся с вами',
  },
};

function StarRating({
  value,
  onChange,
  index,
}: {
  value: number;
  onChange: (v: number) => void;
  index: number;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-3 mt-3">
      {[1, 2, 3, 4, 5].map((s) => {
        const active = s <= (hover || value);
        return (
          <button
            key={s}
            onClick={() => onChange(s)}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            style={{
              fontSize: '36px',
              lineHeight: 1,
              color: active ? '#C8861A' : '#D8CBA8',
              transform: active ? 'scale(1.18) translateY(-2px)' : 'scale(1)',
              textShadow: active ? '0 3px 10px rgba(200,134,26,0.45)' : 'none',
              transition: 'all 0.15s cubic-bezier(0.34,1.56,0.64,1)',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              padding: 0,
              animationDelay: `${0.05 * s + index * 0.1}s`,
            }}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

export default function VotingPage({
  storeId = 'Авиасозлар',
}: {
  storeId?: string;
}) {
  const [lang, setLang] = useState<Lang>('uz');
  const [ratings, setRatings] = useState([0, 0, 0]);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  const copy = COPY[lang];
  const allRated = ratings.every((r) => r > 0);
  const avg = allRated ? ratings.reduce((a, b) => a + b, 0) / 3 : 0;
  const isHigh = avg >= 4;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,400;0,500;0,600;1,400;1,600&family=Jost:wght@300;400;500;600&display=swap');

        :root {
          --cream: #F7EDD0;
          --cream-deep: #EFE0B8;
          --ivory: #FFFDF5;
          --forest: #1A3A2A;
          --forest-mid: #2D5240;
          --amber: #C8861A;
          --amber-light: #E8A840;
          --terracotta: #B85C38;
          --espresso: #2A1810;
          --stone: #8A7A5A;
          --stone-light: #B0A080;
        }

        .vp-root {
          font-family: 'Jost', sans-serif;
          background-color: var(--cream);
          min-height: 100vh;
          color: var(--espresso);
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
        }

        .vp-serif { font-family: 'Cormorant', serif; }

        /* Header */
        .vp-header {
          background: var(--forest);
          padding: 32px 24px 28px;
          position: relative;
          overflow: hidden;
        }
        .vp-header::before {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 12px,
            rgba(200,134,26,0.04) 12px,
            rgba(200,134,26,0.04) 13px
          );
        }
        .vp-header-inner { position: relative; z-index: 1; }

        /* Lang toggle */
        .vp-lang {
          display: flex;
          background: rgba(255,255,255,0.1);
          border-radius: 20px;
          padding: 3px;
          gap: 2px;
        }
        .vp-lang-btn {
          padding: 5px 14px;
          border-radius: 16px;
          font-size: 11px;
          font-family: 'Jost', sans-serif;
          font-weight: 600;
          letter-spacing: 0.08em;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }
        .vp-lang-btn.active {
          background: var(--cream);
          color: var(--forest);
        }
        .vp-lang-btn:not(.active) {
          background: transparent;
          color: rgba(247,237,208,0.55);
        }
        .vp-lang-btn:not(.active):hover {
          color: rgba(247,237,208,0.85);
        }

        /* Score ornament */
        .vp-score-bar {
          display: flex;
          gap: 6px;
          margin-top: 20px;
        }
        .vp-score-pip {
          height: 3px;
          flex: 1;
          border-radius: 2px;
          transition: background 0.3s;
        }

        /* Category cards */
        .vp-card {
          background: var(--ivory);
          border-radius: 3px;
          padding: 22px 20px 20px;
          position: relative;
          box-shadow: 0 2px 20px rgba(42,24,16,0.07), 0 1px 4px rgba(42,24,16,0.05);
          opacity: 0;
          animation: vp-slide-up 0.45s cubic-bezier(0.22,1,0.36,1) forwards;
        }
        .vp-card::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: var(--amber);
          border-radius: 3px 0 0 3px;
        }
        .vp-card.rated::before {
          background: linear-gradient(180deg, var(--amber), var(--amber-light));
        }

        @keyframes vp-slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .vp-card:nth-child(1) { animation-delay: 0.08s; }
        .vp-card:nth-child(2) { animation-delay: 0.18s; }
        .vp-card:nth-child(3) { animation-delay: 0.28s; }

        /* Submit button */
        .vp-submit {
          width: 100%;
          padding: 17px;
          background: var(--forest);
          color: var(--cream);
          border: none;
          border-radius: 3px;
          font-family: 'Jost', sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.22,1,0.36,1);
          position: relative;
          overflow: hidden;
        }
        .vp-submit:not(:disabled):hover {
          background: var(--amber);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(200,134,26,0.35);
        }
        .vp-submit:not(:disabled):active {
          transform: translateY(0);
        }
        .vp-submit:disabled {
          opacity: 0.38;
          cursor: not-allowed;
        }

        /* Thank you screens */
        .vp-thank {
          animation: vp-fade-in 0.5s ease both;
        }
        @keyframes vp-fade-in {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Platform links */
        .vp-platform {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 20px;
          background: var(--ivory);
          border: 1.5px solid var(--cream-deep);
          border-radius: 3px;
          text-decoration: none;
          color: var(--espresso);
          font-family: 'Jost', sans-serif;
          font-weight: 500;
          font-size: 15px;
          transition: all 0.2s;
          animation: vp-slide-up 0.4s ease both;
        }
        .vp-platform:nth-child(1) { animation-delay: 0.1s; }
        .vp-platform:nth-child(2) { animation-delay: 0.2s; }
        .vp-platform:nth-child(3) { animation-delay: 0.3s; }
        .vp-platform:hover {
          border-color: var(--amber);
          transform: translateX(6px);
          box-shadow: 0 4px 16px rgba(200,134,26,0.15);
        }
        .vp-platform-arrow {
          margin-left: auto;
          color: var(--amber);
          font-size: 18px;
          transition: transform 0.2s;
        }
        .vp-platform:hover .vp-platform-arrow {
          transform: translateX(3px);
        }

        /* Feedback */
        .vp-textarea {
          width: 100%;
          padding: 16px;
          border: 1.5px solid var(--cream-deep);
          border-radius: 3px;
          background: var(--ivory);
          font-family: 'Jost', sans-serif;
          font-size: 15px;
          line-height: 1.6;
          color: var(--espresso);
          resize: none;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .vp-textarea:focus { border-color: var(--terracotta); }
        .vp-textarea::placeholder { color: var(--stone-light); }

        .vp-send {
          width: 100%;
          padding: 16px;
          background: var(--terracotta);
          color: var(--cream);
          border: none;
          border-radius: 3px;
          font-family: 'Jost', sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 12px;
        }
        .vp-send:hover:not(:disabled) {
          background: #963D22;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(184,92,56,0.3);
        }
        .vp-send:disabled { opacity: 0.38; cursor: not-allowed; }

        /* Divider */
        .vp-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--stone-light);
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin: 20px 0;
        }
        .vp-divider::before,
        .vp-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--cream-deep);
        }
      `}</style>

      <div className="vp-root">
        {/* ─── Header ─── */}
        <div className="vp-header">
          <div className="vp-header-inner">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <p style={{
                  fontFamily: 'Jost',
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: '#C8861A',
                  marginBottom: 6,
                }}>
                  {storeId}
                </p>
                <h1 className="vp-serif" style={{
                  fontSize: 26,
                  fontWeight: 600,
                  fontStyle: 'italic',
                  color: '#F7EDD0',
                  margin: 0,
                  lineHeight: 1.1,
                }}>
                  Сырная Лавка
                </h1>
              </div>
              <div className="vp-lang">
                <button className={`vp-lang-btn ${lang === 'uz' ? 'active' : ''}`} onClick={() => setLang('uz')}>УЗ</button>
                <button className={`vp-lang-btn ${lang === 'ru' ? 'active' : ''}`} onClick={() => setLang('ru')}>РУ</button>
              </div>
            </div>

            <p className="vp-serif" style={{
              fontSize: 17,
              fontStyle: 'italic',
              color: 'rgba(247,237,208,0.72)',
              margin: 0,
            }}>
              {copy.tagline}
            </p>

            {/* Progress pips */}
            <div className="vp-score-bar">
              {[0, 1, 2].map(i => (
                <div key={i} className="vp-score-pip" style={{
                  background: ratings[i] > 0
                    ? (ratings[i] >= 4 ? '#C8861A' : ratings[i] >= 3 ? '#8A7A5A' : '#B85C38')
                    : 'rgba(255,255,255,0.12)',
                }} />
              ))}
            </div>
          </div>
        </div>

        {/* ─── Body ─── */}
        <div style={{ padding: '24px 20px 40px', maxWidth: 480, margin: '0 auto' }}>
          {!submitted ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
                {copy.categories.map((cat, i) => (
                  <div key={i} className={`vp-card ${ratings[i] > 0 ? 'rated' : ''}`}>
                    <span style={{
                      fontFamily: 'Jost',
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: '#A09070',
                    }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p className="vp-serif" style={{
                      fontSize: 20,
                      fontWeight: 600,
                      margin: '6px 0 2px',
                      color: '#2A1810',
                      lineHeight: 1.2,
                    }}>
                      {cat.label}
                    </p>
                    <p style={{
                      fontFamily: 'Jost',
                      fontSize: 12,
                      color: '#8A7A5A',
                      margin: 0,
                      fontWeight: 300,
                    }}>
                      {cat.sub}
                    </p>
                    <StarRating
                      value={ratings[i]}
                      index={i}
                      onChange={v => {
                        const next = [...ratings];
                        next[i] = v;
                        setRatings(next);
                      }}
                    />
                  </div>
                ))}
              </div>

              <button
                className="vp-submit"
                onClick={() => setSubmitted(true)}
                disabled={!allRated}
              >
                {copy.submit}
              </button>

              {!allRated && (
                <p style={{
                  textAlign: 'center',
                  marginTop: 12,
                  fontFamily: 'Jost',
                  fontSize: 12,
                  color: '#A09070',
                }}>
                  {copy.allRequired}
                </p>
              )}
            </>
          ) : isHigh ? (
            /* ─── HIGH SCORE ─── */
            <div className="vp-thank">
              <div style={{ textAlign: 'center', padding: '32px 0 28px' }}>
                <div style={{ fontSize: 52, marginBottom: 16, lineHeight: 1 }}>🧀</div>
                <h2 className="vp-serif" style={{
                  fontSize: 26,
                  fontWeight: 600,
                  color: '#1A3A2A',
                  margin: '0 0 12px',
                  lineHeight: 1.2,
                }}>
                  {copy.thankHigh}
                </h2>
                {/* Average display */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 4, margin: '12px 0' }}>
                  {[1,2,3,4,5].map(s => (
                    <span key={s} style={{ fontSize: 22, color: s <= Math.round(avg) ? '#C8861A' : '#D8CBA8' }}>★</span>
                  ))}
                </div>
                <p style={{
                  fontFamily: 'Jost',
                  fontSize: 13,
                  color: '#8A7A5A',
                  maxWidth: 280,
                  margin: '12px auto 0',
                  lineHeight: 1.6,
                }}>
                  {copy.thankHighSub}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <a href="#google" className="vp-platform">
                  <svg width="22" height="22" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google Maps
                  <span className="vp-platform-arrow">→</span>
                </a>
                <a href="#yandex" className="vp-platform">
                  <svg width="22" height="22" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="11" fill="#FC3F1D"/>
                    <path d="M13.32 7.666h-.924c-1.694 0-2.585.858-2.585 2.123 0 1.43.616 2.1 1.881 2.98l1.045.715-3.003 4.516H7.49l2.695-3.955c-1.55-1.111-2.42-2.19-2.42-4.025 0-2.31 1.595-3.85 4.378-3.85h3.267V18h-2.09V7.666z" fill="#fff"/>
                  </svg>
                  Яндекс Карты
                  <span className="vp-platform-arrow">→</span>
                </a>
                <a href="#2gis" className="vp-platform">
                  <svg width="22" height="22" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="11" fill="#00B956"/>
                    <text x="12" y="16.5" textAnchor="middle" fill="white" fontSize="8.5" fontWeight="bold" fontFamily="sans-serif">2GIS</text>
                  </svg>
                  2ГИС
                  <span className="vp-platform-arrow">→</span>
                </a>
              </div>

              <div className="vp-divider" style={{ marginTop: 28 }}>Сырная Лавка</div>
            </div>
          ) : (
            /* ─── LOW SCORE ─── */
            <div className="vp-thank">
              <div style={{ marginBottom: 24 }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'rgba(184,92,56,0.08)',
                  padding: '8px 14px',
                  borderRadius: 2,
                  marginBottom: 16,
                }}>
                  <span style={{ fontSize: 18 }}>✉</span>
                  <span style={{
                    fontFamily: 'Jost',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#B85C38',
                  }}>
                    {lang === 'uz' ? 'Хусусий фикр' : 'Личная обратная связь'}
                  </span>
                </div>
                <h2 className="vp-serif" style={{
                  fontSize: 24,
                  fontWeight: 600,
                  color: '#2A1810',
                  margin: '0 0 10px',
                }}>
                  {copy.thankLow}
                </h2>
                <p style={{
                  fontFamily: 'Jost',
                  fontSize: 13,
                  color: '#8A7A5A',
                  lineHeight: 1.65,
                  margin: 0,
                }}>
                  {copy.thankLowSub}
                </p>
              </div>

              {!feedbackSent ? (
                <>
                  <textarea
                    className="vp-textarea"
                    rows={6}
                    placeholder={copy.feedbackPlaceholder}
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                  />
                  <button
                    className="vp-send"
                    disabled={!feedback.trim()}
                    onClick={() => setFeedbackSent(true)}
                  >
                    {copy.send}
                  </button>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'rgba(26,58,42,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    fontSize: 24,
                  }}>
                    ✓
                  </div>
                  <p className="vp-serif" style={{ fontSize: 22, fontWeight: 600, color: '#1A3A2A', margin: '0 0 8px' }}>
                    {copy.sent}
                  </p>
                  <p style={{ fontFamily: 'Jost', fontSize: 13, color: '#8A7A5A' }}>
                    {copy.sentSub}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', paddingBottom: 32 }}>
          <p style={{ fontFamily: 'Jost', fontSize: 11, color: '#B0A080', letterSpacing: '0.1em' }}>
            © Сырная Лавка · Uzbekistan
          </p>
        </div>
      </div>
    </>
  );
}
