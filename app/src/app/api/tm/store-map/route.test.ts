import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  prisma: { store: { findMany: vi.fn() } },
}));
vi.mock('@/lib/report-builder', () => ({
  checkApiKey: vi.fn(),
  newReqId: () => 'req-test',
  reportLog: vi.fn(),
}));

import { prisma } from '@/lib/db';
import { checkApiKey } from '@/lib/report-builder';
import { POST } from './route';

const req = (body: unknown) =>
  new Request('http://x/api/tm/store-map', { method: 'POST', body: JSON.stringify(body) });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(checkApiKey).mockReturnValue(true);
  vi.mocked(prisma.store.findMany).mockResolvedValue([
    { id: 's1', name: 'Сергели оптом' },
    { id: 's2', name: 'Юнусабад' },
    { id: 's3', name: 'Food city' },
  ] as never);
});

describe('POST /api/tm/store-map', () => {
  it('401s without a valid key and never reads the database', async () => {
    vi.mocked(checkApiKey).mockReturnValue(false);
    const res = await POST(req({ names: ['Лавка Юнусабад'] }));
    expect(res.status).toBe(401);
    expect(prisma.store.findMany).not.toHaveBeenCalled();
  });

  it('maps sheet names to store ids and reports unmatched', async () => {
    const res = await POST(req({ names: ['Лавка Юнусабад', 'Лавка Марс'] }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.map['Лавка Юнусабад']).toEqual({ storeId: 's2', dbName: 'Юнусабад' });
    expect(body.map['Лавка Марс']).toBeUndefined();
    expect(body.unmatched).toEqual(['Лавка Марс']);
  });

  it('resolves alias names through the shared matcher', async () => {
    const body = await (await POST(req({ names: ['Лавка Фуд сити'] }))).json();
    expect(body.map['Лавка Фуд сити']).toEqual({ storeId: 's3', dbName: 'Food city' });
  });

  it('excludes archived stores', async () => {
    await POST(req({ names: ['Лавка Юнусабад'] }));
    expect(vi.mocked(prisma.store.findMany).mock.calls[0][0]).toMatchObject({
      where: { archivedAt: null },
    });
  });

  it('400s when names is not an array', async () => {
    expect((await POST(req({ names: 'Юнусабад' }))).status).toBe(400);
  });

  it('400s when names contains a non-string', async () => {
    expect((await POST(req({ names: ['Юнусабад', 7] }))).status).toBe(400);
  });

  it('400s on malformed JSON', async () => {
    const bad = new Request('http://x/api/tm/store-map', { method: 'POST', body: '{oops' });
    expect((await POST(bad)).status).toBe(400);
  });

  it('handles an empty name list without error', async () => {
    const res = await POST(req({ names: [] }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ map: {}, unmatched: [] });
  });
});
