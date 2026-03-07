/**
 * Platform OAuth configuration for Instagram, Facebook, and TikTok.
 *
 * Required environment variables (set in .env):
 *   INSTAGRAM_CLIENT_ID, INSTAGRAM_CLIENT_SECRET
 *   FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET
 *   TIKTOK_CLIENT_ID, TIKTOK_CLIENT_SECRET (called "Client key / secret" in TikTok dev portal)
 *   NEXT_PUBLIC_APP_URL  — e.g. https://postpilot.app  (no trailing slash)
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PlatformKey = 'instagram' | 'facebook' | 'tiktok';

export interface PlatformConfig {
  key: PlatformKey;
  label: string;
  color: string;           // Tailwind classes for badge
  icon: string;            // Lucide icon name hint (consumed by UI)
  authUrl: string;         // Base authorization URL
  tokenUrl: string;        // Token exchange endpoint
  scopes: string[];        // OAuth scopes requested
  clientId: string;
  clientSecret: string;
  redirectUri: string;     // Computed from NEXT_PUBLIC_APP_URL
}

export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;      // seconds
  platformUserId?: string;
  accountName?: string;
  scopes?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function env(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing environment variable: ${key}`);
  return v;
}

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
}

// ---------------------------------------------------------------------------
// Per-platform configs
// ---------------------------------------------------------------------------

function instagramConfig(): PlatformConfig {
  return {
    key: 'instagram',
    label: 'Instagram',
    color: 'bg-pink-100 text-pink-700',
    icon: 'Instagram',
    authUrl: 'https://www.facebook.com/v21.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v21.0/oauth/access_token',
    scopes: [
      'instagram_basic',
      'instagram_content_publish',
      'instagram_manage_comments',
      'instagram_manage_insights',
      'pages_show_list',
      'pages_read_engagement',
    ],
    clientId: env('INSTAGRAM_CLIENT_ID'),
    clientSecret: env('INSTAGRAM_CLIENT_SECRET'),
    redirectUri: `${appUrl()}/api/platforms/instagram/callback`,
  };
}

function facebookConfig(): PlatformConfig {
  return {
    key: 'facebook',
    label: 'Facebook',
    color: 'bg-blue-100 text-blue-700',
    icon: 'Facebook',
    authUrl: 'https://www.facebook.com/v21.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v21.0/oauth/access_token',
    scopes: [
      'pages_manage_posts',
      'pages_read_engagement',
      'pages_show_list',
      'pages_manage_metadata',
      'publish_video',
    ],
    clientId: env('FACEBOOK_CLIENT_ID'),
    clientSecret: env('FACEBOOK_CLIENT_SECRET'),
    redirectUri: `${appUrl()}/api/platforms/facebook/callback`,
  };
}

function tiktokConfig(): PlatformConfig {
  return {
    key: 'tiktok',
    label: 'TikTok',
    color: 'bg-gray-900 text-white',
    icon: 'Music2',
    authUrl: 'https://www.tiktok.com/v2/auth/authorize/',
    tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token/',
    scopes: [
      'user.info.basic',
      'video.publish',
      'video.upload',
    ],
    clientId: env('TIKTOK_CLIENT_ID'),
    clientSecret: env('TIKTOK_CLIENT_SECRET'),
    redirectUri: `${appUrl()}/api/platforms/tiktok/callback`,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const CONFIG_MAP: Record<PlatformKey, () => PlatformConfig> = {
  instagram: instagramConfig,
  facebook: facebookConfig,
  tiktok: tiktokConfig,
};

export function getPlatformConfig(platform: PlatformKey): PlatformConfig {
  const factory = CONFIG_MAP[platform];
  if (!factory) throw new Error(`Unknown platform: ${platform}`);
  return factory();
}

export function getAllPlatformKeys(): PlatformKey[] {
  return ['instagram', 'facebook', 'tiktok'];
}

/** Platform metadata safe for the client (no secrets). */
export function getPlatformMeta() {
  return [
    { key: 'instagram' as const, label: 'Instagram', color: 'bg-pink-100 text-pink-700', icon: 'Instagram' },
    { key: 'facebook' as const, label: 'Facebook', color: 'bg-blue-100 text-blue-700', icon: 'Facebook' },
    { key: 'tiktok' as const, label: 'TikTok', color: 'bg-gray-900 text-white', icon: 'Music2' },
  ];
}

// ---------------------------------------------------------------------------
// Build Authorization URL
// ---------------------------------------------------------------------------

export function buildAuthUrl(platform: PlatformKey, state: string): string {
  const cfg = getPlatformConfig(platform);

  if (platform === 'tiktok') {
    const params = new URLSearchParams({
      client_key: cfg.clientId,
      response_type: 'code',
      scope: cfg.scopes.join(','),
      redirect_uri: cfg.redirectUri,
      state,
    });
    return `${cfg.authUrl}?${params}`;
  }

  // Meta platforms (Instagram & Facebook share the same OAuth flow)
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    response_type: 'code',
    scope: cfg.scopes.join(','),
    state,
  });
  return `${cfg.authUrl}?${params}`;
}

