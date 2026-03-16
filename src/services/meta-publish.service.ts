/**
 * Meta Publish Service
 *
 * Handles real publishing to Facebook Pages and Instagram Business accounts
 * via the Meta Graph API.
 */

const GRAPH_API = 'https://graph.facebook.com/v21.0';

export interface PublishResult {
  success: boolean;
  platformPostId?: string;
  platformUrl?: string;
  errorCode?: string;
  errorMessage?: string;
  rawResponse: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Facebook Page — Photo Post
// ---------------------------------------------------------------------------

/**
 * Publish a photo post to a Facebook Page.
 *
 * Uses the `url` parameter so the image must be publicly accessible.
 * Falls back to `source` (multipart) if imageBuffer is provided.
 */
export async function publishToFacebookPage(params: {
  pageId: string;
  pageAccessToken: string;
  imageUrl?: string;
  imageBuffer?: Buffer;
  imageMimeType?: string;
  caption: string;
}): Promise<PublishResult> {
  const { pageId, pageAccessToken, imageUrl, imageBuffer, imageMimeType, caption } = params;

  try {
    let res: Response;

    if (imageBuffer && imageMimeType) {
      // Multipart upload (source parameter)
      const formData = new FormData();
      const blob = new Blob([new Uint8Array(imageBuffer)], { type: imageMimeType });
      formData.append('source', blob, 'photo.jpg');
      formData.append('message', caption);
      formData.append('access_token', pageAccessToken);

      res = await fetch(`${GRAPH_API}/${pageId}/photos`, {
        method: 'POST',
        body: formData,
      });
    } else if (imageUrl) {
      // URL-based upload
      const body = new URLSearchParams({
        url: imageUrl,
        message: caption,
        access_token: pageAccessToken,
      });

      res = await fetch(`${GRAPH_API}/${pageId}/photos`, {
        method: 'POST',
        body,
      });
    } else {
      return {
        success: false,
        errorCode: 'NO_IMAGE',
        errorMessage: 'Either imageUrl or imageBuffer must be provided',
        rawResponse: {},
      };
    }

    const data = await res.json();

    if (!res.ok || data.error) {
      return normalizeMetaError(data);
    }

    // Facebook returns { id, post_id } for photo posts
    const postId = data.post_id || data.id;
    return {
      success: true,
      platformPostId: postId,
      platformUrl: `https://www.facebook.com/${postId}`,
      rawResponse: data,
    };
  } catch (err) {
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
      errorMessage: err instanceof Error ? err.message : 'Network error during publish',
      rawResponse: { error: String(err) },
    };
  }
}

// ---------------------------------------------------------------------------
// Instagram — Container-based Photo Publishing
// ---------------------------------------------------------------------------

/**
 * Publish a photo post to Instagram Business account.
 *
 * Instagram requires a 2-step process:
 * 1. Create a media container with image_url + caption
 * 2. Publish the container
 *
 * The image_url MUST be publicly accessible (Instagram fetches it).
 */
