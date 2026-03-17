'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@royea/shared-utils/auth-context';
import {
  Instagram,
  Facebook,
  Music2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Unplug,
  ExternalLink,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Connection {
  id: string;
  platform: string;
  platformUserId: string | null;
  accountName: string | null;
  accountAvatar: string | null;
  accountType: string | null;
  pageId: string | null;
  pageName: string | null;
  status: string;
  scopes: string | null;
  tokenExpiresAt: string | null;
  isExpired: boolean;
  expiresIn: number | null;
  needsPageSelection: boolean;
  lastSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PageOption {
  id: string;
  name: string;
  category: string;
  instagramBusinessAccount: {
    id: string;
    username: string;
    profilePictureUrl?: string;
  } | null;
}

interface PlatformMeta {
  key: string;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  hoverColor: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
}

// ---------------------------------------------------------------------------
// Platform metadata
// ---------------------------------------------------------------------------

const PLATFORMS: PlatformMeta[] = [
  {
    key: 'instagram',
    label: 'Instagram',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/20',
    hoverColor: 'hover:bg-pink-500/15',
    icon: <Instagram className="w-6 h-6" />,
  },
  {
    key: 'facebook',
    label: 'Facebook',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    hoverColor: 'hover:bg-blue-500/15',
    icon: <Facebook className="w-6 h-6" />,
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    color: 'text-[#e5e5e5]',
    bgColor: 'bg-white/5',
    borderColor: 'border-white/10',
    hoverColor: 'hover:bg-white/10',
    icon: <Music2 className="w-6 h-6" />,
  },
];

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function StatusBadge({ status, isExpired, needsPageSelection }: { status: string; isExpired: boolean; needsPageSelection: boolean }) {
  if (status === 'ACTIVE' && !isExpired) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-[#22c55e] bg-[#22c55e]/10 px-2 py-0.5 rounded-full">
        <CheckCircle2 className="w-3 h-3" /> Active
      </span>
    );
  }
  if (needsPageSelection) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-[#f59e0b] bg-[#f59e0b]/10 px-2 py-0.5 rounded-full">
        <AlertTriangle className="w-3 h-3" /> Select Page
      </span>
    );
  }
  if ((status === 'CONNECTED' || status === 'ACTIVE') && isExpired) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-[#f59e0b] bg-[#f59e0b]/10 px-2 py-0.5 rounded-full">
        <AlertTriangle className="w-3 h-3" /> Token Expired
      </span>
    );
  }
  if (status === 'CONNECTED' && !isExpired) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-[#22c55e] bg-[#22c55e]/10 px-2 py-0.5 rounded-full">
        <CheckCircle2 className="w-3 h-3" /> Connected
      </span>
    );
  }
  if (status === 'PENDING') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-[#f59e0b] bg-[#f59e0b]/10 px-2 py-0.5 rounded-full">
        <Loader2 className="w-3 h-3 animate-spin" /> Pending
      </span>
    );
  }
  if (status === 'DISCONNECTED' || status === 'REVOKED') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-[#ef4444] bg-[#ef4444]/10 px-2 py-0.5 rounded-full">
        <XCircle className="w-3 h-3" /> Disconnected
      </span>
    );
  }
  return null;
}

// ---------------------------------------------------------------------------
// Page selector component
// ---------------------------------------------------------------------------