// ---------------------------------------------------------------------------
// Exchange code for tokens
// ---------------------------------------------------------------------------

export async function exchangeCodeForToken(
  platform: PlatformKey,
  code: string,
): Promise<TokenResponse> {
  const cfg = getPlatformConfig(platform);

  if (platform === 'tiktok') {
    return exchangeTikTokToken(cfg, code);
  }

  return exchangeMetaToken(cfg, code, platform);
}

async function exchangeMetaToken(
  cfg: PlatformConfig,
  code: string,
  platform: PlatformKey,
): Promise<TokenResponse> {
  // Step 1: Exchange code for short-lived token
  const tokenParams = new URLSearchParams({
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    redirect_uri: cfg.redirectUri,
    code,
  });

  const tokenRes = await fetch(`${cfg.tokenUrl}?${tokenParams}`);
  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Meta token exchange failed: ${err}`);
  }
  const tokenData = await tokenRes.json();
  const shortToken = tokenData.access_token as string;

  // Step 2: Exchange for long-lived token (60 days)
  const longParams = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    fb_exchange_token: shortToken,
  });
  const longRes = await fetch(`https://graph.facebook.com/v21.0/oauth/access_token?${longParams}`);
  const longData = longRes.ok ? await longRes.json() : null;
  const accessToken = longData?.access_token || shortToken;
  const expiresIn = longData?.expires_in || tokenData.expires_in;

  // Step 3: Get user info
  const meRes = await fetch(`https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${accessToken}`);
  const meData = meRes.ok ? await meRes.json() : {};

  // For Instagram: we also need the connected IG account via pages
  let accountName = meData.name || undefined;
  let platformUserId = meData.id || undefined;

  if (platform === 'instagram') {
    try {
      const pagesRes = await fetch(
        `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,instagram_business_account&access_token=${accessToken}`,
      );
      const pagesData = pagesRes.ok ? await pagesRes.json() : { data: [] };
      const pageWithIG = pagesData.data?.find((p: Record<string, unknown>) => p.instagram_business_account);
      if (pageWithIG?.instagram_business_account) {
        const igId = (pageWithIG.instagram_business_account as Record<string, string>).id;
        const igRes = await fetch(
          `https://graph.facebook.com/v21.0/${igId}?fields=username&access_token=${accessToken}`,
        );
        const igData = igRes.ok ? await igRes.json() : {};
        platformUserId = igId;
        accountName = igData.username ? `@${igData.username}` : accountName;
      }
    } catch {
      // Non-fatal: we still have the token
    }
  }

  return {
    accessToken,
    expiresIn: typeof expiresIn === 'number' ? expiresIn : 5184000, // default 60 days
    platformUserId,
    accountName,
    scopes: cfg.scopes.join(','),
  };
}

async function exchangeTikTokToken(
  cfg: PlatformConfig,
  code: string,
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    client_key: cfg.clientId,
    client_secret: cfg.clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: cfg.redirectUri,
  });

  const res = await fetch(cfg.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TikTok token exchange failed: ${err}`);
  }

  const data = await res.json();
  const tokenData = data.data || data;

  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresIn: tokenData.expires_in,
    platformUserId: tokenData.open_id,
    scopes: tokenData.scope,
  };
}

// ---------------------------------------------------------------------------
// Refresh tokens
// ---------------------------------------------------------------------------

export async function refreshPlatformToken(
  platform: PlatformKey,
  refreshToken: string,
): Promise<TokenResponse> {
  if (platform === 'tiktok') {
    return refreshTikTokToken(refreshToken);
  }

  // Meta long-lived tokens can be refreshed by exchanging them again
  // (they act as their own refresh token within 60 days)
  return refreshMetaToken(platform, refreshToken);
}

async function refreshMetaToken(
  platform: PlatformKey,
  currentToken: string,
): Promise<TokenResponse> {
  const cfg = getPlatformConfig(platform);
  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    fb_exchange_token: currentToken,
  });

  const res = await fetch(`https://graph.facebook.com/v21.0/oauth/access_token?${params}`);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Meta token refresh failed: ${err}`);
  }

  const data = await res.json();
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in || 5184000,
    scopes: cfg.scopes.join(','),
  };
}

async function refreshTikTokToken(refreshToken: string): Promise<TokenResponse> {
  const cfg = getPlatformConfig('tiktok');
  const body = new URLSearchParams({
    client_key: cfg.clientId,
    client_secret: cfg.clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const res = await fetch(cfg.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TikTok token refresh failed: ${err}`);
  }

  const data = await res.json();
  const tokenData = data.data || data;

  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresIn: tokenData.expires_in,
    platformUserId: tokenData.open_id,
    scopes: tokenData.scope,
  };
}
