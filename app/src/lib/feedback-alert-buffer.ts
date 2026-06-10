// Debounces low-rating feedback alerts so the customer's vote + optional
// follow-up comment within ~30s arrive as ONE Telegram message.
// REQUIRES single-process deployment (no horizontal scaling). Railway today
// runs one replica; if that ever changes, the worst-case regression is
// duplicate alerts, which is the pre-buffer behaviour.

import { sendFeedbackAlert, sendFollowUpComment, type FeedbackAlertInput } from './notifications';

const DEBOUNCE_MS = 30_000;
// The comment box has no timeout, so keep the "already alerted" memory long
// enough that a slow typist gets a follow-up message, not a duplicate alert.
const RECENTLY_FLUSHED_TTL_MS = 30 * 60_000;

type Pending = {
  timer: NodeJS.Timeout;
  payload: FeedbackAlertInput;
};

type FlushedRecord = {
  storeName: string;
  expiresAt: number;
};

const pendingAlerts: Map<string, Pending> = new Map();
const recentlyFlushed: Map<string, FlushedRecord> = new Map();

function safeSend(payload: FeedbackAlertInput): void {
  sendFeedbackAlert(payload).catch((err) => console.error('feedback-alert-send-error', err));
}

function safeSendFollowUp(storeName: string, typedComment: string): void {
  sendFollowUpComment(storeName, typedComment).catch((err) =>
    console.error('feedback-followup-send-error', err),
  );
}

function markFlushed(sessionKey: string, storeName: string): void {
  recentlyFlushed.set(sessionKey, {
    storeName,
    expiresAt: Date.now() + RECENTLY_FLUSHED_TTL_MS,
  });
}

function expireFlushed(): void {
  const now = Date.now();
  for (const [key, rec] of recentlyFlushed) {
    if (rec.expiresAt <= now) recentlyFlushed.delete(key);
  }
}

export function scheduleAlert(sessionKey: string, payload: FeedbackAlertInput): void {
  expireFlushed();

  const existing = pendingAlerts.get(sessionKey);
  if (existing) {
    clearTimeout(existing.timer);
    pendingAlerts.delete(sessionKey);
  }

  const timer = setTimeout(() => {
    pendingAlerts.delete(sessionKey);
    markFlushed(sessionKey, payload.storeName);
    safeSend(payload);
  }, DEBOUNCE_MS);

  if (typeof timer.unref === 'function') timer.unref();

  pendingAlerts.set(sessionKey, { timer, payload });
}

export function flushAlert(sessionKey: string, payload: FeedbackAlertInput): void {
  expireFlushed();

  const existing = pendingAlerts.get(sessionKey);
  if (existing) {
    clearTimeout(existing.timer);
    pendingAlerts.delete(sessionKey);
    markFlushed(sessionKey, existing.payload.storeName);
    // Keep the vote payload (so the per-question breakdown survives) and
    // attach the customer's typed comment as a separate field.
    safeSend({ ...existing.payload, typedComment: payload.comment });
    return;
  }

  const flushed = recentlyFlushed.get(sessionKey);
  if (flushed) {
    safeSendFollowUp(flushed.storeName, payload.comment);
    return;
  }

  markFlushed(sessionKey, payload.storeName);
  safeSend(payload);
}

// True when this feedback session already has a pending or recently-sent
// alert — used so a follow-up comment row still reaches flushAlert even when
// its own avg rating is above the alert threshold.
export function hasAlertSession(sessionKey: string): boolean {
  expireFlushed();
  return pendingAlerts.has(sessionKey) || recentlyFlushed.has(sessionKey);
}

// Best-effort: flush pending alerts immediately on shutdown so a deploy or
// restart inside the 30s debounce window doesn't silently drop a low-score
// alert (nightly auto-deploys made that a daily-real window).
function flushAllPendingOnShutdown(): void {
  for (const [key, pending] of pendingAlerts) {
    clearTimeout(pending.timer);
    pendingAlerts.delete(key);
    markFlushed(key, pending.payload.storeName);
    safeSend(pending.payload);
  }
}
process.once('SIGTERM', flushAllPendingOnShutdown);
process.once('SIGINT', flushAllPendingOnShutdown);

export const __testing = {
  pendingAlerts,
  recentlyFlushed,
  DEBOUNCE_MS,
  RECENTLY_FLUSHED_TTL_MS,
};
