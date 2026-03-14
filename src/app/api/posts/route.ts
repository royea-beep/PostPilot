import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@royea/shared-utils/auth-guard';

type RouteContext = { params: Promise<Record<string, never>> };

/**
 * GET /api/posts?brandId=xxx&status=SUCCESS|FAILED&limit=50&offset=0
 *
 * Returns publish history for a brand, ordered by most recent first.
 * Includes platform, status, error info, and external links.
 */
export const GET = withAuth((async (req: NextRequest, userId: string) => {
  const brandId = req.nextUrl.searchParams.get('brandId');
  if (!brandId) {
    return NextResponse.json({ error: 'brandId is required' }, { status: 400 });
  }

  // Verify ownership
  const brand = await prisma.brand.findFirst({
    where: { id: brandId, userId },
  });
  if (!brand) {
    return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
  }

  const status = req.nextUrl.searchParams.get('status');
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '50', 10), 100);
  const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0', 10);

  const where: Record<string, unknown> = { brandId };
  if (status) {
    where.status = status;
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        platform: true,
        caption: true,
        hashtags: true,
        format: true,
        status: true,
        errorCode: true,
        errorMessage: true,
        platformPostId: true,
        platformUrl: true,
        retryCount: true,
        publishedAt: true,
        createdAt: true,
        connection: {
          select: {
            accountName: true,
            pageName: true,
          },
        },
        media: {
          select: {
            id: true,
            filename: true,
            mediaType: true,
            mimeType: true,
          },
        },
      },
    }),
    prisma.post.count({ where }),
  ]);

  return NextResponse.json({
    posts,
    total,
    limit,
    offset,
  });
}) as unknown as import('@royea/shared-utils/auth-guard').AuthRouteHandler) as unknown as (req: NextRequest, _context: RouteContext) => Promise<NextResponse>;
