import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth-guard';

// GET /api/stats — aggregate counts across all brands for the authenticated user
export const GET = withAuth(async (_req: NextRequest, userId: string) => {
  const brands = await prisma.brand.findMany({
    where: { userId },
    select: {
      _count: { select: { posts: true, mediaUploads: true } },
    },
  });

  const totalBrands = brands.length;
  const totalPosts = brands.reduce((sum, b) => sum + b._count.posts, 0);
  const totalMedia = brands.reduce((sum, b) => sum + b._count.mediaUploads, 0);

  return NextResponse.json({ totalBrands, totalPosts, totalMedia });
});
