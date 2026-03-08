import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { analyzeAndUpdateStyleProfile } from '@/lib/style-engine';
import { getPlanLimits } from '@/lib/payments';

// POST /api/publish — publish a selected draft (simulated for MVP)
export async function POST(req: NextRequest) {
  try {
    const { draftId, brandToken } = await req.json();
    if (!draftId || !brandToken) {
      return NextResponse.json({ error: 'Missing draftId or brandToken' }, { status: 400 });
    }

    const brand = await prisma.brand.findUnique({ where: { token: brandToken }, include: { user: true } });
    if (!brand) return NextResponse.json({ error: 'Invalid brand token' }, { status: 404 });

    // Check plan limits
    const user = brand.user;
    const limits = getPlanLimits(user.plan);
    const cycleStart = new Date(user.billingCycleStart);
    const now = new Date();
    if (now.getTime() - cycleStart.getTime() > 30 * 24 * 60 * 60 * 1000) {
      await prisma.user.update({ where: { id: user.id }, data: { postsThisMonth: 0, billingCycleStart: now } });
      user.postsThisMonth = 0;
    }
    if (limits.postsPerMonth > 0 && user.postsThisMonth >= limits.postsPerMonth) {
      return NextResponse.json({ error: 'Monthly post limit reached. Upgrade your plan.', code: 'LIMIT_REACHED' }, { status: 403 });
    }

    const draft = await prisma.postDraft.findFirst({
      where: { id: draftId, brandId: brand.id },
    });
    if (!draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 });

    // Mark draft as selected
    await prisma.postDraft.update({
      where: { id: draftId },
      data: { selected: true },
    });

    // Get connected platforms
    const connections = await prisma.socialConnection.findMany({
      where: { brandId: brand.id, status: 'CONNECTED' },
    });

    const targetPlatforms = JSON.parse(draft.platforms) as string[];

    // Create post records for each matching connected platform
    const posts = await Promise.all(
      targetPlatforms.map(async (platform) => {
        const connection = connections.find(c => c.platform === platform);
        if (!connection) return null;

        return prisma.post.create({
          data: {
            brandId: brand.id,
            mediaId: draft.mediaId,
            draftId: draft.id,
            connectionId: connection.id,
            caption: draft.caption,
            hashtags: draft.hashtags,
            format: draft.format,
            platform,
            status: 'PUBLISHED', // MVP: simulate success
            publishedAt: new Date(),
          },
        });
      })
    );

    // Increment monthly usage counter
    const postCount = posts.filter(Boolean).length;
    if (postCount > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: { postsThisMonth: { increment: postCount } },
      });
    }

    // Update Style DNA in background (don't block the response)
    analyzeAndUpdateStyleProfile(brand.id).catch(err =>
      console.error('Style analysis failed:', err)
    );

    // Audit log
    await prisma.auditLog.create({
      data: {
        brandId: brand.id,
        action: 'POST_PUBLISHED',
        metadata: JSON.stringify({
          draftId,
          platforms: targetPlatforms,
          postCount: posts.filter(Boolean).length,
        }),
      },
    });

    return NextResponse.json({
      published: true,
      postCount: posts.filter(Boolean).length,
      platforms: targetPlatforms,
    });
  } catch (err) {
    console.error('Publish error:', err);
    return NextResponse.json({ error: 'Publish failed' }, { status: 500 });
  }
}
