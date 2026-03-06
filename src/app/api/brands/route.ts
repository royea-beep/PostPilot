import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth-guard';
import { createBrandSchema } from '@/lib/validation';

// GET /api/brands — list all brands for the authenticated user
export const GET = withAuth(async (_req: NextRequest, userId: string) => {
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
});

// POST /api/brands — create a new brand
export const POST = withAuth(async (req: NextRequest, userId: string) => {
  try {
    const body = await req.json();
    const data = createBrandSchema.parse(body);

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
});
