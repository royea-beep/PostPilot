'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@royea/shared-utils/auth-context';
import { Rocket, Sparkles, Share2, Zap } from 'lucide-react';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.push('/dashboard');
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-2xl text-center animate-fade-in">
          <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
            <Rocket className="w-8 h-8 text-violet-600" />
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Social media on<br />
            <span className="text-violet-600">autopilot.</span>
          </h1>

          <p className="text-lg text-gray-500 mb-8 max-w-md mx-auto">
            Send your client a link. They upload content, AI generates captions in their voice, they pick and publish. Done.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <a
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors"
            >
              Get Started <Zap className="w-5 h-5" />
            </a>
            <a
              href="/login"
              className="inline-flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold px-8 py-3.5 rounded-xl transition-colors"
            >
              Sign In
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-left">
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <Sparkles className="w-5 h-5 text-violet-600 mb-2" />
              <h3 className="font-semibold text-gray-900 text-sm mb-1">AI Style DNA</h3>
              <p className="text-xs text-gray-500">Learns your client&apos;s voice from their past posts. Every caption sounds like them.</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <Share2 className="w-5 h-5 text-violet-600 mb-2" />
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Multi-Platform</h3>
              <p className="text-xs text-gray-500">One upload publishes to Instagram, Facebook, and TikTok simultaneously.</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <Rocket className="w-5 h-5 text-violet-600 mb-2" />
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Zero Friction</h3>
              <p className="text-xs text-gray-500">Client gets a link, uploads, picks from 3 AI options, publishes. That&apos;s it.</p>
            </div>
          </div>
        </div>
      </div>

      <footer className="text-center py-4 text-xs text-gray-400">
        Built by Roy &amp; Claude Opus
      </footer>
    </div>
  );
}
