import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

type IncomingEvent = { type: string; payload?: object; timestamp?: number };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const events = Array.isArray(body?.events) ? (body.events as IncomingEvent[]) : [];
    if (events.length === 0) return NextResponse.json({ ok: true });

    const records = events.map((e) => ({
      type: String(e.type ?? 'unknown'),
      payload: e.payload != null ? JSON.stringify(e.payload) : null,
      timestamp: new Date(typeof e.timestamp === 'number' ? e.timestamp : Date.now()),
    }));

    await prisma.analyticsEvent.createMany({ data: records });

    if (process.env.NODE_ENV === 'development') {
      console.log('[api/events] stored', records.length, 'events');
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('[api/events]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
