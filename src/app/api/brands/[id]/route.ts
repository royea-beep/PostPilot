import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@royea/shared-utils/auth-guard';

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/brands/:id — full brand detail for agency
export const GET = withAuth((async (req: NextRequest, userId: string) => {
  const id = req.nextUrl.pathname.split('/')[3];

  const brand = await prisma.brand.findFirst({
    where: { id, userId },
    include: {
      socialConnections: true,
      styleProfile: true,
      _count: { select: { posts: true, mediaUploads: true, postDrafts: true } },
    },
  });

  if (!brand) return NextResponse.json({ error: 'Brand not found' }, { status: 404 });

  // Fetch recent posts
  const posts = await prisma.post.findMany({
    where: { brandId: id },
    include: {
      media: { select: { id: true, filename: true, mediaType: true, mimeType: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  // Fetch recent media (exclude filePath to avoid leaking server paths)
  const media = await prisma.mediaUpload.findMany({
    where: { brandId: id },
    select: { id: true, filename: true, mediaType: true, mimeType: true, sizeBytes: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({
    ...brand,
    link: `${process.env.NEXT_PUBLIC_APP_URL || ''}/brand/${brand.token}`,
    posts,
    media,
  });
}) as unknown as import('@royea/shared-utils/auth-guard').AuthRouteHandler) as unknown as (req: NextRequest, context: RouteContext) => Promise<NextResponse>;

// DELETE /api/brands/:id — delete a brand
export const DELETE = withAuth((async (req: NextRequest, userId: string) => {
  const id = req.nextUrl.pathname.split('/')[3];

  const brand = await prisma.brand.findFirst({ where: { id, userId } });
  if (!brand) return NextResponse.json({ error: 'Brand not found' }, { status: 404 });

  await prisma.brand.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}) as unknown as import('@royea/shared-utils/auth-guard').AuthRouteHandler) as unknown as (req: NextRequest, context: RouteContext) => Promise<NextResponse>;
