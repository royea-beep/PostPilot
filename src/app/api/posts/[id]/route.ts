import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@royea/shared-utils/auth-guard';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/posts/:id
 *
 * Returns full detail for a single publish job, including raw API response
 * for debugging failed publishes.
 */
export const GET = withAuth((async (req: NextRequest, userId: string) => {
  const url = new URL(req.url);
  const id = url.pathname.split('/').pop();

  if (!id) {
    return NextResponse.json({ error: 'Missing post ID' }, { status: 400 });
  }

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      brand: {
        select: { id: true, name: true, userId: true },
      },
      connection: {
        select: {
          platform: true,
          accountName: true,
          pageName: true,
          status: true,
        },
      },
      media: {
        select: {
          id: true,
          filename: true,
          mediaType: true,
          mimeType: true,
          sizeBytes: true,
        },
      },
      draft: {
        select: {
          id: true,
          caption: true,
          editedCaption: true,
          optionIndex: true,
          format: true,
        },
      },
    },
  });

  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  // Verify ownership
  if (post.brand.userId !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Parse raw response for display
  let rawResponse = null;
  if (post.rawResponse) {
    try { rawResponse = JSON.parse(post.rawResponse); } catch { rawResponse = post.rawResponse; }
  }

  return NextResponse.json({
    ...post,
    rawResponse,
  });
}) as unknown as import('@royea/shared-utils/auth-guard').AuthRouteHandler) as unknown as (req: NextRequest, _context: RouteContext) => Promise<NextResponse>;
