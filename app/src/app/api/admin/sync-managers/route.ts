import { NextResponse } from 'next/server';
import { checkApiKey, newReqId, reportLog } from '@/lib/report-builder';
import { syncManagers } from '@/lib/manager-sync';

export async function POST(req: Request) {
  const reqId = newReqId();
  if (!checkApiKey(req)) {
    reportLog('manager_sync_unauthorized', { reqId });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const result = await syncManagers(reqId);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    reportLog('manager_sync_error', { reqId, error: String(err) });
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
