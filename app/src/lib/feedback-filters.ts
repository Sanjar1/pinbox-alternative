import type { Prisma } from '@prisma/client';

// Low-score sessions write two Feedback rows:
//   1. vote row    — comment = "[ratings] service:X;quality:Y;prices:Z;lang:..."
//   2. comment row — comment = the user's free-text complaint
// Counts/averages should use vote rows only; the "Latest feedback" list should
// show comment rows only. See app/src/app/[slug]/client.tsx submit flow.
const VOTE_PREFIX = '[ratings] service:';

export const VOTE_ROW_FILTER: Prisma.FeedbackWhereInput = {
  comment: { startsWith: VOTE_PREFIX },
};

export const COMMENT_ROW_FILTER: Prisma.FeedbackWhereInput = {
  NOT: { comment: { startsWith: VOTE_PREFIX } },
};
