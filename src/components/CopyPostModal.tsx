'use client';

import { useState } from 'react';
import { Check, Copy, ExternalLink, X } from 'lucide-react';

interface CopyPostModalProps {
  caption: string;
  hashtags: string[];
  platforms: string[];
  isHe?: boolean;
  onClose: () => void;
  onDone: () => void;
}

export default function CopyPostModal({
  caption,
  hashtags,
  platforms,
  isHe = false,
  onClose,
  onDone,
}: CopyPostModalProps) {
  const [copied, setCopied] = useState(false);

  const fullText = hashtags.length > 0
    ? `${caption}\n\n${hashtags.map((h) => `#${h}`).join(' ')}`
    : caption;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const platformLinks: Record<string, { label: string; url: string; color: string }> = {
    instagram: {
      label: 'Instagram',
      url: 'https://www.instagram.com/',
      color: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
    },
    facebook: {
      label: 'Facebook',
      url: 'https://www.facebook.com/',
      color: 'bg-blue-600 hover:bg-blue-700',
    },
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-5 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#e5e5e5]">
            {isHe ? 'העתק ופרסם' : 'Copy & Post'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 text-[#9ca3af] hover:text-[#e5e5e5] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Caption preview */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4 max-h-48 overflow-y-auto">
          <p className="text-sm text-[#e5e5e5]/80 leading-relaxed whitespace-pre-wrap" dir={isHe ? 'rtl' : 'ltr'}>
            {caption}
          </p>
          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {hashtags.map((tag, i) => (
                <span key={i} className="text-xs text-blue-400/70">#{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-lg font-semibold transition-all ${
            copied
              ? 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-5 h-5" />
              {isHe ? 'הועתק!' : 'Copied to clipboard!'}
            </>
          ) : (
            <>
              <Copy className="w-5 h-5" />
              {isHe ? 'העתק כיתוב' : 'Copy Caption'}
            </>
          )}
        </button>

        {/* Platform links */}
        <div className="space-y-2">
          <p className="text-xs text-[#9ca3af] text-center">
            {isHe ? 'פתחו את הפלטפורמה והדביקו:' : 'Open your platform and paste:'}
          </p>
          <div className="flex gap-2">
            {platforms.map((p) => {
              const link = platformLinks[p];
              if (!link) return null;
              return (
                <a
                  key={p}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-white font-medium transition-colors ${link.color}`}
                >
                  <ExternalLink className="w-4 h-4" />
                  {isHe ? `פתח ${link.label}` : `Open ${link.label}`}
                </a>
              );
            })}
          </div>
        </div>

        {/* Done button */}
        <button
          onClick={onDone}
          className="w-full py-3 rounded-lg border border-white/10 text-[#9ca3af] font-medium hover:bg-white/5 transition-colors"
        >
          {isHe ? 'סיימתי' : 'Done'}
        </button>
      </div>
    </div>
  );
}
