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
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#0a0a0a]"
      >
        Skip to main content
      </a>
      <main id="main-content" className="flex-1 flex flex-col">
        {/* Hero */}
        <section className="flex items-center justify-center px-4 py-16 sm:py-24">
          <div className="max-w-3xl text-center animate-fade-in">
            <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
              <Rocket className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#e5e5e5] mb-4 tracking-tight">
              AI Captions That Sound Like Your Brand
            </h1>
            <p className="text-lg text-[#9ca3af] mb-10 max-w-xl mx-auto">
              Send your client a link. They upload content, AI generates captions in their voice, they pick and publish. Done.
            </p>
            <a
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-lg transition-colors shadow-lg shadow-blue-600/20"
            >
              Start Free — No Credit Card <Zap className="w-5 h-5" />
            </a>
            <p className="mt-3 text-sm text-[#9ca3af]">Already have an account? <a href="/login" className="text-blue-400 hover:text-blue-300 hover:underline">Sign in</a></p>
          </div>
        </section>

        {/* How it works */}
        <section className="px-4 py-12 sm:py-16 border-t border-white/10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#e5e5e5] text-center mb-10">How it works</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3">
                  <Image className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="font-semibold text-[#e5e5e5] mb-1">Upload photo</h3>
                <p className="text-sm text-[#9ca3af]">Client opens your magic link and uploads their image or video.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3">
                  <Wand2 className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="font-semibold text-[#e5e5e5] mb-1">AI · 3 caption styles</h3>
                <p className="text-sm text-[#9ca3af]">AI generates three on-brand caption options in seconds.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3">
                  <Send className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="font-semibold text-[#e5e5e5] mb-1">Pick & publish</h3>
                <p className="text-sm text-[#9ca3af]">They choose one, copy it, and post to any platform.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="px-4 py-12 sm:py-16 border-t border-white/10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#e5e5e5] text-center mb-10">Built for creators & agencies</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
              <div className="bg-[#111] rounded-xl p-5 border border-white/10">
                <Sparkles className="w-6 h-6 text-blue-400 mb-3" />
                <h3 className="font-semibold text-[#e5e5e5] mb-2">Style DNA</h3>
                <p className="text-sm text-[#9ca3af]">Learns your client&apos;s voice from their past posts. Every caption sounds like them.</p>
              </div>
              <div className="bg-[#111] rounded-xl p-5 border border-white/10">
                <Share2 className="w-6 h-6 text-blue-400 mb-3" />
                <h3 className="font-semibold text-[#e5e5e5] mb-2">Magic links</h3>
                <p className="text-sm text-[#9ca3af]">Send one link per brand. Clients upload and publish without logins or dashboards.</p>
              </div>
              <div className="bg-[#111] rounded-xl p-5 border border-white/10">
                <Rocket className="w-6 h-6 text-blue-400 mb-3" />
                <h3 className="font-semibold text-[#e5e5e5] mb-2">Multi-platform</h3>
                <p className="text-sm text-[#9ca3af]">Generate captions for Instagram and Facebook from a single upload.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing — 3 tiers */}
        <section className="px-4 py-12 sm:py-16 border-t border-white/10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#e5e5e5] text-center mb-10">Simple pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#111] rounded-2xl p-6 border border-white/10">
                <h3 className="font-bold text-[#e5e5e5] text-lg">Free</h3>
                <p className="mt-2 text-3xl font-bold text-[#e5e5e5]">$0<span className="text-base font-normal text-[#9ca3af]">/mo</span></p>
                <ul className="mt-4 space-y-2 text-sm text-[#9ca3af]">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400 shrink-0" /> 2 brands</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400 shrink-0" /> 10 posts/month</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400 shrink-0" /> AI captions</li>
                </ul>
                <a href="/register" className="mt-6 block w-full text-center py-2.5 rounded-lg border border-white/10 text-[#9ca3af] font-medium hover:bg-white/5 transition-colors">Get started</a>
              </div>
              <div className="bg-blue-600/10 rounded-2xl p-6 border-2 border-blue-500/40 shadow-lg shadow-blue-500/10 relative">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-blue-600 text-white text-xs font-medium">Popular</span>
                <h3 className="font-bold text-[#e5e5e5] text-lg">Pro</h3>
                <p className="mt-2 text-3xl font-bold text-[#e5e5e5]">$29<span className="text-base font-normal text-[#9ca3af]">/mo</span></p>
                <ul className="mt-4 space-y-2 text-sm text-[#9ca3af]">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400 shrink-0" /> 10 brands</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400 shrink-0" /> 100 posts/month</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400 shrink-0" /> Style DNA & magic links</li>
                </ul>
                <a href="/register" className="mt-6 block w-full text-center py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors">Start Free — No Credit Card</a>
              </div>
              <div className="bg-[#111] rounded-2xl p-6 border border-white/10">
                <h3 className="font-bold text-[#e5e5e5] text-lg">Agency</h3>
                <p className="mt-2 text-3xl font-bold text-[#e5e5e5]">$79<span className="text-base font-normal text-[#9ca3af]">/mo</span></p>
                <ul className="mt-4 space-y-2 text-sm text-[#9ca3af]">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400 shrink-0" /> Unlimited brands</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400 shrink-0" /> Unlimited posts</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400 shrink-0" /> Everything in Pro</li>
                </ul>
                <a href="/register" className="mt-6 block w-full text-center py-2.5 rounded-lg border border-white/10 text-[#9ca3af] font-medium hover:bg-white/5 transition-colors">Start Free — No Credit Card</a>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 py-12 sm:py-16 border-t border-white/10">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-[#e5e5e5] mb-3">Ready to sound like you?</h2>
            <p className="text-[#9ca3af] mb-6">No credit card required. Create your account and send your first magic link in minutes.</p>
            <a
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-lg transition-colors"
            >
              Start Free — No Credit Card <Zap className="w-5 h-5" />
            </a>
          </div>
        </section>
      </main>

      <footer className="text-center py-6 text-xs text-[#9ca3af]/60 border-t border-white/10">
        Built by Roy &amp; Claude Opus
      </footer>
    </div>
  );
}
