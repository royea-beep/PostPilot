/**
 * Publish Job Service
 *
 * Orchestrates the publish flow: creates jobs, processes them through
 * the appropriate provider, and updates statuses.
 */

import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import { publishToFacebookPage, publishToInstagram, type PublishResult } from './meta-publish.service';

export interface PublishJobResult {
  postId: string;
  platform: string;
  success: boolean;
  platformPostId?: string;
  platformUrl?: string;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * Process a single publish job (Post record).
 *
 * 1. Sets status to PROCESSING
 * 2. Decrypts the page access token
 * 3. Calls the appropriate platform publish function
 * 4. Updates the Post with the result
 */
export async function processPublishJob(
  postId: string,
  appUrl: string,
): Promise<PublishJobResult> {
  // Load post with connection and media
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      connection: true,
      media: true,
    },
  });

  if (!post) {
    return { postId, platform: 'unknown', success: false, errorCode: 'NOT_FOUND', errorMessage: 'Post not found' };
  }

  const { connection, media, platform } = post;

  // Mark as PROCESSING
  await prisma.post.update({
    where: { id: postId },
    data: { status: 'PROCESSING' },
  });

  // Validate connection has page token
  if (!connection.pageAccessTokenEncrypted || !connection.pageTokenIv || !connection.pageTokenAuthTag) {
    const result = failPost(postId, 'NO_PAGE_TOKEN', 'No page access token configured. Please select a page.');
    return { postId, platform, ...(await result) };
  }

  // Decrypt page access token
  let pageAccessToken: string;
  try {
    pageAccessToken = decrypt(
      connection.pageAccessTokenEncrypted,
      connection.pageTokenIv,
      connection.pageTokenAuthTag,
    );
  } catch {
    const result = failPost(postId, 'DECRYPT_FAILED', 'Failed to decrypt page token. Please reconnect.');
    return { postId, platform, ...(await result) };
  }

  // Build the full caption (caption + hashtags)
  const hashtags = safeParseArray(post.hashtags);
  const fullCaption = hashtags.length > 0
    ? `${post.caption}\n\n${hashtags.map((h: string) => `#${h}`).join(' ')}`
    : post.caption;

  // Build publicly accessible image URL
  const imageUrl = `${appUrl}/api/media/${media.id}`;

  let publishResult: PublishResult;

  if (platform === 'facebook') {
    publishResult = await publishToFacebookPage({
      pageId: connection.pageId!,
      pageAccessToken,
      imageUrl,
      caption: fullCaption,
    });
  } else if (platform === 'instagram') {
    const igUserId = connection.platformUserId;
    if (!igUserId) {
      const result = failPost(postId, 'NO_IG_ACCOUNT', 'No Instagram Business account linked.');
      return { postId, platform, ...(await result) };
    }

    publishResult = await publishToInstagram({
      igUserId,
      pageAccessToken,
      imageUrl,
      caption: fullCaption,
    });
  } else {
    const result = failPost(postId, 'UNSUPPORTED_PLATFORM', `Platform '${platform}' is not yet supported for real publishing.`);
    return { postId, platform, ...(await result) };
  }

  // Update post with result
  if (publishResult.success) {
    await prisma.post.update({
      where: { id: postId },
      data: {
        status: 'SUCCESS',
        platformPostId: publishResult.platformPostId || null,
        platformUrl: publishResult.platformUrl || null,
        rawResponse: JSON.stringify(publishResult.rawResponse),
        publishedAt: new Date(),
      },
    });

    return {
      postId,
      platform,
      success: true,
      platformPostId: publishResult.platformPostId,
      platformUrl: publishResult.platformUrl,
    };
  } else {
    await prisma.post.update({
      where: { id: postId },
      data: {
        status: 'FAILED',
        errorCode: publishResult.errorCode || null,
        errorMessage: publishResult.errorMessage || null,
        rawResponse: JSON.stringify(publishResult.rawResponse),
        retryCount: { increment: 1 },
      },
    });

    // If token expired, mark the connection
    if (publishResult.errorCode === 'TOKEN_EXPIRED') {
      await prisma.socialConnection.update({
        where: { id: connection.id },
        data: { status: 'EXPIRED' },
      });
    }

    return {
      postId,
      platform,
      success: false,
      errorCode: publishResult.errorCode,
      errorMessage: publishResult.errorMessage,
    };
  }
}

async function failPost(postId: string, errorCode: string, errorMessage: string) {
  await prisma.post.update({
    where: { id: postId },
    data: {
      status: 'FAILED',
      errorCode,
      errorMessage,
      retryCount: { increment: 1 },
    },
  });
  return { success: false as const, errorCode, errorMessage };
}

function safeParseArray(json: string): string[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
