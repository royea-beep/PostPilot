import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@royea/shared-utils/auth-guard';

type RouteContext = { params: Promise<Record<string, never>> };

// POST /api/billing/promo — apply a promo code to upgrade the user's plan
export const POST = withAuth((async (req: NextRequest, userId: string) => {
  const body = await req.json();
  const code = typeof body.code === 'string' ? body.code.trim() : '';

  if (!code) {
    return NextResponse.json({ error: 'Missing promo code' }, { status: 400 });
  }

  const adminCode = process.env.PROMO_CODE_ADMIN;
  const friendCode = process.env.PROMO_CODE_FRIEND;

  let newPlan: string;
  if (adminCode && code === adminCode) {
    newPlan = 'AGENCY';
  } else if (friendCode && code === friendCode) {
    newPlan = 'PRO';
  } else {
    return NextResponse.json({ error: 'Invalid promo code' }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { plan: newPlan, subscriptionStatus: 'ACTIVE' },
    select: { id: true, plan: true },
  });

  return NextResponse.json({ plan: user.plan, message: `Upgraded to ${newPlan}` });
}) as unknown as import('@royea/shared-utils/auth-guard').AuthRouteHandler) as unknown as (req: NextRequest, _context: RouteContext) => Promise<NextResponse>;
