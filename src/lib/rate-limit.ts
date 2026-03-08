import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { NextRequest, NextResponse } from 'next/server';

// ftable caption API: 30 requests per 15 min per IP (server-to-server from Supabase)
export const ftableCaptionLimiter = new RateLimiterMemory({
  points: 30,
  duration: 15 * 60,
  keyPrefix: 'ftable-caption',
});

function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || '127.0.0.1';
}

export async function applyRateLimit(
  limiter: RateLimiterMemory,
  req: NextRequest
): Promise<NextResponse | null> {
  const ip = getClientIp(req);
  try {
    await limiter.consume(ip);
    return null;
  } catch (err) {
    if (err instanceof RateLimiterRes) {
      const retryAfter = Math.ceil(err.msBeforeNext / 1000);
      return NextResponse.json(
        { error: 'Too many requests. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }
    return null;
  }
}
