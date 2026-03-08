import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/edge-rate-limit';

const MINUTE = 60 * 1000;

const rateLimitRules: { pattern: RegExp; limit: number; windowMs: number }[] = [
  { pattern: /^\/api\/auth\//, limit: 10, windowMs: MINUTE },
  { pattern: /^\/api\/upload/, limit: 20, windowMs: MINUTE },
  { pattern: /^\/api\/drafts/, limit: 30, windowMs: MINUTE },
  { pattern: /^\/api\/publish/, limit: 10, windowMs: MINUTE },
];

export function middleware(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for') || 'unknown';
  const pathname = request.nextUrl.pathname;

  for (const rule of rateLimitRules) {
    if (rule.pattern.test(pathname)) {
      const key = `${ip}:${rule.pattern.source}`;
      const result = rateLimit(key, rule.limit, rule.windowMs);

      if (!result.success) {
        return NextResponse.json(
          { error: 'Too many requests' },
          { status: 429 }
        );
      }

      const response = NextResponse.next();
      response.headers.set('X-RateLimit-Remaining', String(result.remaining));
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
