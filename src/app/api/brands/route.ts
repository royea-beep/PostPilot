import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@royea/shared-utils/auth-guard';
import { createBrandSchema } from '@/lib/validation';
import { getPlanLimits } from '@/lib/payments';
import { emitServerEvent } from '@/lib/learning';

type RouteContext = { params: Promise<Record<string, never>> };

// GET /api/brands — list all brands for the authenticated user
export const GET = withAuth((async (_req: NextRequest, userId: string) => {
  const brands = await prisma.brand.findMany({
    where: { userId },
    include: {
      socialConnections: { select: { id: true, platform: true, accountName: true, status: true, accountAvatar: true } },
      styleProfile: { select: { analyzedPostCount: true } },
      _count: { select: { posts: true, mediaUploads: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const mapped = brands.map((b) => ({
    ...b,
    link: `${process.env.NEXT_PUBLIC_APP_URL || ''}/brand/${b.token}`,
  }));

  return NextResponse.json(mapped);
}) as unknown as import('@royea/shared-utils/auth-guard').AuthRouteHandler) as unknown as (req: NextRequest, _context: RouteContext) => Promise<NextResponse>;

// POST /api/brands — create a new brand
export const POST = withAuth((async (req: NextRequest, userId: string) => {
  try {
    const body = await req.json();
    const data = createBrandSchema.parse(body);

    // Check brand limit
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true, _count: { select: { brands: true } } } });
    if (user) {
      const limits = getPlanLimits(user.plan);
      if (limits.brandsLimit > 0 && user._count.brands >= limits.brandsLimit) {
        return NextResponse.json({ error: 'Brand limit reached. Upgrade your plan.', code: 'LIMIT_REACHED' }, { status: 403 });
      }
    }

    const brand = await prisma.brand.create({
      data: {
        userId,
        name: data.name,
        description: data.description,
        industry: data.industry,
        language: data.language,
        timezone: data.timezone,
      },
      include: { socialConnections: true },
    });

    // Learning hook: brandCreated
    emitServerEvent('brand_created', 'onboarding', undefined, { brandName: brand.name });

    return NextResponse.json({
      ...brand,
      link: `${process.env.NEXT_PUBLIC_APP_URL || ''}/brand/${brand.token}`,
    }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    console.error('Create brand error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}) as unknown as import('@royea/shared-utils/auth-guard').AuthRouteHandler) as unknown as (req: NextRequest, _context: RouteContext) => Promise<NextResponse>;
