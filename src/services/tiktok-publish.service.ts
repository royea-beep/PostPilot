/**
 * TikTok Publish Service
 *
 * Handles video publishing to TikTok via the Content Posting API v2.
 * Uses the "PULL_FROM_URL" method — the video must be publicly accessible.
 *
 * API docs: https://developers.tiktok.com/doc/content-posting-api-reference-direct-post
 */

const TIKTOK_API = 'https://open.tiktokapis.com/v2';

export interface TikTokPublishResult {
  success: boolean;
  publishId?: string;
  errorCode?: string;
  errorMessage?: string;
  rawResponse: Record<string, unknown>;
}

export type TikTokPrivacyLevel =
  | 'PUBLIC_TO_EVERYONE'
  | 'MUTUAL_FOLLOW_FRIENDS'
  | 'SELF_ONLY';

/**
 * Initiate a video publish to TikTok using the "pull from URL" method.
 *
 * TikTok will asynchronously pull the video from the provided URL.
 * The returned `publishId` can be used to check the status of the upload
 * via the /post/publish/status/fetch/ endpoint.
 */
export async function publishToTikTok(params: {
  accessToken: string;
  videoUrl: string;
  caption: string;
  privacyLevel?: TikTokPrivacyLevel;
  disableComment?: boolean;
  disableDuet?: boolean;
  disableStitch?: boolean;
}): Promise<TikTokPublishResult> {
  const {
    accessToken,
    videoUrl,
    caption,
    privacyLevel = 'PUBLIC_TO_EVERYONE',
    disableComment = false,
    disableDuet = false,
    disableStitch = false,
  } = params;

  try {
    const res = await fetch(`${TIKTOK_API}/post/publish/video/init/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({
        post_info: {
          title: caption.slice(0, 150), // TikTok title limit
          privacy_level: privacyLevel,
          disable_comment: disableComment,
          disable_duet: disableDuet,
          disable_stitch: disableStitch,
        },
        source_info: {
          source: 'PULL_FROM_URL',
          video_url: videoUrl,
        },
      }),
    });

    const data = await res.json();

    if (!res.ok || data.error?.code) {
      return normalizeTikTokError(data);
    }

    return {
      success: true,
      publishId: data.data?.publish_id,
      rawResponse: data,
    };
  } catch (err) {
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
      errorMessage: err instanceof Error ? err.message : 'Network error during TikTok publish',
      rawResponse: { error: String(err) },
    };
  }
}

/**
 * Check the status of a TikTok publish job.
 *
 * Returns the upload status and, once complete, the published video ID.
 */
export async function checkTikTokPublishStatus(params: {
  accessToken: string;
  publishId: string;
}): Promise<{
  status: 'PROCESSING' | 'PUBLISH_COMPLETE' | 'FAILED' | 'UNKNOWN';
  publicVideoId?: string;
  errorCode?: string;
  errorMessage?: string;
  rawResponse: Record<string, unknown>;
}> {
  const { accessToken, publishId } = params;

  try {
    const res = await fetch(`${TIKTOK_API}/post/publish/status/fetch/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({ publish_id: publishId }),
    });

    const data = await res.json();

    if (!res.ok || data.error?.code) {
      return {
        status: 'FAILED',
        errorCode: data.error?.code || 'API_ERROR',
        errorMessage: data.error?.message || 'Failed to check publish status',
        rawResponse: data,
      };
    }

    const statusCode = data.data?.status;
    const publicVideoId = data.data?.publicaly_available_post_id?.[0];

    if (statusCode === 'PUBLISH_COMPLETE') {
      return {
        status: 'PUBLISH_COMPLETE',
        publicVideoId,
        rawResponse: data,
      };
    }

    if (statusCode === 'FAILED') {
      return {
        status: 'FAILED',
        errorCode: data.data?.fail_reason || 'PUBLISH_FAILED',
        errorMessage: `TikTok publish failed: ${data.data?.fail_reason || 'unknown reason'}`,
        rawResponse: data,
      };
    }

    return {
      status: 'PROCESSING',
      rawResponse: data,
    };
  } catch (err) {
    return {
      status: 'UNKNOWN',
      errorCode: 'NETWORK_ERROR',
      errorMessage: err instanceof Error ? err.message : 'Network error checking status',
      rawResponse: { error: String(err) },
    };
  }
}

// ---------------------------------------------------------------------------
// Error normalization
// ---------------------------------------------------------------------------

function normalizeTikTokError(data: Record<string, unknown>): TikTokPublishResult {
  const err = data.error as Record<string, unknown> | undefined;
  const code = (err?.code as string) || 'UNKNOWN';
  const message = (err?.message as string) || 'TikTok API error';

  let errorCode = 'TIKTOK_API_ERROR';
  if (code === 'access_token_invalid') errorCode = 'TOKEN_EXPIRED';
  else if (code === 'scope_not_authorized') errorCode = 'PERMISSION_DENIED';
  else if (code === 'rate_limit_exceeded') errorCode = 'RATE_LIMITED';
  else if (code === 'spam_risk_too_many_posts') errorCode = 'RATE_LIMITED';
  else if (code === 'invalid_publish_id') errorCode = 'INVALID_PARAMETER';

  return {
    success: false,
    errorCode,
    errorMessage: message,
    rawResponse: data,
  };
}
