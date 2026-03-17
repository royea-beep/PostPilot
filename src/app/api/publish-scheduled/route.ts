import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { processPublishJob } from '@/services/publish-job.service';
import { emitServerEvent } from '@/lib/learning';

/**
 * GET /api/publish-scheduled — Cron job to publish scheduled posts.
 *
 * Finds posts where scheduledFor <= now AND status = 'SCHEDULED',
 * publishes each one, and updates status to SUCCESS or FAILED.
 *
 * Designed to run every 5 minutes via Vercel Cron.
 * Protected by CRON_SECRET to prevent unauthorized access.
 */
export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel sends this automatically for cron jobs)
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();

    // Find all posts that are due for publishing
    const scheduledPosts = await prisma.post.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledFor: { lte: now },
      },
      include: {
        brand: { include: { user: true } },
      },
      take: 20, // Process max 20 at a time to avoid timeout
      orderBy: { scheduledFor: 'asc' },
    });

    if (scheduledPosts.length === 0) {
      return NextResponse.json({ processed: 0, message: 'No scheduled posts due' });
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 5 * 60 * 1000; // 5 minutes
    const results: Array<{ postId: string; platform: string; success: boolean; error?: string; retried?: boolean }> = [];

    for (const post of scheduledPosts) {
      // Set status to QUEUED so processPublishJob picks it up correctly
      await prisma.post.update({
        where: { id: post.id },
        data: { status: 'QUEUED' },
      });

      const result = await processPublishJob(post.id, appUrl);

      if (result.success) {
        // Increment monthly usage counter for successful publishes
        await prisma.user.update({
          where: { id: post.brand.user.id },
          data: { postsThisMonth: { increment: 1 } },
        });

        emitServerEvent('post_published', 'engagement', undefined, {
          platform: result.platform,
          scheduled: true,
        });

        results.push({
          postId: post.id,
          platform: result.platform,
          success: true,
        });
      } else {
        // Retry logic: if under max retries, reschedule for 5 min later
        // processPublishJob already incremented retryCount, so read the current value
        const updatedPost = await prisma.post.findUnique({
          where: { id: post.id },
          select: { retryCount: true },
        });

        if (updatedPost && updatedPost.retryCount < MAX_RETRIES) {
          // Reschedule: set back to SCHEDULED with a 5-minute delay
          await prisma.post.update({
            where: { id: post.id },
            data: {
              status: 'SCHEDULED',
              scheduledFor: new Date(Date.now() + RETRY_DELAY_MS),
            },
          });

          results.push({
            postId: post.id,
            platform: result.platform,
            success: false,
            error: result.errorMessage,
            retried: true,
          });
        } else {
          // Max retries reached — leave as FAILED
          results.push({
            postId: post.id,
            platform: result.platform,
            success: false,
            error: result.errorMessage,
            retried: false,
          });
        }
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const retriedCount = results.filter((r) => !r.success && r.retried).length;
    const failedCount = results.filter((r) => !r.success && !r.retried).length;

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'CRON_PUBLISH_SCHEDULED',
        metadata: JSON.stringify({
          processed: results.length,
          success: successCount,
          retried: retriedCount,
          failed: failedCount,
          results,
        }),
      },
    });

    return NextResponse.json({
      processed: results.length,
      success: successCount,
      retried: retriedCount,
      failed: failedCount,
      results,
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('Scheduled publish cron error:', err);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}
