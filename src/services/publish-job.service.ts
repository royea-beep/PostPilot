/**
 * Publish Job Service
 *
 * Orchestrates the publish flow: creates jobs, processes them through
 * the appropriate provider, and updates statuses.
 */

import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import {
  publishToFacebookPage,
  publishToInstagram,
  publishInstagramReel,
  publishInstagramStory,
  publishFacebookStory,
  type PublishResult,
} from './meta-publish.service';
import { publishToTikTok, type TikTokPublishResult } from './tiktok-publish.service';

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
  const postFormat = post.format; // 'post', 'reel', or 'story'
  const isVideo = media.mediaType === 'video';

  if (platform === 'facebook') {
    if (postFormat === 'story') {
      publishResult = await publishFacebookStory({
        pageId: connection.pageId!,
        pageAccessToken,
        mediaUrl: imageUrl,
        isVideo,
      });
    } else {
      // Feed post (default)
      publishResult = await publishToFacebookPage({
        pageId: connection.pageId!,
        pageAccessToken,
        imageUrl,
        caption: fullCaption,
      });
    }
  } else if (platform === 'instagram') {
    const igUserId = connection.platformUserId;
    if (!igUserId) {
      const result = failPost(postId, 'NO_IG_ACCOUNT', 'No Instagram Business account linked.');
      return { postId, platform, ...(await result) };
    }

    if (postFormat === 'reel') {
      if (!isVideo) {
        const result = failPost(postId, 'REEL_REQUIRES_VIDEO', 'Instagram Reels require a video file.');
        return { postId, platform, ...(await result) };
      }
      publishResult = await publishInstagramReel({
        igUserId,
        pageAccessToken,
        videoUrl: imageUrl,
        caption: fullCaption,
      });
    } else if (postFormat === 'story') {
      publishResult = await publishInstagramStory({
        igUserId,
        pageAccessToken,
        mediaUrl: imageUrl,
        isVideo,
      });
    } else {
      // Feed post (default)
      publishResult = await publishToInstagram({
        igUserId,
        pageAccessToken,
        imageUrl,
        caption: fullCaption,
      });
    }
  } else if (platform === 'tiktok') {
    if (!isVideo) {
      const result = failPost(postId, 'TIKTOK_REQUIRES_VIDEO', 'TikTok publishing requires a video file.');
      return { postId, platform, ...(await result) };
    }

    // TikTok uses the user access token directly (no page token concept)
    // Decrypt the user access token from the connection
    let tiktokAccessToken: string;
    try {
      tiktokAccessToken = decrypt(
        connection.encryptedAccessToken!,
        connection.iv!,
        connection.authTag!,
      );
    } catch {
      const result = failPost(postId, 'DECRYPT_FAILED', 'Failed to decrypt TikTok token. Please reconnect.');
      return { postId, platform, ...(await result) };
    }

    const tiktokResult: TikTokPublishResult = await publishToTikTok({
      accessToken: tiktokAccessToken,
      videoUrl: imageUrl,
      caption: fullCaption,
    });

    // Map TikTokPublishResult to the common PublishResult shape
    publishResult = {
      success: tiktokResult.success,
      platformPostId: tiktokResult.publishId,
      platformUrl: tiktokResult.publishId
        ? `https://www.tiktok.com/@user/video/${tiktokResult.publishId}`
        : undefined,
      errorCode: tiktokResult.errorCode,
      errorMessage: tiktokResult.errorMessage,
      rawResponse: tiktokResult.rawResponse,
    };
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
