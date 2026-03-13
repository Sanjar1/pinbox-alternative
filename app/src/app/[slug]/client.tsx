'use client';

import { useState } from 'react';
import { submitFeedback } from './actions';
import type { Store, PlatformLocationLink } from '@prisma/client';
import { isDirectPlatformLocationUrl } from '@/lib/validation';

type StoreWithLinks = Store & { locationLinks: PlatformLocationLink[] };
type Language = 'uz' | 'ru';
type Phase = 'voting' | 'post-vote' | 'done';

const questions: Record<Language, { label: string; sub: string }[]> = {
  uz: [
    { label: 'Хизмат', sub: 'Сотувчининг хизмат кўрсатиш жараёни қониқарли даражада бўлдими?' },
    { label: 'Маҳсулот', sub: 'Маҳсулот сифатли ва бара эдими?' },
    { label: 'Нарх', sub: 'Бошқа савдо нуқталарига нисбатан нархлар сиз учун адолатлими?' },
  ],
  ru: [
    { label: 'Сервис', sub: 'Хорошо ли вас обслужил продавец?' },
    { label: 'Продукт', sub: 'Был ли продукт свежим и качественным?' },
    { label: 'Цена', sub: 'Насколько привлекательна для вас цена относительно других торговых точек?' },
  ],
};

const copy: Record<Language, {
  selectLang: string;
  submitVote: string;
  allRequired: string;
  makePublic: string;
  privateFeedback: string;
  commentPlaceholder: string;
  sendComment: string;
  thankYou: string;
  thankYouSub: string;
  errorGeneric: string;
  errorRatings: string;
}> = {
  uz: {
    selectLang: 'Тилни танланг',
    submitVote: 'Баҳо бериш',
    allRequired: 'Барча саволларга жавоб беринг',
    makePublic: 'Фикрингизни оммага маълум қилинг:',
    privateFeedback: 'Нима яхши эмас эди?',
    commentPlaceholder: 'Батафсил ёзинг...',
    sendComment: 'Юбориш',
    thankYou: 'Раҳмат!',
    thankYouSub: 'Хабарингиз қабул қилинди.',
    errorGeneric: 'Хатолик юз берди. Қайта уриниб кўринг.',
    errorRatings: 'Илтимос, барча саволларга баҳо беринг.',
  },
  ru: {
    selectLang: 'Выберите язык',
    submitVote: 'Отправить оценку',
    allRequired: 'Оцените все категории',
    makePublic: 'Сделайте ваш голос публичным:',
    privateFeedback: 'Что пошло не так?',
    commentPlaceholder: 'Опишите подробно...',
    sendComment: 'Отправить',
    thankYou: 'Спасибо!',
    thankYouSub: 'Ваше сообщение получено.',
    errorGeneric: 'Произошла ошибка. Попробуйте ещё раз.',
    errorRatings: 'Пожалуйста, оцените все категории.',
  },
};

const platforms: Record<string, { label: string; bg: string; icon: string }> = {
  GOOGLE: {
    label: 'Google Maps',
    bg: '#1A73E8',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" opacity=".7"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff" opacity=".5"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" opacity=".6"/></svg>`,
  },
  YANDEX: {
    label: 'Яндекс Карты',
    bg: '#FC3F1D',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="rgba(255,255,255,0.2)"/><path d="M13.32 7.666h-.924c-1.694 0-2.585.858-2.585 2.123 0 1.43.616 2.1 1.881 2.98l1.045.715-3.003 4.516H7.49l2.695-3.955c-1.55-1.111-2.42-2.19-2.42-4.025 0-2.31 1.595-3.85 4.378-3.85h3.267V18h-2.09V7.666z" fill="#fff"/></svg>`,
  },
  TWOGIS: {
    label: '2ГИС',
    bg: '#1BA53E',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="rgba(255,255,255,0.2)"/><text x="12" y="16.5" text-anchor="middle" fill="white" font-size="8" font-weight="bold" font-family="sans-serif">2GIS</text></svg>`,
  },
};

