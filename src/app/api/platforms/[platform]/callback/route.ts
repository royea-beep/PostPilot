import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { encrypt } from '@/lib/crypto';
import { exchangeCodeForToken, type PlatformKey } from '@/lib/platforms';
import { emitServerEvent } from '@/lib/learning';

const VALID_PLATFORMS = new Set<string>(['instagram', 'facebook', 'tiktok']);

interface OAuthState {
  userId: string;
  brandId: string;
  platform: string;
  nonce: string;
}

/**
 * GET /api/platforms/:platform/callback?code=xxx&state=xxx
 *
 * OAuth redirect handler. The platform redirects here after the user
 * authorizes. We exchange the code for tokens, encrypt them, and
 * store them in the SocialConnection row.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params;

  if (!VALID_PLATFORMS.has(platform)) {
    return redirectWithError('Invalid platform');
  }

  const code = req.nextUrl.searchParams.get('code');
  const stateParam = req.nextUrl.searchParams.get('state');
  const error = req.nextUrl.searchParams.get('error');

  // Handle user-denied or platform error
  if (error) {
    return redirectWithError(`Platform denied access: ${error}`);
  }

  if (!code || !stateParam) {
    return redirectWithError('Missing code or state parameter');
  }

  // Decode and validate state
  let state: OAuthState;
  try {
    const decoded = Buffer.from(stateParam, 'base64url').toString('utf8');
    state = JSON.parse(decoded);
  } catch {
    return redirectWithError('Invalid state parameter');
  }

  if (state.platform !== platform) {
    return redirectWithError('Platform mismatch in state');
  }

  // Verify the brand exists and belongs to the user
  const brand = await prisma.brand.findFirst({
    where: { id: state.brandId, userId: state.userId },
  });
  if (!brand) {
    return redirectWithError('Brand not found');
  }

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await exchangeCodeForToken(platform as PlatformKey, code);

    // Encrypt the access token
    const encryptedAccess = encrypt(tokenResponse.accessToken);

    // Encrypt the refresh token if present
    let encryptedRefresh: { encrypted: string; iv: string; authTag: string } | null = null;
    if (tokenResponse.refreshToken) {
      encryptedRefresh = encrypt(tokenResponse.refreshToken);
    }

    // Calculate token expiry
    const tokenExpiresAt = tokenResponse.expiresIn
      ? new Date(Date.now() + tokenResponse.expiresIn * 1000)
      : null;

    // Upsert the social connection with encrypted tokens
    await prisma.socialConnection.upsert({
      where: {
        brandId_platform: { brandId: state.brandId, platform },
      },
      create: {
        brandId: state.brandId,
        platform,
        platformUserId: tokenResponse.platformUserId || null,
        accountName: tokenResponse.accountName || null,
        encryptedAccessToken: encryptedAccess.encrypted,
        // Store refresh token encrypted data as JSON alongside access token fields
        encryptedRefreshToken: encryptedRefresh
          ? JSON.stringify({
              encrypted: encryptedRefresh.encrypted,
              iv: encryptedRefresh.iv,
              authTag: encryptedRefresh.authTag,
            })
          : null,
        iv: encryptedAccess.iv,
        authTag: encryptedAccess.authTag,
        tokenExpiresAt,
        scopes: tokenResponse.scopes || null,
        status: 'CONNECTED',
      },
      update: {
        platformUserId: tokenResponse.platformUserId || undefined,
        accountName: tokenResponse.accountName || undefined,
        encryptedAccessToken: encryptedAccess.encrypted,
        encryptedRefreshToken: encryptedRefresh
          ? JSON.stringify({
              encrypted: encryptedRefresh.encrypted,
              iv: encryptedRefresh.iv,
              authTag: encryptedRefresh.authTag,
            })
          : null,
        iv: encryptedAccess.iv,
        authTag: encryptedAccess.authTag,
        tokenExpiresAt,
        scopes: tokenResponse.scopes || null,
        status: 'CONNECTED',
      },
    });

    // Create an audit log entry
    await prisma.auditLog.create({
      data: {
        brandId: state.brandId,
        userId: state.userId,
        action: 'PLATFORM_CONNECTED',
        metadata: JSON.stringify({
          platform,
          accountName: tokenResponse.accountName || null,
          platformUserId: tokenResponse.platformUserId || null,
        }),
      },
    });

    // Learning hook: platformConnected
    emitServerEvent('platform_connected', 'onboarding', undefined, { platform });

    // Redirect back to the platforms page with success
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(
      `${appUrl}/platforms?connected=${platform}&brandId=${state.brandId}`,
    );
  } catch (err) {
    console.error(`OAuth callback error for ${platform}:`, err);
    return redirectWithError(
      err instanceof Error ? err.message : 'Token exchange failed',
    );
  }
}

function redirectWithError(message: string): NextResponse {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const encoded = encodeURIComponent(message);
  return NextResponse.redirect(`${appUrl}/platforms?error=${encoded}`);
}
