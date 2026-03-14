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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-md space-y-5 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {isHe ? 'העתק ופרסם' : 'Copy & Post'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Caption preview */}
        <div className="bg-gray-50 rounded-xl p-4 max-h-48 overflow-y-auto">
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap" dir={isHe ? 'rtl' : 'ltr'}>
            {caption}
          </p>
          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {hashtags.map((tag, i) => (
                <span key={i} className="text-xs text-violet-500">#{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold transition-all ${
            copied
              ? 'bg-green-100 text-green-700'
              : 'bg-violet-600 hover:bg-violet-700 text-white'
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
          <p className="text-xs text-gray-500 text-center">
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
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-medium transition-colors ${link.color}`}
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
          className="w-full py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
        >
          {isHe ? 'סיימתי' : 'Done'}
        </button>
      </div>
    </div>
  );
}
