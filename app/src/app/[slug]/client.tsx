'use client';

import { useState } from 'react';
import { submitFeedback } from './actions';
import type { Store } from '@prisma/client';
import type { BrandConfig } from '@/lib/brands';

type Language = 'uz' | 'ru';
type Phase = 'voting' | 'post-vote' | 'done';

const questions: Record<Language, { label: string; sub: string }[]> = {
  uz: [
    { label: 'Хизмат', sub: 'Сотувчининг хизмат кўрсатиш жараёни қониқарли даражада бўлдими?' },
    { label: 'Маҳсулот', sub: 'Маҳсулот сифати қониқарли бўлдими?' },
    { label: 'Нарх', sub: 'Бошқа савдо нуқталарига нисбатан нархлар сиз учун адолатлими?' },
  ],
  ru: [
    { label: 'Сервис', sub: 'Хорошо ли вас обслужил продавец?' },
    { label: 'Качество продукта', sub: 'Был ли продукт свежим и качественным?' },
    { label: 'Цены', sub: 'Насколько привлекательна для вас цена относительно других торговых точек?' },
  ],
};

const copy: Record<Language, {
  submitVote: string;
  allRequired: string;
  privateFeedback: string;
  commentPlaceholder: string;
  sendComment: string;
  thankYou: string;
  thankYouSub: string;
  errorRatings: string;
  errorNetwork: string;
}> = {
  uz: {
    submitVote: 'Баҳо бериш',
    allRequired: 'Барча саволларга жавоб беринг',
    privateFeedback: 'Нима яхши эмас эди?',
    commentPlaceholder: 'Батафсил ёзинг...',
    sendComment: 'Юбориш',
    thankYou: 'Раҳмат!',
    thankYouSub: 'Хабарингиз қабул қилинди.',
    errorRatings: 'Илтимос, барча саволларга баҳо беринг.',
    errorNetwork: 'Юбориб бўлмади. Илтимос, яна уриниб кўринг.',
  },
  ru: {
    submitVote: 'Отправить оценку',
    allRequired: 'Оцените все категории',
    privateFeedback: 'Что пошло не так?',
    commentPlaceholder: 'Опишите подробно...',
    sendComment: 'Отправить',
    thankYou: 'Спасибо!',
    thankYouSub: 'Ваше сообщение получено.',
    errorRatings: 'Пожалуйста, оцените все категории.',
    errorNetwork: 'Не удалось отправить. Пожалуйста, попробуйте ещё раз.',
  },
};

