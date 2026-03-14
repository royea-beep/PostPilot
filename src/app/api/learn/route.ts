import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/learn — accept batched learning events.
 *
 * Rate limit: 100 events per IP per minute.
 * Always returns 200 (fire-and-forget).
 */

const ipCounters = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipCounters.get(ip);

  if (!entry || now > entry.resetAt) {
    ipCounters.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }

  entry.count += 1;
  return entry.count > 100;
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';

    if (isRateLimited(ip)) {
      return NextResponse.json({ ok: true, dropped: true });
    }

    let events: unknown[];
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      events = await req.json();
    } else {
      // sendBeacon with Blob might come as text
      const text = await req.text();
      events = JSON.parse(text);
    }

    if (!Array.isArray(events)) {
      return NextResponse.json({ ok: true });
    }

    // Log events (if learning_events table exists in DB, insert here)
    // For now, log to stdout for monitoring
    for (const event of events) {
      if (typeof event === 'object' && event !== null) {
        const e = event as Record<string, unknown>;
        console.log(
          `[learn] ${e.project}/${e.event} category=${e.category} value=${e.value ?? '-'} ts=${e.ts}`,
        );
      }
    }

    return NextResponse.json({ ok: true, received: events.length });
  } catch {
    // Always return 200 — fire-and-forget
    return NextResponse.json({ ok: true });
  }
}
