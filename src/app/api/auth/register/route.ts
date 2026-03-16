import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, signAccessToken, signRefreshToken } from '@royea/shared-utils/auth';
import { registerSchema } from '@/lib/validation';

// ---------------------------------------------------------------------------
// In-memory rate limiter — 3 attempts per 15 minutes per IP
// ---------------------------------------------------------------------------
const registerAttempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, max = 3, windowMs = 900000): boolean {
  const now = Date.now();
  // Cleanup old entries periodically
  if (registerAttempts.size > 500) {
    for (const [k, v] of registerAttempts) {
      if (now > v.resetAt) registerAttempts.delete(k);
    }
  }
  const entry = registerAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    registerAttempts.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many attempts. Try again in 15 minutes.' },
        { status: 429 },
      );
    }

    const body = await req.json();
    const data = registerSchema.parse(body);
    const promoCode = typeof body.promoCode === 'string' ? body.promoCode.trim() : '';

    // Validate promo code if provided
    let plan = 'FREE';
    if (promoCode) {
      const adminCode = process.env.PROMO_CODE_ADMIN;
      const friendCode = process.env.PROMO_CODE_FRIEND;

      if (adminCode && promoCode === adminCode) {
        plan = 'AGENCY';
      } else if (friendCode && promoCode === friendCode) {
        plan = 'PRO';
      } else {
        return NextResponse.json({ error: 'Invalid promo code' }, { status: 400 });
      }
    }

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const passwordHash = await hashPassword(data.password);
    const user = await prisma.user.create({
      data: { email: data.email, passwordHash, name: data.name, businessName: data.businessName, plan },
    });

    const payload = { userId: user.id, email: user.email };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, businessName: user.businessName },
      accessToken,
      refreshToken,
    }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    if (process.env.NODE_ENV !== 'production') console.error('Register error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
