import { NextResponse } from 'next/server';
import { buildReportMessage, sendTelegramReport, checkApiKey } from '@/lib/report-builder';

export async function POST(req: Request) {
  if (!checkApiKey(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const message = await buildReportMessage('daily');
    await sendTelegramReport(message);
    return NextResponse.json({ ok: true, sent: true });
  } catch (err) {
    console.error('daily-report-error', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
