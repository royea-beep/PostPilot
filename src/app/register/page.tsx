'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@royea/shared-utils/auth-context';
import { Rocket, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, password, name, businessName || undefined);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Rocket className="w-6 h-6 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-[#e5e5e5]">Create account</h1>
          <p className="text-sm text-[#9ca3af] mt-1">Start managing social media for your clients</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="w-full px-4 py-3 bg-[#111] border border-white/10 rounded-lg text-[#e5e5e5] placeholder-[#9ca3af]/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" required />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full px-4 py-3 bg-[#111] border border-white/10 rounded-lg text-[#e5e5e5] placeholder-[#9ca3af]/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (8+ characters)" className="w-full px-4 py-3 bg-[#111] border border-white/10 rounded-lg text-[#e5e5e5] placeholder-[#9ca3af]/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" required minLength={8} />
          <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Agency / Business name (optional)" className="w-full px-4 py-3 bg-[#111] border border-white/10 rounded-lg text-[#e5e5e5] placeholder-[#9ca3af]/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />

          {error && <p className="text-sm text-[#ef4444] text-center">{error}</p>}

          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <p className="text-sm text-[#9ca3af] text-center mt-6">
          Already have an account? <a href="/login" className="text-blue-400 font-medium hover:text-blue-300">Sign in</a>
        </p>
      </div>
    </div>
  );
}
