'use client';

import { useState } from 'react';
import {
  Instagram,
  Facebook,
  Music2,
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle,
  KeyRound,
  Copy,
  Check,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PlatformKey = 'instagram' | 'facebook' | 'tiktok';

type RequestStatus = 'idle' | 'pending' | 'received' | 'error';

interface CredentialPlatform {
  key: PlatformKey;
  label: string;
  keydropSlug: string;
  color: string;
  bgColor: string;
  borderColor: string;
  hoverColor: string;
  icon: React.ReactNode;
  description: string;
  fields: string[];
}

interface CredentialRequestProps {
  /** Base URL of the KeyDrop (1-2Clicks) app instance */
  keydropBaseUrl?: string;
  /** Called when credential status changes */
  onStatusChange?: (platform: PlatformKey, status: RequestStatus) => void;
  /** Pre-set statuses for each platform */
  statuses?: Partial<Record<PlatformKey, RequestStatus>>;
}

// ---------------------------------------------------------------------------
// Platform definitions with KeyDrop template slugs
// ---------------------------------------------------------------------------

const CREDENTIAL_PLATFORMS: CredentialPlatform[] = [
  {
    key: 'instagram',
    label: 'Instagram Business API',
    keydropSlug: 'postpilot-instagram',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    hoverColor: 'hover:bg-pink-100',
    icon: <Instagram className="w-5 h-5" />,
    description: 'Required for publishing posts and stories to your Instagram Business account.',
    fields: ['Client ID', 'Client Secret', 'Access Token'],
  },
  {
    key: 'facebook',
    label: 'Facebook Pages API',
    keydropSlug: 'postpilot-facebook-pages',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    hoverColor: 'hover:bg-blue-100',
    icon: <Facebook className="w-5 h-5" />,
    description: 'Required for managing and publishing to your Facebook Page.',
    fields: ['App ID', 'App Secret', 'Page Access Token'],
  },
  {
    key: 'tiktok',
    label: 'TikTok for Business',
    keydropSlug: 'postpilot-tiktok',
    color: 'text-gray-900',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-300',
    hoverColor: 'hover:bg-gray-100',
    icon: <Music2 className="w-5 h-5" />,
    description: 'Required for uploading and publishing videos to TikTok.',
    fields: ['App ID', 'App Secret'],
  },
];

// ---------------------------------------------------------------------------
// Status badge component
// ---------------------------------------------------------------------------

function StatusIndicator({ status }: { status: RequestStatus }) {
  switch (status) {
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
          <Clock className="w-3 h-3" /> Awaiting Credentials
        </span>
      );
    case 'received':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
          <CheckCircle2 className="w-3 h-3" /> Credentials Received
        </span>
      );
    case 'error':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
          <XCircle className="w-3 h-3" /> Error
        </span>
      );
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function CredentialRequest({
  keydropBaseUrl = 'https://keydrop.app',
  onStatusChange,
  statuses = {},
}: CredentialRequestProps) {
  const [platformStatuses, setPlatformStatuses] = useState<
    Partial<Record<PlatformKey, RequestStatus>>
  >(statuses);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const getStatus = (key: PlatformKey): RequestStatus =>
    platformStatuses[key] || 'idle';

  const handleOpenKeyDrop = (platform: CredentialPlatform) => {
    // Open 1-2Clicks (KeyDrop) with the specific template pre-selected
    const url = `${keydropBaseUrl}/request/${platform.keydropSlug}`;
    window.open(url, '_blank', 'noopener,noreferrer');

    // Mark as pending
    const newStatuses = { ...platformStatuses, [platform.key]: 'pending' as const };
    setPlatformStatuses(newStatuses);
    onStatusChange?.(platform.key, 'pending');
  };

  const handleMarkReceived = (key: PlatformKey) => {
    const newStatuses = { ...platformStatuses, [key]: 'received' as const };
    setPlatformStatuses(newStatuses);
    onStatusChange?.(key, 'received');
  };

  const handleCopyLink = async (platform: CredentialPlatform) => {
    const url = `${keydropBaseUrl}/request/${platform.keydropSlug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedSlug(platform.keydropSlug);
      setTimeout(() => setCopiedSlug(null), 2000);
    } catch {
      // Fallback: open the link instead
      handleOpenKeyDrop(platform);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-violet-100 rounded-lg">
          <KeyRound className="w-5 h-5 text-violet-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Platform Credentials</h3>
          <p className="text-sm text-gray-500">
            Securely collect API credentials via 1-2Clicks (KeyDrop)
          </p>
        </div>
      </div>

      {/* Platform cards */}
      <div className="space-y-3">
        {CREDENTIAL_PLATFORMS.map((platform) => {
          const status = getStatus(platform.key);
          const isReceived = status === 'received';

          return (
            <div
              key={platform.key}
              className={`rounded-xl border p-4 transition-all ${
                isReceived
                  ? `${platform.bgColor} ${platform.borderColor}`
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left: Platform info */}
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`mt-0.5 ${platform.color}`}>{platform.icon}</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium text-gray-900">{platform.label}</h4>
                      <StatusIndicator status={status} />
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {platform.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {platform.fields.map((field) => (
                        <span
                          key={field}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Copy link button */}
                  <button
                    onClick={() => handleCopyLink(platform)}
                    className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Copy credential request link"
                  >
                    {copiedSlug === platform.keydropSlug ? (
                      <Check className="w-3.5 h-3.5 text-green-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {status === 'pending' && (
                    <button
                      onClick={() => handleMarkReceived(platform.key)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600 hover:text-green-700 hover:bg-green-50 px-3 py-1.5 rounded-lg transition-colors border border-green-200"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Mark Received
                    </button>
                  )}

                  {!isReceived && (
                    <button
                      onClick={() => handleOpenKeyDrop(platform)}
                      className={`inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition-colors ${platform.color} ${platform.bgColor} ${platform.hoverColor} border ${platform.borderColor}`}
                    >
                      <ExternalLink className="w-4 h-4" />
                      {status === 'pending' ? 'Open Again' : 'Request via 1-2Clicks'}
                    </button>
                  )}

                  {isReceived && (
                    <button
                      onClick={() => handleOpenKeyDrop(platform)}
                      className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Update
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer info */}
      <p className="text-xs text-gray-400 text-center">
        Credentials are collected securely through 1-2Clicks (KeyDrop) with
        field-level validation, step-by-step guides, and encrypted storage.
      </p>
    </div>
  );
}
