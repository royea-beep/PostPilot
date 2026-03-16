import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { analyzeAndUpdateStyleProfile } from '@/lib/style-engine';
import { getPlanLimits } from '@/lib/payments';
import { processPublishJob, type PublishJobResult } from '@/services/publish-job.service';
import { emitServerEvent } from '@/lib/learning';

/**
 * POST /api/publish — publish a selected draft to connected platforms.
 *
 * Accepts either the AI-generated caption or a user-edited version.
 * Creates a publish job (Post record) per platform, processes each
 * through the real Meta Graph API, and returns results.
 *
 * Options:
 * - manualPost: true — track as manual copy-and-paste (no platform API call)
 * - demo: true (query param or body) — return mock success without real API calls
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { draftId, brandToken, editedCaption, manualPost } = body;
    const isDemo = req.nextUrl.searchParams.get('demo') === 'true' || body.demo === true;

    if (!draftId || !brandToken) {
      return NextResponse.json({ error: 'Missing draftId or brandToken' }, { status: 400 });
    }

    const brand = await prisma.brand.findUnique({
      where: { token: brandToken },
      include: { user: true },
    });
    if (!brand) {
      return NextResponse.json({ error: 'Invalid brand token' }, { status: 404 });
    }

    // Check plan limits
    const user = brand.user;
    const limits = getPlanLimits(user.plan);
    const cycleStart = new Date(user.billingCycleStart);
    const now = new Date();
    if (now.getTime() - cycleStart.getTime() > 30 * 24 * 60 * 60 * 1000) {
      await prisma.user.update({
        where: { id: user.id },
        data: { postsThisMonth: 0, billingCycleStart: now },
      });
      user.postsThisMonth = 0;
    }
    if (limits.postsPerMonth > 0 && user.postsThisMonth >= limits.postsPerMonth) {
      return NextResponse.json(
        { error: 'Monthly post limit reached. Upgrade your plan.', code: 'LIMIT_REACHED' },
        { status: 403 },
      );
    }

    const draft = await prisma.postDraft.findFirst({
      where: { id: draftId, brandId: brand.id },
    });
    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    // Idempotency: prevent double-publish of the same draft
    const existingPosts = await prisma.post.findMany({
      where: { draftId, status: { in: ['QUEUED', 'PROCESSING', 'SUCCESS'] } },
      select: { id: true, status: true, platform: true },
    });
    if (existingPosts.length > 0) {
      return NextResponse.json(
        { error: 'This draft has already been published or is currently being processed.', code: 'ALREADY_PUBLISHED' },
        { status: 409 },
      );
    }

    // Determine the final caption (user-edited or original)
    const finalCaption = typeof editedCaption === 'string' && editedCaption.trim()
      ? editedCaption.trim()
      : draft.caption;

    // Mark draft as selected and store edit info
    await prisma.postDraft.update({
      where: { id: draftId },
      data: {
        selected: true,
        editedCaption: finalCaption !== draft.caption ? finalCaption : null,
        chosenAt: new Date(),
      },
    });

    const targetPlatforms = JSON.parse(draft.platforms) as string[];

    // --- Manual Post Mode: user copied caption and will paste manually ---
    if (manualPost) {
      await prisma.styleEvent.create({
        data: {
          brandId: brand.id,
          eventType: 'PUBLISH',
          contentItemId: draft.mediaId,
          chosenVariantIndex: draft.optionIndex,
          chosenCaption: draft.caption,
          finalCaption,
          source: 'manual',
          detectedPatterns: JSON.stringify(extractBasicPatterns(finalCaption, draft.hashtags)),
        },
      });

      await prisma.auditLog.create({
        data: {
          brandId: brand.id,
          action: 'MANUAL_POST',
          metadata: JSON.stringify({
            draftId,
            platforms: targetPlatforms,
            method: 'copy_and_paste',
          }),
        },
      });

      return NextResponse.json({
        published: false,
        manualPost: true,
        message: 'Caption tracked as manual post. Paste it into your platform.',
      });
    }

    // --- Demo Mode: return mock success without calling any APIs ---
    if (isDemo) {
      const mockResults: PublishJobResult[] = targetPlatforms.map((platform) => ({
        postId: `demo_${platform}_${Date.now()}`,
        platform,
        success: true,
        platformPostId: `demo_${Math.random().toString(36).slice(2, 10)}`,
        platformUrl: platform === 'instagram'
          ? 'https://www.instagram.com/p/demo'
          : 'https://www.facebook.com/demo/posts/123',
      }));

      await prisma.auditLog.create({
        data: {
          brandId: brand.id,
          action: 'DEMO_PUBLISH',
          metadata: JSON.stringify({
            draftId,
            platforms: targetPlatforms,
            demo: true,
          }),
        },
      });

      return NextResponse.json({
        published: true,
        demo: true,
        results: mockResults,
        summary: {
          total: mockResults.length,
          success: mockResults.length,
          failed: 0,
        },
      });
    }

    // Get connected platforms that are ACTIVE (have page selected)
    // Fall back to CONNECTED for backward compatibility
    const connections = await prisma.socialConnection.findMany({
      where: {
        brandId: brand.id,
        status: { in: ['ACTIVE', 'CONNECTED'] },
      },
    });

    // Create publish jobs (Post records) with QUEUED status
    const skippedPlatforms: string[] = [];
    const posts = await Promise.all(
      targetPlatforms.map(async (platform) => {
        const connection = connections.find((c) => c.platform === platform);
        if (!connection) {
          skippedPlatforms.push(platform);
          return null;
        }

        return prisma.post.create({
          data: {
            brandId: brand.id,
            mediaId: draft.mediaId,
            draftId: draft.id,
            connectionId: connection.id,
            caption: finalCaption,
            hashtags: draft.hashtags,
            format: draft.format,
            platform,
            status: 'QUEUED',
          },
        });
      }),
    );

    const validPosts = posts.filter(Boolean) as NonNullable<(typeof posts)[number]>[];

    if (validPosts.length === 0) {
      return NextResponse.json(
        { error: 'No connected platforms found for selected targets. Please connect an account first.', skippedPlatforms },
        { status: 400 },
      );
    }

    // Process each publish job through the real platform API
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
    const results: PublishJobResult[] = [];

    for (const post of validPosts) {
      const result = await processPublishJob(post.id, appUrl);
      results.push(result);
    }

    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;

    // Increment monthly usage counter (only for successful publishes)
    if (successCount > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: { postsThisMonth: { increment: successCount } },
      });
    }

    // Create style event for the publish
    await prisma.styleEvent.create({
      data: {
        brandId: brand.id,
        eventType: 'PUBLISH',
        contentItemId: draft.mediaId,
        chosenVariantIndex: draft.optionIndex,
        chosenCaption: draft.caption,
        finalCaption,
        source: 'ai',
        detectedPatterns: JSON.stringify(extractBasicPatterns(finalCaption, draft.hashtags)),
      },
    });

    // Update Style DNA in background
    if (successCount > 0) {
      analyzeAndUpdateStyleProfile(brand.id).catch((err) => {
        if (process.env.NODE_ENV !== 'production') console.error('Style analysis failed:', err);
      });
    }

    // Learning hook: postPublished for each successful platform
    for (const r of results) {
      if (r.success) {
        emitServerEvent('post_published', 'engagement', undefined, { platform: r.platform });
      }
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        brandId: brand.id,
        action: 'POST_PUBLISHED',
        metadata: JSON.stringify({
          draftId,
          platforms: targetPlatforms,
          successCount,
          failedCount,
          results: results.map((r) => ({
            platform: r.platform,
            success: r.success,
            errorCode: r.errorCode,
            platformPostId: r.platformPostId,
          })),
        }),
      },
    });

    return NextResponse.json({
      published: successCount > 0,
      results,
      summary: {
        total: results.length,
        success: successCount,
        failed: failedCount,
      },
      ...(skippedPlatforms.length > 0 ? { skippedPlatforms } : {}),
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('Publish error:', err);
    return NextResponse.json({ error: 'Publish failed' }, { status: 500 });
  }
}

/**
 * Extract basic style patterns from a caption for the StyleEvent.
 */
function extractBasicPatterns(caption: string, hashtagsJson: string) {
  const hashtags = safeParseArray(hashtagsJson);
  const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;
  const emojis = caption.match(emojiRegex) || [];
  const lines = caption.split('\n').filter(Boolean);

  return {
    captionLength: caption.length,
    wordCount: caption.split(/\s+/).filter(Boolean).length,
    emojiCount: emojis.length,
    hashtagCount: hashtags.length,
    lineCount: lines.length,
    hasQuestion: caption.includes('?'),
    hasCTA: /click|tap|link|swipe|check|visit|shop|buy|order|dm|comment|share|follow/i.test(caption),
    opener: lines[0]?.slice(0, 50) || '',
    closer: lines[lines.length - 1]?.slice(0, 50) || '',
  };
}

function safeParseArray(json: string): string[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
