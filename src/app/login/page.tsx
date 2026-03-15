'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@royea/shared-utils/auth-context';
import { Rocket, Loader2, KeyRound } from 'lucide-react';

const ACCESS_CODES = (process.env.NEXT_PUBLIC_ACCESS_CODES || '').split(',').filter(Boolean);

export default function LoginPage() {
  const router = useRouter();
  const { login, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [accessCode, setAccessCode] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAccessCode = async () => {
    const code = accessCode.trim().toUpperCase();
    if (!code) { setCodeError('הזן קוד גישה'); return; }
    if (!ACCESS_CODES.includes(code)) { setCodeError('קוד לא תקין'); return; }

    setCodeError('');
    setCodeLoading(true);
    try {
      const codeEmail = `${code.toLowerCase()}@postpilot.app`;
      const codePass = `access-${code}-2026`;
      try {
        await login(codeEmail, codePass);
      } catch {
        await register(codeEmail, codePass, code);
      }
      router.push('/dashboard');
    } catch (err) {
      setCodeError(err instanceof Error ? err.message : 'כניסה נכשלה');
    } finally {
      setCodeLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Rocket className="w-6 h-6 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-[#e5e5e5]">Welcome back</h1>
          <p className="text-sm text-[#9ca3af] mt-1">Sign in to PostPilot</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-4 py-3 bg-[#111] border border-white/10 rounded-lg text-[#e5e5e5] placeholder-[#9ca3af]/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-3 bg-[#111] border border-white/10 rounded-lg text-[#e5e5e5] placeholder-[#9ca3af]/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            required
          />

          {error && <p className="text-sm text-[#ef4444] text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Access Code Section */}
        <div className="mt-6 pt-6 border-t border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <KeyRound className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-[#9ca3af]">קוד גישה</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={accessCode}
              onChange={(e) => { setAccessCode(e.target.value); setCodeError(''); }}
              placeholder="הזן קוד..."
              className="flex-1 px-4 py-3 bg-[#111] border border-white/10 rounded-lg text-[#e5e5e5] placeholder-[#9ca3af]/50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm text-center tracking-widest uppercase"
              dir="ltr"
            />
            <button
              type="button"
              onClick={handleAccessCode}
              disabled={codeLoading}
              className="px-5 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-600/50 text-white font-semibold rounded-lg transition-colors text-sm whitespace-nowrap flex items-center gap-1.5"
            >
              {codeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              כניסה
            </button>
          </div>
          {codeError && <p className="text-sm text-[#ef4444] text-center mt-2">{codeError}</p>}
        </div>

        <p className="text-sm text-[#9ca3af] text-center mt-6">
          No account? <a href="/register" className="text-blue-400 font-medium hover:text-blue-300">Create one</a>
        </p>
      </div>
    </div>
  );
}
