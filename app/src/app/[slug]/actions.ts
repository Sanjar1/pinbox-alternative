'use server';

import { prisma, withDbRetry } from '@/lib/db';
import { toCleanString, validateFeedbackInput } from '@/lib/validation';
import { scheduleAlert, flushAlert, hasAlertSession } from '@/lib/feedback-alert-buffer';
import { parseRatingsBreakdown } from '@/lib/notifications';
import { writeAuditLog } from '@/lib/audit';
import { cookies, headers } from 'next/headers';
import { getClientIp, getOrCreateDeviceId, isTesterDeviceId, sha256 } from '@/lib/feedback-protection';
import { pushVoteToTmBot } from '@/lib/tm-vote-hook';

export async function submitFeedback(formData: FormData): Promise<{ error?: string; success?: string }> {
  const submittedAt = new Date();
  const storeId = toCleanString(formData.get('storeId'));
  const rating = Number.parseInt(toCleanString(formData.get('rating')), 10);
  const comment = toCleanString(formData.get('comment'));
  const contact = toCleanString(formData.get('contact'));
  const clientDeviceId = toCleanString(formData.get('deviceId'));

  const validationError = validateFeedbackInput({
    storeId,
    rating,
    comment,
    contact,
  });
  if (validationError) {
    return { error: validationError };
  }

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { id: true, name: true, tenantId: true },
  });
  if (!store) {
    return { error: 'Магазин не найден' };
  }

  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  const recentStoreCount = await prisma.feedback.count({
    where: {
      storeId: store.id,
      createdAt: { gte: oneMinuteAgo },
    },
  });
  if (recentStoreCount > 20) {
    return { error: 'Слишком много отзывов. Попробуйте через минуту.' };
  }

  if (contact) {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentContactCount = await prisma.feedback.count({
      where: {
        storeId: store.id,
        contact,
        createdAt: { gte: oneDayAgo },
      },
    });
    if (recentContactCount >= 3) {
      return { error: 'Слишком много отзывов с этим контактом.' };
    }
  }

  const cookieStore = await cookies();
  const headerStore = await headers();
  const clientIp = getClientIp(headerStore);
  const userAgent = headerStore.get('user-agent')?.trim() ?? '';
  const salt = process.env.FEEDBACK_HASH_SALT?.trim() || process.env.SESSION_SECRET?.trim() || 'pinbox-feedback';

  const deviceId = getOrCreateDeviceId(cookieStore, clientDeviceId);
  const testerBypass = isTesterDeviceId(deviceId);
  const deviceHash = sha256(`${salt}:device:${deviceId}`);
  const ipHash = clientIp ? sha256(`${salt}:ip:${clientIp}`) : '';
  const userAgentHash = userAgent ? sha256(`${salt}:ua:${userAgent}`) : '';

  const antiAbuseDisabled = process.env.DISABLE_ANTI_ABUSE === '1';
  let suspicious = false;

  if (!antiAbuseDisabled && !testerBypass) {
    const deviceCooldownStart = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000);
    const deviceVotesInCooldown = await prisma.feedback.count({
      where: {
        storeId: store.id,
        deviceHash,
        createdAt: { gte: deviceCooldownStart },
      },
    });
    if (deviceVotesInCooldown >= 1) {
      return { error: 'С этого устройства можно голосовать один раз в 35 дней.' };
    }

    if (ipHash) {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

      const [ipDailyCount, ipBurstCount] = await Promise.all([
        prisma.feedback.count({
          where: {
            storeId: store.id,
            ipHash,
            createdAt: { gte: oneDayAgo },
          },
        }),
        prisma.feedback.count({
          where: {
            storeId: store.id,
            ipHash,
            createdAt: { gte: tenMinutesAgo },
          },
        }),
      ]);

      if (ipDailyCount >= 25) {
        return { error: 'Слишком много отзывов с этой сети сегодня.' };
      }
      if (ipBurstCount >= 5) {
        return { error: 'Слишком много запросов. Подождите немного и попробуйте снова.' };
      }

      if (ipDailyCount >= 8 || ipBurstCount >= 3) {
        suspicious = true;
      }
    }
  }

  const created = await withDbRetry(() =>
    prisma.feedback.create({
      data: {
        storeId: store.id,
        rating,
        comment,
        contact,
        status: suspicious ? 'FLAGGED' : 'NEW',
        deviceHash,
        ipHash: ipHash || null,
        userAgentHash: userAgentHash || null,
      },
    }),
  );

  await writeAuditLog({
    action: 'FEEDBACK_SUBMITTED',
    tenantId: store.tenantId,
    details: { storeId: store.id, rating, suspicious },
  });

  // Alert when the average is low OR any single question got 1-2 stars —
  // ratings like [1,5,5] round to 4 but are real complaints. For follow-up
  // comment rows (avg can be 4 in that case) we also flush when this session
  // already has a pending/recent alert, so the typed comment is never dropped.
  const isVoteCall = comment.startsWith('[ratings]');
  const breakdown = isVoteCall ? parseRatingsBreakdown(comment) : null;
  const minQuestionRating = breakdown
    ? Math.min(breakdown.service, breakdown.quality, breakdown.prices)
    : rating;
  const baseDeviceId = isVoteCall ? clientDeviceId : clientDeviceId.replace(/-comment$/, '');
  const sessionKey = `${store.id}:${baseDeviceId}`;
  const shouldAlert = isVoteCall
    ? rating <= 3 || minQuestionRating <= 2
    : rating <= 3 || hasAlertSession(sessionKey);
  if (shouldAlert) {
    const payload = {
      storeName: store.name,
      rating,
      comment,
      contact,
      submittedAt,
    };
    if (isVoteCall) {
      scheduleAlert(sessionKey, payload);
    } else {
      flushAlert(sessionKey, payload);
    }
  }

  // Let the TM checklist bot credit a territorial manager who is standing in this store
  // running their 30-minute QR-vote task. Vote rows only — the follow-up comment row is
  // the same customer event and must not count twice. `positive` is the exact complement
  // of the isVoteCall branch of `shouldAlert` above, so the bot and this app can never
  // disagree about what counts as a complaint. Fire-and-forget: never blocks the vote.
  if (isVoteCall) {
    pushVoteToTmBot({
      feedbackId: created.id,
      storeId: store.id,
      storeName: store.name,
      rating,
      minQuestionRating,
      positive: !(rating <= 3 || minQuestionRating <= 2),
      flagged: suspicious,
      tester: testerBypass,
      votedAt: created.createdAt,
    });
  }

  return { success: 'ok' };
}