function PageSelector({
  brandId,
  platform,
  onSelected,
}: {
  brandId: string;
  platform: string;
  onSelected: () => void;
}) {
  const { authFetch } = useAuth();
  const [pages, setPages] = useState<PageOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await authFetch(`/api/platforms/pages?brandId=${brandId}&platform=${platform}`);
        if (res.ok) {
          const data = await res.json();
          setPages(data.pages);
        } else {
          const err = await res.json();
          setError(err.error || 'Failed to load pages');
        }
      } catch {
        setError('Network error loading pages');
      }
      setLoading(false);
    }
    load();
  }, [authFetch, brandId, platform]);

  const handleSelect = async (pageId: string) => {
    setSelecting(true);
    setError(null);
    try {
      const res = await authFetch('/api/platforms/select-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId, platform, pageId }),
      });
      if (res.ok) {
        onSelected();
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to select page');
      }
    } catch {
      setError('Network error');
    }
    setSelecting(false);
  };

  if (loading) {
    return (
      <div className="mt-3 p-3 bg-white/5 rounded-lg flex items-center gap-2 text-sm text-[#9ca3af]">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading available pages...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-3 p-3 bg-[#ef4444]/10 rounded-lg text-sm text-[#ef4444]">
        {error}
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="mt-3 p-3 bg-[#f59e0b]/10 rounded-lg text-sm text-[#f59e0b]">
        No Facebook Pages found. Make sure your account manages at least one Page
        {platform === 'instagram' && ' with a linked Instagram Business account'}.
      </div>
    );
  }

  // Filter for Instagram: only show pages with linked IG accounts
  const filteredPages = platform === 'instagram'
    ? pages.filter((p) => p.instagramBusinessAccount)
    : pages;

  if (filteredPages.length === 0) {
    return (
      <div className="mt-3 p-3 bg-[#f59e0b]/10 rounded-lg text-sm text-[#f59e0b]">
        No pages with a linked Instagram Business account found. Link an Instagram account to one of your Facebook Pages first.
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <p className="text-sm font-medium text-[#9ca3af] flex items-center gap-1">
        <ChevronDown className="w-4 h-4" />
        Select a {platform === 'instagram' ? 'page with Instagram' : 'page'} to publish to:
      </p>
      {filteredPages.map((page) => (
        <button
          key={page.id}
          onClick={() => handleSelect(page.id)}
          disabled={selecting}
          className="w-full text-left p-3 rounded-lg border border-white/10 hover:border-blue-500/30 hover:bg-blue-500/5 transition-colors flex items-center justify-between"
        >
          <div>
            <p className="font-medium text-[#e5e5e5]">{page.name}</p>
            {page.category && (
              <p className="text-xs text-[#9ca3af]">{page.category}</p>
            )}
            {page.instagramBusinessAccount && (
              <p className="text-xs text-pink-400 mt-0.5">
                IG: @{page.instagramBusinessAccount.username}
              </p>
            )}
          </div>
          {selecting ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
          ) : (
            <span className="text-xs font-medium text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
              Select
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface PlatformConnectProps {
  brandId: string;
}

export function PlatformConnect({ brandId }: PlatformConnectProps) {
  const { authFetch } = useAuth();
  const searchParams = useSearchParams();

  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Show toast from URL params (after OAuth redirect)
  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');
    if (connected) {
      setToast({ type: 'success', message: `${connected} connected! Now select a page to publish to.` });
    } else if (error) {
      setToast({ type: 'error', message: error });
    }
  }, [searchParams]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  const fetchConnections = useCallback(async () => {
    try {
      const res = await authFetch(`/api/platforms/connected?brandId=${brandId}`);
      if (res.ok) {
        setConnections(await res.json());
      }
    } catch {
      // silently fail
    }
    setLoading(false);
  }, [authFetch, brandId]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const handleConnect = async (platform: string) => {
    setConnecting(platform);
    try {
      const res = await authFetch(`/api/platforms/${platform}/connect?brandId=${brandId}`);
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.url;
      } else {
        const err = await res.json();
        setToast({ type: 'error', message: err.error || 'Failed to start connection' });
      }
    } catch {
      setToast({ type: 'error', message: 'Network error. Please try again.' });
    }
    setConnecting(null);
  };

  const handleDisconnect = async (platform: string) => {
    if (!confirm(`Disconnect ${platform}? You will need to re-authorize to reconnect.`)) return;
    setDisconnecting(platform);
    try {
      const res = await authFetch(
        `/api/platforms/connected?brandId=${brandId}&platform=${platform}`,
        { method: 'DELETE' },
      );
      if (res.ok) {
        setToast({ type: 'success', message: `${platform} disconnected` });
        fetchConnections();
      } else {
        const err = await res.json();
        setToast({ type: 'error', message: err.error || 'Failed to disconnect' });
      }
    } catch {
      setToast({ type: 'error', message: 'Network error' });
    }
    setDisconnecting(null);
  };

  const getConnection = (platform: string): Connection | undefined =>
    connections.find((c) => c.platform === platform && c.status !== 'DISCONNECTED' && c.status !== 'REVOKED');

  const formatExpiry = (expiresIn: number | null): string => {
    if (expiresIn === null) return '';
    const days = Math.floor(expiresIn / 86400);
    if (days > 1) return `${days} days remaining`;
    const hours = Math.floor(expiresIn / 3600);
    if (hours > 0) return `${hours}h remaining`;
    return 'Expiring soon';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toast notification */}
      {toast && (
        <div
          className={`rounded-lg px-4 py-3 text-sm font-medium flex items-center gap-2 animate-slide-up ${
            toast.type === 'success'
              ? 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20'
              : 'bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 flex-shrink-0" />
          )}
          {toast.message}
          <button
            onClick={() => setToast(null)}
            className="ml-auto text-current opacity-50 hover:opacity-100"
          >
            x
          </button>
        </div>
      )}

      {/* Platform cards */}
      {PLATFORMS.map((p) => {
        const conn = getConnection(p.key);
        const isActive = conn?.status === 'ACTIVE' && !conn.isExpired;
        const isConnected = conn?.status === 'CONNECTED' && !conn.isExpired;
        const isExpired = (conn?.status === 'CONNECTED' || conn?.status === 'ACTIVE') && conn?.isExpired;
        const needsPageSelection = conn?.needsPageSelection ?? false;
        const isLoading = connecting === p.key || disconnecting === p.key;

        return (
          <div
            key={p.key}
            className={`rounded-xl border p-5 transition-all ${
              isActive
                ? `${p.bgColor} ${p.borderColor}`
                : needsPageSelection
                ? 'bg-[#f59e0b]/5 border-[#f59e0b]/20'
                : 'bg-[#111] border-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              {/* Left: Platform info */}
              <div className="flex items-center gap-3">
                <div className={`${p.color}`}>{p.icon}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[#e5e5e5]">{p.label}</h3>
                    {conn && (
                      <StatusBadge
                        status={conn.status}
                        isExpired={conn.isExpired}
                        needsPageSelection={needsPageSelection}
                      />
                    )}
                  </div>
                  {isActive && conn?.accountName && (
                    <p className="text-sm text-[#9ca3af] mt-0.5">{conn.accountName}</p>
                  )}
                  {isActive && conn?.pageName && conn.pageName !== conn.accountName && (
                    <p className="text-xs text-[#9ca3af]/60 mt-0.5">Page: {conn.pageName}</p>
                  )}
                  {(isActive || isConnected) && conn?.expiresIn !== null && (
                    <p className="text-xs text-[#9ca3af]/60 mt-0.5">
                      {formatExpiry(conn?.expiresIn ?? null)}
                    </p>
                  )}
                </div>
              </div>

              {/* Right: Action buttons */}
              <div className="flex items-center gap-2">
                {(isActive || isConnected) && (
                  <button
                    onClick={() => handleDisconnect(p.key)}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1.5 text-sm text-[#ef4444] hover:text-red-300 hover:bg-[#ef4444]/10 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {disconnecting === p.key ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Unplug className="w-4 h-4" />
                    )}
                    Disconnect
                  </button>
                )}

                {isExpired && (
                  <button
                    onClick={() => handleConnect(p.key)}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1.5 text-sm text-[#f59e0b] hover:text-amber-300 hover:bg-[#f59e0b]/10 px-3 py-1.5 rounded-lg transition-colors font-medium"
                  >
                    {connecting === p.key ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Reconnect
                  </button>
                )}

                {!isActive && !isConnected && !isExpired && (
                  <button
                    onClick={() => handleConnect(p.key)}
                    disabled={isLoading}
                    className={`inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition-colors ${p.color} ${p.bgColor} ${p.hoverColor} border ${p.borderColor}`}
                  >
                    {connecting === p.key ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ExternalLink className="w-4 h-4" />
                    )}
                    Connect
                  </button>
                )}
              </div>
            </div>

            {/* Page selection (shown after OAuth for Meta platforms) */}
            {needsPageSelection && (
              <PageSelector
                brandId={brandId}
                platform={p.key}
                onSelected={fetchConnections}
              />
            )}
          </div>
        );
      })}

      {/* Info note */}
      <p className="text-xs text-[#9ca3af]/40 mt-4 text-center">
        OAuth tokens are encrypted with AES-256-GCM and stored securely. PostPilot never stores plaintext credentials.
      </p>
    </div>
  );
}
