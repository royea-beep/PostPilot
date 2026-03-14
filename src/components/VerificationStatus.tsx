'use client';

import { AlertTriangle, ExternalLink, ShieldCheck } from 'lucide-react';

/**
 * VerificationStatus — shows Meta Business Verification status.
 * Dark theme, card-based UI.
 */
export function VerificationStatus() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-white font-semibold text-base">Meta Business Verification</h3>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/20">
              Pending Verification
            </span>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">
            Direct publishing to Facebook and Instagram requires Meta Business Verification.
            This is a one-time process that typically takes 2-4 weeks.
          </p>
        </div>
      </div>

      {/* What this means */}
      <div className="bg-gray-800/50 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-4 h-4 text-gray-400" />
          <span className="text-gray-300 text-sm font-medium">What does this mean?</span>
        </div>
        <ul className="text-gray-400 text-sm space-y-1.5 ml-6 list-disc">
          <li>PostPilot is currently in Development Mode with Meta</li>
          <li>You can still generate AI captions and preview posts</li>
          <li>Direct publishing will be enabled automatically once approved</li>
          <li>Copy-paste publishing is available as a workaround</li>
        </ul>
      </div>

      {/* Action */}
      <a
        href="https://business.facebook.com/settings"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors"
      >
        <span>Open Meta Business Manager</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </a>

      {/* Auto-enable note */}
      <p className="text-gray-500 text-xs mt-3">
        Once approved, direct posting will be enabled automatically — no action needed on your end.
      </p>
    </div>
  );
}