function StarRow({ value, onChange, activeColor }: { value: number; onChange: (v: number) => void; activeColor: string }) {
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
            fontSize: 40,
            lineHeight: 1,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: s <= (hover || value) ? activeColor : '#E5E7EB',
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

export default function PublicRatingClient({ store, brand, title }: { store: Store; brand: BrandConfig; title?: string }) {
  const [lang, setLang] = useState<Language>('uz');
  const [ratings, setRatings] = useState([0, 0, 0]);
  const [phase, setPhase] = useState<Phase>('voting');
  const [avgRating, setAvgRating] = useState(0);
  const [minRating, setMinRating] = useState(5);
  const [comment, setComment] = useState('');
  const [commentSent, setCommentSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Kept in state so the comment phase reuses the exact id the vote used —
  // re-reading localStorage there could yield '' (private mode) and collapse
  // every such user onto a shared '-comment' device id.
  const [voteDeviceId, setVoteDeviceId] = useState('');

  const t = copy[lang];
  const allRated = ratings.every((r) => r > 0);
  const primary = brand.votingPrimary ?? brand.primary;
  const cardBackground = brand.votingLight ?? brand.light;
  const cardBorder = brand.votingBorder ?? '#E5E7EB';
  const pageTitle = title ?? brand.sub;

  async function handleSubmitVote() {
    if (!allRated) { setError(t.errorRatings); return; }
    setError('');
    setLoading(true);

    const avg = Math.round(ratings.reduce((a, b) => a + b, 0) / 3);
    const formData = new FormData();
    formData.set('storeId', store.id);
    formData.set('rating', avg.toString());
    formData.set('comment', `[ratings] service:${ratings[0]};quality:${ratings[1]};prices:${ratings[2]};lang:${lang}`);

    const key = 'qr-device-id';
    const testerParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('testerDeviceId')?.trim() ?? '' : '';
    const testerDeviceId = /^[a-zA-Z0-9_-]{8,120}$/.test(testerParam) ? testerParam : '';
    const existing = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
    const deviceId = testerDeviceId || existing || (typeof window !== 'undefined' ? (window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`) : '');
    if (typeof window !== 'undefined' && (!existing || testerDeviceId)) {
      try { window.localStorage.setItem(key, deviceId); } catch { /* private mode — state copy below still works */ }
    }
    formData.set('deviceId', deviceId);

    try {
      const result = await submitFeedback(formData);
      if (result.error) { setError(result.error); return; }
      setVoteDeviceId(deviceId);
      setAvgRating(avg);
      setMinRating(Math.min(...ratings));
      setPhase('post-vote');
    } catch {
      setError(t.errorNetwork);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendComment() {
    if (!comment.trim()) return;
    setError('');
    setLoading(true);
    const formData = new FormData();
    formData.set('storeId', store.id);
    formData.set('rating', avgRating.toString());
    formData.set('comment', comment.trim());
    const baseId = voteDeviceId || (typeof window !== 'undefined' ? window.localStorage.getItem('qr-device-id') ?? '' : '');
    formData.set('deviceId', baseId + '-comment');
    try {
      const result = await submitFeedback(formData);
      if (result.error) { setError(result.error); return; }
      setCommentSent(true);
      setPhase('done');
    } catch {
      setError(t.errorNetwork);
    } finally {
      setLoading(false);
    }
  }

  const thankYouScreen = (
    <div style={{ textAlign: 'center', padding: '48px 0' }}>
      <div style={{ fontSize: 64, marginBottom: 24, color: primary }}>✓</div>
      <p style={{ fontSize: 24, fontWeight: 800, color: brand.dark }}>{t.thankYou}</p>
      <p style={{ fontSize: 16, color: '#6B7280', marginTop: 12 }}>{t.thankYouSub}</p>
    </div>
  );

  if (phase === 'done') return thankYouScreen;

  if (phase === 'post-vote') {
    // Ask "what went wrong" not only on a low average but also when any single
    // question got 1-2 stars — [1,5,5] rounds to 4 but is a real complaint.
    if (avgRating >= 4 && minRating > 2) return thankYouScreen;
    if (commentSent) return thankYouScreen;

    return (
      <div style={{ padding: '8px 0', textAlign: 'left' }}>
        <p style={{ fontWeight: 700, fontSize: 18, marginBottom: 16, color: brand.dark }}>
          {t.privateFeedback}
        </p>
        <textarea
          rows={5}
          maxLength={1000}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t.commentPlaceholder}
          style={{
            width: '100%',
            padding: 16,
            border: '2px solid #E5E7EB',
            borderRadius: 12,
            fontSize: 16,
            fontFamily: 'inherit',
            resize: 'none',
            boxSizing: 'border-box',
            outline: 'none',
          }}
        />
        {error && <p style={{ color: '#EF4444', fontSize: 14, marginTop: 8 }}>{error}</p>}
        <button
          type="button"
          onClick={handleSendComment}
          disabled={!comment.trim() || loading}
          style={{
            marginTop: 16,
            width: '100%',
            padding: '14px',
            background: comment.trim() ? primary : '#D1D5DB',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 16,
            cursor: comment.trim() ? 'pointer' : 'not-allowed',
            transition: 'background 0.2s',
          }}
        >
          {loading ? '...' : t.sendComment}
        </button>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Noto Sans', 'Inter', sans-serif", margin: -24 }}>
      <div
        style={{
          background: primary,
          color: '#fff',
          padding: '62px 24px 30px',
          borderRadius: '16px 16px 0 0',
          textAlign: 'center',
        }}
      >
        <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 30, letterSpacing: 6, lineHeight: 1, marginBottom: 20 }}>
          ★ ★ ★ ★ ★
        </div>
        <h1 style={{ margin: 0, fontSize: 23, lineHeight: 1.15, fontWeight: 800, letterSpacing: 0 }}>
          {pageTitle}
        </h1>
      </div>

      <div style={{ padding: '22px 24px 28px' }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, justifyContent: 'center' }}>
        {(['uz', 'ru'] as Language[]).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            style={{
              padding: '8px 24px',
              borderRadius: 24,
              border: '2px solid',
              borderColor: lang === l ? primary : '#E5E7EB',
              background: lang === l ? primary : 'white',
              color: lang === l ? 'white' : '#6B7280',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {l === 'uz' ? "O'ZB" : 'РУС'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 28 }}>
        {questions[lang].map((q, i) => (
          <div
            key={i}
            style={{
              padding: '20px',
              background: cardBackground,
              border: '2px solid',
              borderColor: ratings[i] > 0 ? primary : cardBorder,
              borderRadius: 14,
              textAlign: 'left',
              transition: 'border-color 0.2s',
            }}
          >
            <p style={{ fontWeight: 800, fontSize: 18, margin: '0 0 4px', color: brand.dark, fontFamily: "'Noto Sans', 'Inter', sans-serif" }}>{q.label}</p>
            <p style={{ fontSize: 14, color: '#4B5563', margin: '0 0 16px', lineHeight: 1.4, fontWeight: 600, fontFamily: "'Noto Sans', 'Inter', sans-serif" }}>{q.sub}</p>
            <StarRow 
              value={ratings[i]} 
              activeColor={primary}
              onChange={(v) => {
                const next = [...ratings]; next[i] = v; setRatings(next);
              }} 
            />
          </div>
        ))}
      </div>

      {error && <p style={{ color: '#EF4444', fontSize: 14, marginBottom: 16 }}>{error}</p>}

      <button
        type="button"
        onClick={handleSubmitVote}
        disabled={!allRated || loading}
        style={{
          width: '100%',
          padding: '20px',
          background: allRated ? primary : '#D1D5DB',
          color: '#fff',
          border: 'none',
          borderRadius: 16,
          fontWeight: 800,
          fontSize: 16,
          cursor: allRated ? 'pointer' : 'not-allowed',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          transition: 'background 0.2s',
        }}
      >
        {loading ? '...' : t.submitVote}
      </button>

      {!allRated && (
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: '#9CA3AF' }}>
          {t.allRequired}
        </p>
      )}
      </div>
    </div>
  );
}

