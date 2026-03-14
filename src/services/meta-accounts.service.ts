/**
 * Meta Accounts Service
 *
 * Fetches available Facebook Pages and Instagram Business accounts
 * using a user's long-lived access token.
 */

const GRAPH_API = 'https://graph.facebook.com/v21.0';

export interface MetaPage {
  id: string;
  name: string;
  accessToken: string;
  category: string;
  instagramBusinessAccount: {
    id: string;
    username: string;
    profilePictureUrl?: string;
  } | null;
}

export interface MetaAccountsResult {
  pages: MetaPage[];
  error?: string;
}

/**
 * Fetch all Facebook Pages the user manages, including linked IG Business accounts.
 */
export async function fetchMetaPages(userAccessToken: string): Promise<MetaAccountsResult> {
  const fields = 'id,name,access_token,category,instagram_business_account{id,username,profile_picture_url}';
  const url = `${GRAPH_API}/me/accounts?fields=${encodeURIComponent(fields)}&access_token=${userAccessToken}&limit=100`;

  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return {
      pages: [],
      error: err?.error?.message || `Failed to fetch pages: ${res.status}`,
    };
  }

  const data = await res.json();
  const pages: MetaPage[] = (data.data || []).map((page: Record<string, unknown>) => {
    const igAccount = page.instagram_business_account as Record<string, string> | undefined;
    return {
      id: page.id as string,
      name: page.name as string,
      accessToken: page.access_token as string,
      category: (page.category as string) || '',
      instagramBusinessAccount: igAccount
        ? {
            id: igAccount.id,
            username: igAccount.username || '',
            profilePictureUrl: igAccount.profile_picture_url || undefined,
          }
        : null,
    };
  });

  return { pages };
}

/**
 * Verify a Page Access Token is still valid.
 */
export async function verifyPageToken(pageAccessToken: string): Promise<{
  valid: boolean;
  expiresAt?: number;
  error?: string;
}> {
  const url = `${GRAPH_API}/debug_token?input_token=${pageAccessToken}&access_token=${pageAccessToken}`;
  const res = await fetch(url);
  if (!res.ok) {
    return { valid: false, error: 'Token verification failed' };
  }
  const data = await res.json();
  const tokenData = data.data;
  return {
    valid: tokenData?.is_valid === true,
    expiresAt: tokenData?.expires_at || undefined,
  };
}
