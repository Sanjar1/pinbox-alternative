'use server';

import { prisma } from '@/lib/db';
import { toCleanString, validateFeedbackInput } from '@/lib/validation';
import { sendFeedbackAlert } from '@/lib/notifications';
import { writeAuditLog } from '@/lib/audit';
import { cookies, headers } from 'next/headers';
import { getClientIp, getOrCreateDeviceId, sha256 } from '@/lib/feedback-protection';

export async function submitFeedback(formData: FormData): Promise<{ error?: string; success?: string }> {
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
    return { error: 'Store not found' };
  }

  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  const recentStoreCount = await prisma.feedback.count({
    where: {
      storeId: store.id,
      createdAt: { gte: oneMinuteAgo },
    },
  });
  if (recentStoreCount > 20) {
    return { error: 'Too many feedback requests. Please try again in a minute.' };
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
      return { error: 'Too many feedback submissions from this contact.' };
    }
  }

  const cookieStore = await cookies();
  const headerStore = await headers();
  const clientIp = getClientIp(headerStore);
  const userAgent = headerStore.get('user-agent')?.trim() ?? '';
  const salt = process.env.FEEDBACK_HASH_SALT?.trim() || process.env.SESSION_SECRET?.trim() || 'pinbox-feedback';

  const deviceId = getOrCreateDeviceId(cookieStore, clientDeviceId);
  const deviceHash = sha256(`${salt}:device:${deviceId}`);
  const ipHash = clientIp ? sha256(`${salt}:ip:${clientIp}`) : '';
  const userAgentHash = userAgent ? sha256(`${salt}:ua:${userAgent}`) : '';

  const antiAbuseDisabled = process.env.DISABLE_ANTI_ABUSE === '1';
  let suspicious = false;

  if (!antiAbuseDisabled) {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyDeviceVotes = await prisma.feedback.count({
      where: {
        storeId: store.id,
        deviceHash,
        createdAt: { gte: oneWeekAgo },
      },
    });
    if (weeklyDeviceVotes >= 1) {
      return { error: 'You can submit one vote per 7 days from this device.' };
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
        return { error: 'Too many feedback submissions from this network today.' };
      }
      if (ipBurstCount >= 5) {
        return { error: 'Too many feedback requests. Please wait and try again.' };
      }

      if (ipDailyCount >= 8 || ipBurstCount >= 3) {
        suspicious = true;
      }
    }
  }

  await prisma.feedback.create({
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
  });

  await writeAuditLog({
    action: 'FEEDBACK_SUBMITTED',
    tenantId: store.tenantId,
    details: { storeId: store.id, rating, suspicious },
  });

  if (rating <= 3) {
    await sendFeedbackAlert({
      storeName: store.name,
      rating,
      comment,
      contact,
    });
  }

  return { success: 'ok' };
}
