'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
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
  status: string;
  scopes: string | null;
  tokenExpiresAt: string | null;
  isExpired: boolean;
  expiresIn: number | null;
  createdAt: string;
  updatedAt: string;
}

interface PlatformMeta {
  key: string;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  hoverColor: string;
  icon: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Platform metadata (client-side, no secrets)
// ---------------------------------------------------------------------------

const PLATFORMS: PlatformMeta[] = [
  {
    key: 'instagram',
    label: 'Instagram',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    hoverColor: 'hover:bg-pink-100',
    icon: <Instagram className="w-6 h-6" />,
  },
  {
    key: 'facebook',
    label: 'Facebook',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    hoverColor: 'hover:bg-blue-100',
    icon: <Facebook className="w-6 h-6" />,
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    color: 'text-gray-900',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-300',
    hoverColor: 'hover:bg-gray-100',
    icon: <Music2 className="w-6 h-6" />,
  },
];

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function StatusBadge({ status, isExpired }: { status: string; isExpired: boolean }) {
  if (status === 'CONNECTED' && !isExpired) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
        <CheckCircle2 className="w-3 h-3" /> Connected
      </span>
    );
  }
  if (status === 'CONNECTED' && isExpired) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
        <AlertTriangle className="w-3 h-3" /> Token Expired
      </span>
    );
  }
  if (status === 'PENDING') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">
        <Loader2 className="w-3 h-3 animate-spin" /> Pending
      </span>
    );
  }
  if (status === 'REVOKED') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
        <XCircle className="w-3 h-3" /> Disconnected
      </span>
    );
  }
  return null;
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
      setToast({ type: 'success', message: `${connected} connected successfully!` });
    } else if (error) {
      setToast({ type: 'error', message: error });
    }
  }, [searchParams]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
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
        // Redirect to the OAuth authorization URL
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
    connections.find((c) => c.platform === platform && c.status !== 'REVOKED');

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
        <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
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
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
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
        const isConnected = conn?.status === 'CONNECTED' && !conn.isExpired;
        const isExpired = conn?.status === 'CONNECTED' && conn.isExpired;
        const isLoading = connecting === p.key || disconnecting === p.key;

        return (
          <div
            key={p.key}
            className={`rounded-xl border p-5 transition-all ${
              isConnected
                ? `${p.bgColor} ${p.borderColor}`
                : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              {/* Left: Platform info */}
              <div className="flex items-center gap-3">
                <div className={`${p.color}`}>{p.icon}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{p.label}</h3>
                    {conn && <StatusBadge status={conn.status} isExpired={conn.isExpired} />}
                  </div>
                  {isConnected && conn?.accountName && (
                    <p className="text-sm text-gray-500 mt-0.5">{conn.accountName}</p>
                  )}
                  {isConnected && conn?.expiresIn !== null && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatExpiry(conn?.expiresIn ?? null)}
                    </p>
                  )}
                </div>
              </div>

              {/* Right: Action buttons */}
              <div className="flex items-center gap-2">
                {isConnected && (
                  <button
                    onClick={() => handleDisconnect(p.key)}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
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
                    className="inline-flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-3 py-1.5 rounded-lg transition-colors font-medium"
                  >
                    {connecting === p.key ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Reconnect
                  </button>
                )}

                {!isConnected && !isExpired && (
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
          </div>
        );
      })}

      {/* Info note */}
      <p className="text-xs text-gray-400 mt-4 text-center">
        OAuth tokens are encrypted with AES-256-GCM and stored securely. PostPilot never stores plaintext credentials.
      </p>
    </div>
  );
}
