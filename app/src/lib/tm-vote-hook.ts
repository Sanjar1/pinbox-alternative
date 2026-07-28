import { newReqId, reportLog } from './report-builder';

export type TmVotePush = {
  feedbackId: string;
  storeId: string;
  storeName: string;
  rating: number;
  minQuestionRating: number;
  /** Advisory only — the bot recomputes pass/fail from rating + minQuestionRating. */
  positive: boolean;
  /** True when anti-abuse marked the row FLAGGED. The bot still counts these. */
  flagged: boolean;
  /** True for tester-device rows, which bypass every anti-abuse rule. The bot ignores these. */
  tester: boolean;
  votedAt: Date;
};

const TIMEOUT_MS = 2500;

/**
 * Tell the TM checklist bot that a vote landed, so a territorial manager standing in the
 * store gets instant credit for it during their 30-minute task.
 *
 * Deliberately fire-and-forget. Two hard constraints shape this:
 *
 * 1. The customer's vote must never be delayed or failed because the bot is down. 41
 *    printed posters point at this submit path; it is not allowed to grow a dependency.
 * 2. This app sleeps when idle under a $1/month usage budget (exceeding it took every
 *    poster offline on 2026-07-05). Pushing from a request that is ALREADY awake serving
 *    the customer adds zero wake time, which is why the bot never polls us.
 */
export function pushVoteToTmBot(vote: TmVotePush): void {
  const url = process.env.TM_BOT_VOTE_HOOK_URL?.trim();
  const secret = process.env.TM_BOT_VOTE_HOOK_SECRET?.trim();
  if (!url || !secret) return;

  const reqId = newReqId();

  void fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({ ...vote, votedAt: vote.votedAt.toISOString() }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
    .then((res) => {
      if (!res.ok) {
        // Logged, never thrown: a dead integration must show up in Railway logs rather
        // than as "the TMs mysteriously stopped passing task 1".
        reportLog('tm_vote_hook_failed', {
          reqId,
          storeName: vote.storeName,
          feedbackId: vote.feedbackId,
          status: res.status,
        });
      }
    })
    .catch((err: unknown) => {
      reportLog('tm_vote_hook_failed', {
        reqId,
        storeName: vote.storeName,
        feedbackId: vote.feedbackId,
        error: String(err),
      });
    });
}
