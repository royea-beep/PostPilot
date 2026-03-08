'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'postpilot-cookie-consent';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      // Small delay so the banner slides in after page load
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
    if (saved === 'rejected') {
      disableAnalytics();
    }
  }, []);

  function disableAnalytics() {
    // Disable Google Analytics if present
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>)['ga-disable'] = true;
    }
    // Remove existing GA cookies
    document.cookie.split(';').forEach((c) => {
      const name = c.trim().split('=')[0];
      if (name.startsWith('_ga') || name.startsWith('_gid')) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      }
    });
  }

  function handleAccept() {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    setVisible(false);
  }

  function handleReject() {
    localStorage.setItem(STORAGE_KEY, 'rejected');
    disableAnalytics();
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up"
    >
      <div className="border-t border-gray-200 bg-white/95 backdrop-blur-md shadow-lg px-5 py-4">
        <div className="mx-auto max-w-3xl flex flex-wrap items-center gap-4 justify-between">
          <div className="flex-1 min-w-[240px]">
            <p className="text-sm font-semibold text-gray-900">
              This site uses cookies
            </p>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              We use cookies to improve your experience and analyze site usage.
              By accepting, you consent to our use of cookies.
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={handleAccept}
              className="bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm px-5 py-2 rounded-xl transition-colors cursor-pointer"
            >
              Accept
            </button>
            <button
              onClick={handleReject}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm px-5 py-2 rounded-xl border border-gray-200 transition-colors cursor-pointer"
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
