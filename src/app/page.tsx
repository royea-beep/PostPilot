'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@royea/shared-utils/auth-context';
import { Rocket, Sparkles, Share2, Zap, Image, Wand2, Send, Check } from 'lucide-react';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.push('/dashboard');
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-violet-600 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900"
      >
        Skip to main content
      </a>
      <main id="main-content" className="flex-1 flex flex-col">
        {/* Hero */}
        <section className="flex items-center justify-center px-4 py-16 sm:py-24">
          <div className="max-w-3xl text-center animate-fade-in">
            <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/40 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
              <Rocket className="w-8 h-8 text-violet-600 dark:text-violet-400" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-4 tracking-tight">
              AI Captions That Sound Like Your Brand
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-10 max-w-xl mx-auto">
              Send your client a link. They upload content, AI generates captions in their voice, they pick and publish. Done.
            </p>
            <a
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors shadow-lg shadow-violet-200 dark:shadow-violet-900/30"
            >
              Start Free — No Credit Card <Zap className="w-5 h-5" />
            </a>
            <p className="mt-3 text-sm text-gray-400 dark:text-gray-500">Already have an account? <a href="/login" className="text-violet-600 dark:text-violet-400 hover:underline">Sign in</a></p>
          </div>
        </section>

        {/* How it works */}
        <section className="px-4 py-12 sm:py-16 border-t border-gray-100 dark:border-gray-800">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 text-center mb-10">How it works</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center mb-3">
                  <Image className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Upload photo</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Client opens your magic link and uploads their image or video.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center mb-3">
                  <Wand2 className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">AI · 3 caption styles</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">AI generates three on-brand caption options in seconds.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center mb-3">
                  <Send className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Pick & publish</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">They choose one and publish to Instagram, Facebook, or TikTok.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="px-4 py-12 sm:py-16 bg-white dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 text-center mb-10">Built for creators & agencies</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                <Sparkles className="w-6 h-6 text-violet-600 dark:text-violet-400 mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Style DNA</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Learns your client&apos;s voice from their past posts. Every caption sounds like them.</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                <Share2 className="w-6 h-6 text-violet-600 dark:text-violet-400 mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Magic links</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Send one link per brand. Clients upload and publish without logins or dashboards.</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                <Rocket className="w-6 h-6 text-violet-600 dark:text-violet-400 mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Multi-platform</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">One upload publishes to Instagram, Facebook, and TikTok simultaneously.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing — 3 tiers */}
        <section className="px-4 py-12 sm:py-16 border-t border-gray-100 dark:border-gray-800">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 text-center mb-10">Simple pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Free</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">$0<span className="text-base font-normal text-gray-500 dark:text-gray-400">/mo</span></p>
                <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" /> 2 brands</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" /> 10 posts/month</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" /> AI captions</li>
                </ul>
                <a href="/register" className="mt-6 block w-full text-center py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Get started</a>
              </div>
              <div className="bg-violet-50 dark:bg-violet-900/30 rounded-2xl p-6 border-2 border-violet-200 dark:border-violet-700 shadow-md relative">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-violet-600 text-white text-xs font-medium">Popular</span>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Pro</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">$29<span className="text-base font-normal text-gray-500 dark:text-gray-400">/mo</span></p>
                <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" /> 10 brands</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" /> 100 posts/month</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" /> Style DNA & magic links</li>
                </ul>
                <a href="/register" className="mt-6 block w-full text-center py-2.5 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700 transition-colors">Start Free — No Credit Card</a>
              </div>
              <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Agency</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">$79<span className="text-base font-normal text-gray-500 dark:text-gray-400">/mo</span></p>
                <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" /> Unlimited brands</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" /> Unlimited posts</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" /> Everything in Pro</li>
                </ul>
                <a href="/register" className="mt-6 block w-full text-center py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Start Free — No Credit Card</a>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 py-12 sm:py-16 border-t border-gray-100 dark:border-gray-800">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Ready to sound like you?</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">No credit card required. Create your account and send your first magic link in minutes.</p>
            <a
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors"
            >
              Start Free — No Credit Card <Zap className="w-5 h-5" />
            </a>
          </div>
        </section>
      </main>

      <footer className="text-center py-6 text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-800">
        Built by Roy &amp; Claude Opus
      </footer>
    </div>
  );
}