function StarRow({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          style={{
            fontSize: 32,
            lineHeight: 1,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: s <= (hover || value) ? '#C8861A' : '#D8CBA8',
            transition: 'color 0.15s',
            padding: 0,
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function PublicRatingClient({ store }: { store: StoreWithLinks }) {
  const [lang, setLang] = useState<Language>('uz');
  const [ratings, setRatings] = useState([0, 0, 0]);
  const [phase, setPhase] = useState<Phase>('voting');
  const [avgRating, setAvgRating] = useState(0);
  const [comment, setComment] = useState('');
  const [commentSent, setCommentSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const t = copy[lang];
  const allRated = ratings.every((r) => r > 0);
  const publicLinks = store.locationLinks.filter((l) => {
    if (!l.url || l.url.length === 0) return false;
    if (l.platform !== 'GOOGLE' && l.platform !== 'YANDEX' && l.platform !== 'TWOGIS') return false;
    return isDirectPlatformLocationUrl(l.platform, l.url);
  });

  async function handleSubmitVote() {
    if (!allRated) {
      setError(t.errorRatings);
      return;
    }

    setError('');
    setLoading(true);

    const avg = Math.round(ratings.reduce((a, b) => a + b, 0) / 3);

    const formData = new FormData();
    formData.set('storeId', store.id);
    formData.set('rating', avg.toString());
    formData.set('comment', `[ratings] service:${ratings[0]};quality:${ratings[1]};prices:${ratings[2]};lang:${lang}`);

    const key = 'qr-device-id';
    const existing = window.localStorage.getItem(key);
    const deviceId = existing || (window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);
    if (!existing) window.localStorage.setItem(key, deviceId);
    formData.set('deviceId', deviceId);

    const result = await submitFeedback(formData);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setAvgRating(avg);
    setPhase('post-vote');
  }

  async function handleSendComment() {
    if (!comment.trim()) return;
    setLoading(true);

    const formData = new FormData();
    formData.set('storeId', store.id);
    formData.set('rating', avgRating.toString());
    formData.set('comment', comment.trim());

    const key = 'qr-device-id';
    const deviceId = window.localStorage.getItem(key) ?? '';
    formData.set('deviceId', deviceId + '-comment');

    await submitFeedback(formData);
    setLoading(false);
    setCommentSent(true);
    setPhase('done');
  }

  // ── DONE ──
  if (phase === 'done') {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
        <p style={{ fontSize: 20, fontWeight: 600, color: '#1A3A2A' }}>{t.thankYou}</p>
        <p style={{ fontSize: 14, color: '#8A7A5A', marginTop: 8 }}>{t.thankYouSub}</p>
      </div>
    );
  }

  // ── POST-VOTE ──
  if (phase === 'post-vote') {
    if (avgRating >= 4) {
      return (
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 20, color: '#1A3A2A' }}>
            {t.makePublic}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {publicLinks.length > 0 ? publicLinks.map((link) => {
              const p = platforms[link.platform];
              return (
                <a
                  key={link.id}
                  href={link.url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 20px',
                    borderRadius: 6,
                    background: p?.bg || '#555',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: 15,
                    textDecoration: 'none',
                  }}
                >
                  {p && <span dangerouslySetInnerHTML={{ __html: p.icon }} />}
                  {p?.label || link.platform}
                  <span style={{ marginLeft: 'auto', opacity: 0.7 }}>→</span>
                </a>
              );
            }) : (
              <p style={{ color: '#A09070', fontSize: 14 }}>Ссылки пока не настроены.</p>
            )}
          </div>
        </div>
      );
    }

    // Low score → comment form
    if (commentSent) {
      return (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
          <p style={{ fontSize: 20, fontWeight: 600, color: '#1A3A2A' }}>{t.thankYou}</p>
          <p style={{ fontSize: 14, color: '#8A7A5A', marginTop: 8 }}>{t.thankYouSub}</p>
        </div>
      );
    }

    return (
      <div style={{ padding: '8px 0' }}>
        <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 16, color: '#2A1810' }}>
          {t.privateFeedback}
        </p>
        <textarea
          rows={5}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t.commentPlaceholder}
          style={{
            width: '100%',
            padding: 12,
            border: '1.5px solid #EFE0B8',
            borderRadius: 4,
            fontSize: 15,
            fontFamily: 'inherit',
            resize: 'none',
            boxSizing: 'border-box',
          }}
        />
        {error && <p style={{ color: '#B85C38', fontSize: 13, marginTop: 6 }}>{error}</p>}
        <button
          type="button"
          onClick={handleSendComment}
          disabled={!comment.trim() || loading}
          style={{
            marginTop: 12,
            width: '100%',
            padding: '14px',
            background: comment.trim() ? '#B85C38' : '#D8CBA8',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            fontWeight: 600,
            fontSize: 14,
            cursor: comment.trim() ? 'pointer' : 'not-allowed',
            letterSpacing: '0.05em',
          }}
        >
          {loading ? '...' : t.sendComment}
        </button>
      </div>
    );
  }

  // ── VOTING ──
  return (
    <div>
      {/* Language toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, justifyContent: 'center' }}>
        {(['uz', 'ru'] as Language[]).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            style={{
              padding: '6px 18px',
              borderRadius: 20,
              border: '1.5px solid',
              borderColor: lang === l ? '#C8861A' : '#D8CBA8',
              background: lang === l ? '#C8861A' : 'transparent',
              color: lang === l ? '#fff' : '#8A7A5A',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {l === 'uz' ? 'УЗ' : 'РУ'}
          </button>
        ))}
      </div>

      {/* Questions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
        {questions[lang].map((q, i) => (
          <div
            key={i}
            style={{
              padding: '16px 18px',
              background: '#FFFDF5',
              border: '1.5px solid',
              borderColor: ratings[i] > 0 ? '#C8861A' : '#EFE0B8',
              borderRadius: 4,
              textAlign: 'left',
            }}
          >
            <p style={{ fontWeight: 700, fontSize: 15, margin: '0 0 2px', color: '#2A1810' }}>
              {q.label}
            </p>
            <p style={{ fontSize: 13, color: '#8A7A5A', margin: '0 0 10px' }}>{q.sub}</p>
            <StarRow value={ratings[i]} onChange={(v) => {
              const next = [...ratings];
              next[i] = v;
              setRatings(next);
            }} />
          </div>
        ))}
      </div>

      {error && <p style={{ color: '#B85C38', fontSize: 13, marginBottom: 10 }}>{error}</p>}

      <button
        type="button"
        onClick={handleSubmitVote}
        disabled={!allRated || loading}
        style={{
          width: '100%',
          padding: '16px',
          background: allRated ? '#1A3A2A' : '#D8CBA8',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          fontWeight: 700,
          fontSize: 14,
          cursor: allRated ? 'pointer' : 'not-allowed',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        {loading ? '...' : t.submitVote}
      </button>

      {!allRated && (
        <p style={{ textAlign: 'center', marginTop: 10, fontSize: 12, color: '#A09070' }}>
          {t.allRequired}
        </p>
      )}
    </div>
  );
}
