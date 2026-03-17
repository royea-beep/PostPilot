import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@royea/shared-utils/auth-guard';

type RouteContext = { params: Promise<Record<string, never>> };

// GET /api/analytics — full analytics data for authenticated user
export const GET = withAuth((async (_req: NextRequest, userId: string) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Get all brand IDs for this user
  const brands = await prisma.brand.findMany({
    where: { userId },
    select: {
      id: true,
      socialConnections: { select: { platform: true, status: true } },
    },
  });
  const brandIds = brands.map((b) => b.id);

  if (brandIds.length === 0) {
    return NextResponse.json({
      totalPosts: 0,
      thisMonth: 0,
      brandsCount: 0,
      platformsConnected: 0,
      successRate: { rate: 0, succeeded: 0, total: 0 },
      platformBreakdown: [],
      weeklyPosts: [],
      scheduled: [],
      statusBreakdown: [],
    });
  }

  // Run all queries in parallel
  const [
    totalPosts,
    thisMonth,
    successCount,
    failedCount,
    platformGroups,
    weeklyPosts,
    scheduled,
    statusGroups,
  ] = await Promise.all([
    // Total posts all time
    prisma.post.count({ where: { brandId: { in: brandIds } } }),

    // Posts this month
    prisma.post.count({
      where: { brandId: { in: brandIds }, createdAt: { gte: startOfMonth } },
    }),

    // Success count
    prisma.post.count({
      where: { brandId: { in: brandIds }, status: 'SUCCESS' },
    }),

    // Failed count
    prisma.post.count({
      where: { brandId: { in: brandIds }, status: 'FAILED' },
    }),

    // Platform breakdown
    prisma.post.groupBy({
      by: ['platform'],
      where: { brandId: { in: brandIds } },
      _count: true,
    }),

    // Posts in last 7 days grouped by day
    prisma.post.findMany({
      where: {
        brandId: { in: brandIds },
        createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      },
      select: { createdAt: true },
    }),

    // Scheduled queue (upcoming)
    prisma.post.findMany({
      where: {
        brandId: { in: brandIds },
        status: 'QUEUED',
        scheduledFor: { gte: now },
      },
      orderBy: { scheduledFor: 'asc' },
      take: 10,
      select: {
        id: true,
        caption: true,
        platform: true,
        scheduledFor: true,
        brand: { select: { name: true } },
      },
    }),

    // Status breakdown
    prisma.post.groupBy({
      by: ['status'],
      where: { brandId: { in: brandIds } },
      _count: true,
    }),
  ]);

  // Calculate success rate
  const totalCompleted = successCount + failedCount;
  const rate = totalCompleted > 0 ? Math.round((successCount / totalCompleted) * 100) : 0;

  // Build weekly histogram (last 7 days)
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekMap: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    weekMap[key] = 0;
  }
  for (const post of weeklyPosts) {
    const d = new Date(post.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (key in weekMap) weekMap[key]++;
  }
  const weeklyData = Object.entries(weekMap).map(([date, count]) => ({
    date,
    day: dayNames[new Date(date).getDay()],
    count,
  }));

  // Platforms connected (unique active)
  const activePlatforms = new Set<string>();
  for (const brand of brands) {
    for (const conn of brand.socialConnections) {
      if (conn.status === 'ACTIVE' || conn.status === 'CONNECTED') {
        activePlatforms.add(conn.platform);
      }
    }
  }

  return NextResponse.json({
    totalPosts,
    thisMonth,
    brandsCount: brands.length,
    platformsConnected: activePlatforms.size,
    successRate: { rate, succeeded: successCount, total: totalCompleted },
    platformBreakdown: platformGroups.map((g) => ({
      platform: g.platform,
      count: g._count,
    })),
    weeklyPosts: weeklyData,
    scheduled: scheduled.map((s) => ({
      id: s.id,
      caption: s.caption.length > 80 ? s.caption.slice(0, 80) + '...' : s.caption,
      platform: s.platform,
      scheduledFor: s.scheduledFor,
      brandName: s.brand.name,
    })),
    statusBreakdown: statusGroups.map((g) => ({
      status: g.status,
      count: g._count,
    })),
  });
}) as unknown as import('@royea/shared-utils/auth-guard').AuthRouteHandler) as unknown as (req: NextRequest, _context: RouteContext) => Promise<NextResponse>;
