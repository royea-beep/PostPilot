import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyRefreshToken, signAccessToken, signRefreshToken } from '@royea/shared-utils/auth';

export async function POST(req: NextRequest) {
  try {
    const { refreshToken } = await req.json();
    if (!refreshToken) return NextResponse.json({ error: 'Missing refresh token' }, { status: 400 });

    const payload = verifyRefreshToken(refreshToken);

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
    }

    // Revoke old token
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });

    // Issue new pair
    const newAccess = signAccessToken({ userId: payload.userId, email: payload.email });
    const newRefresh = signRefreshToken({ userId: payload.userId, email: payload.email });

    await prisma.refreshToken.create({
      data: { token: newRefresh, userId: payload.userId, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });

    return NextResponse.json({ accessToken: newAccess, refreshToken: newRefresh });
  } catch {
    return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
  }
}