export async function publishToInstagram(params: {
  igUserId: string;
  pageAccessToken: string;
  imageUrl: string;
  caption: string;
}): Promise<PublishResult> {
  const { igUserId, pageAccessToken, caption } = params;
  let { imageUrl } = params;

  try {
    // --- URL validation ---
    // Ensure URL uses HTTPS (Instagram requires it)
    if (!imageUrl.startsWith('https://')) {
      if (imageUrl.startsWith('http://')) {
        imageUrl = imageUrl.replace('http://', 'https://');
      } else {
        return {
          success: false,
          errorCode: 'INVALID_IMAGE_URL',
          errorMessage: 'Image URL must start with https://',
          rawResponse: { imageUrl },
        };
      }
    }

    // Verify the image URL is accessible before sending to Instagram
    try {
      const headRes = await fetch(imageUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(10000),
      });
      if (!headRes.ok) {
        return {
          success: false,
          errorCode: 'IMAGE_UNREACHABLE',
          errorMessage: `Image URL returned HTTP ${headRes.status}. Ensure the image is publicly accessible.`,
          rawResponse: { imageUrl, httpStatus: headRes.status },
        };
      }
    } catch (headErr) {
      return {
        success: false,
        errorCode: 'IMAGE_UNREACHABLE',
        errorMessage: `Could not reach image URL: ${headErr instanceof Error ? headErr.message : 'timeout or network error'}`,
        rawResponse: { imageUrl, error: String(headErr) },
      };
    }

    // Step 1: Create media container
    const containerParams = new URLSearchParams({
      image_url: imageUrl,
      caption,
      access_token: pageAccessToken,
    });

    const containerRes = await fetch(`${GRAPH_API}/${igUserId}/media`, {
      method: 'POST',
      body: containerParams,
    });
    const containerData = await containerRes.json();

    if (!containerRes.ok || containerData.error) {
      return normalizeMetaError(containerData);
    }

    const containerId = containerData.id;
    if (!containerId) {
      return {
        success: false,
        errorCode: 'NO_CONTAINER_ID',
        errorMessage: 'Failed to create media container — no ID returned',
        rawResponse: containerData,
      };
    }

    // Step 2: Wait for container to be ready (poll status)
    const ready = await waitForContainerReady(igUserId, containerId, pageAccessToken);
    if (!ready.success) {
      return ready;
    }

    // Step 3: Publish the container
    const publishParams = new URLSearchParams({
      creation_id: containerId,
      access_token: pageAccessToken,
    });

    const publishRes = await fetch(`${GRAPH_API}/${igUserId}/media_publish`, {
      method: 'POST',
      body: publishParams,
    });
    const publishData = await publishRes.json();

    if (!publishRes.ok || publishData.error) {
      return normalizeMetaError(publishData);
    }

    const mediaId = publishData.id;
    return {
      success: true,
      platformPostId: mediaId,
      platformUrl: `https://www.instagram.com/p/${mediaId}/`,
      rawResponse: { container: containerData, publish: publishData },
    };
  } catch (err) {
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
      errorMessage: err instanceof Error ? err.message : 'Network error during publish',
      rawResponse: { error: String(err) },
    };
  }
}

// ---------------------------------------------------------------------------
// Container status polling (Instagram requires containers to be ready)
// ---------------------------------------------------------------------------

async function waitForContainerReady(
  igUserId: string,
  containerId: string,
  accessToken: string,
  maxAttempts = 10,
  intervalMs = 2000,
): Promise<PublishResult> {
  for (let i = 0; i < maxAttempts; i++) {
    const statusRes = await fetch(
      `${GRAPH_API}/${containerId}?fields=status_code,status&access_token=${accessToken}`,
    );
    const statusData = await statusRes.json();

    if (statusData.status_code === 'FINISHED') {
      return { success: true, rawResponse: statusData };
    }

    if (statusData.status_code === 'ERROR') {
      return {
        success: false,
        errorCode: 'CONTAINER_ERROR',
        errorMessage: statusData.status || 'Media container processing failed',
        rawResponse: statusData,
      };
    }

    // IN_PROGRESS — wait and retry
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return {
    success: false,
    errorCode: 'CONTAINER_TIMEOUT',
    errorMessage: `Media container not ready after ${maxAttempts * intervalMs / 1000}s`,
    rawResponse: {},
  };
}

// ---------------------------------------------------------------------------
// Error normalization
// ---------------------------------------------------------------------------

function normalizeMetaError(data: Record<string, unknown>): PublishResult {
  const err = data.error as Record<string, unknown> | undefined;
  if (!err) {
    return {
      success: false,
      errorCode: 'UNKNOWN',
      errorMessage: 'Unknown error from Meta API',
      rawResponse: data,
    };
  }

  const code = err.code as number | undefined;
  const subcode = err.error_subcode as number | undefined;
  const message = (err.message as string) || 'Meta API error';

  // Map common Meta error codes to normalized codes
  let errorCode = 'META_API_ERROR';
  if (code === 190) errorCode = 'TOKEN_EXPIRED';
  else if (code === 10) errorCode = 'PERMISSION_DENIED';
  else if (code === 4) errorCode = 'RATE_LIMITED';
  else if (code === 100 && subcode === 33) errorCode = 'INVALID_IMAGE';
  else if (code === 100) errorCode = 'INVALID_PARAMETER';
  else if (code === 2) errorCode = 'SERVICE_UNAVAILABLE';
  else if (code === 368) errorCode = 'CONTENT_BLOCKED';

  return {
    success: false,
    errorCode,
    errorMessage: message,
    rawResponse: data,
  };
}
