import { NextResponse } from 'next/server';
import {
  buildReportMessage,
  sendTelegramReport,
  checkApiKey,
  reportLog,
  newReqId,
  type ReportCtx,
} from '@/lib/report-builder';

export async function POST(req: Request) {
  const ctx: ReportCtx = { reqId: newReqId(), period: 'monthly' };
  const startedAt = Date.now();
  reportLog('request_received', { ...ctx, url: req.url });

  const authed = checkApiKey(req);
  reportLog('auth_checked', { ...ctx, authed });
  if (!authed) {
    reportLog('auth_failed', ctx);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    reportLog('build_start', ctx);
    const message = await buildReportMessage('monthly', ctx);
    await sendTelegramReport(message, ctx);
    reportLog('request_done', { ...ctx, ok: true, durationMs: Date.now() - startedAt });
    return NextResponse.json({ ok: true, sent: true });
  } catch (err) {
    reportLog('request_error', {
      ...ctx,
      durationMs: Date.now() - startedAt,
      error: String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    console.error('monthly-report-error', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
