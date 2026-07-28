import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('./report-builder', () => ({
  newReqId: () => 'req-test',
  reportLog: vi.fn(),
}));

import { pushVoteToTmBot } from './tm-vote-hook';
import { reportLog } from './report-builder';

const VOTE = {
  feedbackId: 'f1',
  storeId: 's1',
  storeName: 'Сергели оптом',
  rating: 5,
  minQuestionRating: 4,
  positive: true,
  flagged: false,
  tester: false,
  votedAt: new Date('2026-07-28T09:12:33.000Z'),
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.TM_BOT_VOTE_HOOK_URL = 'https://bot.example/qr-vote';
  process.env.TM_BOT_VOTE_HOOK_SECRET = 'shh';
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));
});

afterEach(() => {
  delete process.env.TM_BOT_VOTE_HOOK_URL;
  delete process.env.TM_BOT_VOTE_HOOK_SECRET;
  vi.unstubAllGlobals();
});

describe('pushVoteToTmBot', () => {
  it('posts the documented payload with a bearer secret', async () => {
    pushVoteToTmBot(VOTE);
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());

    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://bot.example/qr-vote');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer shh');
    expect(JSON.parse(init.body as string)).toEqual({
      feedbackId: 'f1',
      storeId: 's1',
      storeName: 'Сергели оптом',
      rating: 5,
      minQuestionRating: 4,
      positive: true,
      flagged: false,
      tester: false,
      votedAt: '2026-07-28T09:12:33.000Z',
    });
  });

  it('passes the flagged and tester flags through so the bot can decide', async () => {
    pushVoteToTmBot({ ...VOTE, flagged: true, tester: true, positive: false });
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    const body = JSON.parse(
      (vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string
    );
    expect(body).toMatchObject({ flagged: true, tester: true, positive: false });
  });

  it('does nothing when the hook url is unset', () => {
    delete process.env.TM_BOT_VOTE_HOOK_URL;
    pushVoteToTmBot(VOTE);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('does nothing when the secret is unset', () => {
    delete process.env.TM_BOT_VOTE_HOOK_SECRET;
    pushVoteToTmBot(VOTE);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('never throws when the bot is unreachable, and logs the failure', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('ECONNREFUSED'));
    expect(() => pushVoteToTmBot(VOTE)).not.toThrow();
    await vi.waitFor(() =>
      expect(reportLog).toHaveBeenCalledWith('tm_vote_hook_failed', expect.anything())
    );
  });

  it('never throws when the bot returns 500, and logs the status', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 500 } as Response);
    expect(() => pushVoteToTmBot(VOTE)).not.toThrow();
    await vi.waitFor(() =>
      expect(reportLog).toHaveBeenCalledWith(
        'tm_vote_hook_failed',
        expect.objectContaining({ status: 500 })
      )
    );
  });

  it('does not log a failure on success', async () => {
    pushVoteToTmBot(VOTE);
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    expect(reportLog).not.toHaveBeenCalledWith('tm_vote_hook_failed', expect.anything());
  });

  it('returns synchronously without awaiting the request', () => {
    let settled = false;
    vi.mocked(fetch).mockImplementation(
      () => new Promise((res) => setTimeout(() => { settled = true; res({ ok: true } as Response); }, 50))
    );
    pushVoteToTmBot(VOTE);
    // The customer's vote must never wait on the bot.
    expect(settled).toBe(false);
  });
});
