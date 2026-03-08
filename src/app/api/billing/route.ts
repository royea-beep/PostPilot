import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@royea/shared-utils/auth-guard';
import { getPlanLimits } from '@/lib/payments';

type RouteContext = { params: Promise<Record<string, never>> };

export const GET = withAuth((async (_req: NextRequest, userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      subscriptionStatus: true,
      currentPeriodEnd: true,
      postsThisMonth: true,
      _count: { select: { brands: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const limits = getPlanLimits(user.plan);

  return NextResponse.json({
    plan: user.plan,
    subscriptionStatus: user.subscriptionStatus,
    currentPeriodEnd: user.currentPeriodEnd,
    postsThisMonth: user.postsThisMonth,
    brandsCount: user._count.brands,
    limits,
  });
}) as unknown as import('@royea/shared-utils/auth-guard').AuthRouteHandler) as unknown as (req: NextRequest, _context: RouteContext) => Promise<NextResponse>;
