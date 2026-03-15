'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@royea/shared-utils/auth-context';
import { Rocket, Plus, Copy, Check, ExternalLink, LogOut, Users, ImageIcon, BarChart3, Sparkles, CreditCard, FlaskConical } from 'lucide-react';

interface Brand {
  id: string;
  name: string;
  description?: string;
  industry?: string;
  language: string;
  token: string;
  link: string;
  createdAt: string;
  socialConnections: Array<{ id: string; platform: string; accountName: string; status: string }>;
  styleProfile?: { analyzedPostCount: number } | null;
  _count: { posts: number; mediaUploads: number };
}

interface Stats {
  totalBrands: number;
  totalPosts: number;
  totalMedia: number;
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'bg-pink-500/10 text-pink-400',
  facebook: 'bg-blue-500/10 text-blue-400',
  tiktok: 'bg-white/10 text-white',
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium px-2 py-1 rounded hover:bg-blue-500/10 transition-colors"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied!' : 'Copy Link'}
    </button>
  );
}

export default function DashboardPage() {
  const { user, loading, logout, authFetch } = useAuth();
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIndustry, setNewIndustry] = useState('');
  const [creating, setCreating] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  // Load demo mode from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDemoMode(localStorage.getItem('postpilot_demo_mode') === 'true');
    }
  }, []);

  const toggleDemoMode = () => {
    const next = !demoMode;
    setDemoMode(next);
    localStorage.setItem('postpilot_demo_mode', String(next));
  };

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [brandsRes, statsRes] = await Promise.all([
          authFetch('/api/brands'),
          authFetch('/api/stats'),
        ]);
        if (brandsRes.ok) setBrands(await brandsRes.json());
        if (statsRes.ok) setStats(await statsRes.json());
      } catch { /* ignore */ }
      setLoadingBrands(false);
    })();
  }, [user, authFetch]);

  const [createError, setCreateError] = useState<string | null>(null);

  const createBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      const res = await authFetch('/api/brands', {
        method: 'POST',
        body: JSON.stringify({ name: newName, industry: newIndustry || undefined }),
      });
      if (res.ok) {
        const brand = await res.json();
        setBrands([brand, ...brands]);
        setShowCreate(false);
        setNewName('');
        setNewIndustry('');
        setCreateError(null);
      } else {
        const data = await res.json().catch(() => ({ error: 'Failed to create brand' }));
        if (data.code === 'LIMIT_REACHED') {
          setCreateError(`${data.error} You have ${brands.length} brands on the Free plan (limit: 2).`);
        } else {
          setCreateError(data.error || 'Failed to create brand');
        }
      }
    } catch { setCreateError('Network error — please try again'); }
    setCreating(false);
  };

  if (loading || !user) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="bg-[#111] border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-[#e5e5e5]">PostPilot</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              <Plus className="w-4 h-4" /> New Brand
            </button>
            <a href="/billing" className="text-[#9ca3af] hover:text-[#e5e5e5] p-1.5 rounded-lg hover:bg-white/5" title="Billing">
              <CreditCard className="w-4 h-4" />
            </a>
            <span className="text-sm text-[#9ca3af] hidden sm:inline">{user.name}</span>
            <button onClick={() => { logout(); router.push('/login'); }} className="text-[#9ca3af] hover:text-[#e5e5e5] p-1.5 rounded-lg hover:bg-white/5" title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 animate-fade-in">
        {/* Demo Mode Toggle */}
        <div className={`mb-4 rounded-xl border p-3 flex items-center justify-between transition-colors ${
          demoMode ? 'bg-[#f59e0b]/10 border-[#f59e0b]/30' : 'bg-[#111] border-white/10'
        }`}>
          <div className="flex items-center gap-2">
            <FlaskConical className={`w-4 h-4 ${demoMode ? 'text-[#f59e0b]' : 'text-[#9ca3af]'}`} />
            <div>
              <span className={`text-sm font-medium ${demoMode ? 'text-[#f59e0b]' : 'text-[#9ca3af]'}`}>
                Demo Mode
              </span>
              <p className="text-xs text-[#9ca3af]/60">
                {demoMode
                  ? 'Active — API calls return mock responses with fake engagement'
                  : 'Off — Enable to test publishing without Meta verification'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleDemoMode}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              demoMode ? 'bg-[#f59e0b]' : 'bg-white/20'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                demoMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Demo Mode Banner with Mock Stats */}
        {demoMode && (
          <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-xl p-4 mb-4">
            <h3 className="text-sm font-semibold text-[#f59e0b] mb-3 flex items-center gap-1.5">
              <FlaskConical className="w-4 h-4" /> Demo Published Posts
            </h3>
            <div className="space-y-2">
              {[
                { platform: 'Instagram', status: 'Published', likes: 142, comments: 23, time: '2 hours ago' },
                { platform: 'Facebook', status: 'Published', likes: 87, comments: 12, time: '3 hours ago' },
                { platform: 'Instagram', status: 'Published', likes: 256, comments: 41, time: '1 day ago' },
              ].map((post, i) => (
                <div key={i} className="flex items-center justify-between bg-[#0a0a0a] rounded-lg p-3 border border-white/5">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      post.platform === 'Instagram' ? 'bg-pink-500/10 text-pink-400' : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      {post.platform}
                    </span>
                    <span className="text-xs text-[#22c55e] font-medium">{post.status}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[#9ca3af]">
                    <span>{post.likes} likes</span>
                    <span>{post.comments} comments</span>
                    <span>{post.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#f59e0b]/70 mt-2 text-center">These are mock posts for demonstration purposes</p>
          </div>
        )}

        {/* Create Brand Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-bold text-[#e5e5e5] mb-4">New Brand</h2>
              <form onSubmit={createBrand} className="space-y-3">
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Brand / Client name" className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-[#e5e5e5] placeholder-[#9ca3af]/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" required autoFocus />
                <input type="text" value={newIndustry} onChange={(e) => setNewIndustry(e.target.value)} placeholder="Industry (optional)" className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-[#e5e5e5] placeholder-[#9ca3af]/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                {createError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <p className="text-sm text-red-400">{createError}</p>
                    {createError.includes('Upgrade') && (
                      <a href="/billing" className="inline-block mt-2 text-xs font-medium text-blue-400 hover:text-blue-300 underline">
                        View plans &rarr;
                      </a>
                    )}
                  </div>
                )}
                <div className="flex gap-3">
                  <button type="button" onClick={() => { setShowCreate(false); setCreateError(null); }} className="flex-1 py-3 rounded-lg border border-white/10 text-[#9ca3af] font-medium hover:bg-white/5 transition-colors">Cancel</button>
                  <button type="submit" disabled={creating} className="flex-1 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">{creating ? 'Creating...' : 'Create'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Stats Bar */}
        {stats && stats.totalBrands > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-[#111] rounded-xl border border-white/10 p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">{stats.totalBrands}</p>
              <p className="text-xs text-[#9ca3af] mt-1">Brands</p>
            </div>
            <div className="bg-[#111] rounded-xl border border-white/10 p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">{stats.totalPosts}</p>
              <p className="text-xs text-[#9ca3af] mt-1">Posts Published</p>
            </div>
            <div className="bg-[#111] rounded-xl border border-white/10 p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">{stats.totalMedia}</p>
              <p className="text-xs text-[#9ca3af] mt-1">Media Uploads</p>
            </div>
          </div>
        )}

        {loadingBrands ? (
          <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : brands.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-[#9ca3af]/30 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-[#e5e5e5] mb-2">No brands yet</h2>
            <p className="text-[#9ca3af] mb-6">Create a brand for your client and send them the link.</p>
            <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors">
              <Plus className="w-5 h-5" /> New Brand
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {brands.map((brand) => (
              <div key={brand.id} onClick={() => router.push(`/dashboard/${brand.id}`)} className="bg-[#111] rounded-xl border border-white/10 p-5 hover:border-white/20 transition-all animate-slide-up cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-[#e5e5e5]">{brand.name}</h3>
                    {brand.industry && <p className="text-xs text-[#9ca3af]/60 mt-0.5">{brand.industry}</p>}
                  </div>
                  {brand.styleProfile && brand.styleProfile.analyzedPostCount > 0 ? (
                    <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-[#22c55e]/10 text-[#22c55e]">
                      <Sparkles className="w-3 h-3" /> Style Learned
                    </span>
                  ) : (
                    <span className="text-xs text-[#9ca3af]/50">No Style Yet</span>
                  )}
                </div>

                {/* Connected platforms */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {brand.socialConnections.filter(c => c.status === 'CONNECTED' || c.status === 'ACTIVE').map((conn) => (
                    <span key={conn.id} className={`text-xs font-medium px-2 py-0.5 rounded-full ${PLATFORM_COLORS[conn.platform] || 'bg-white/5 text-[#9ca3af]'}`}>
                      {conn.accountName || conn.platform}
                    </span>
                  ))}
                  {brand.socialConnections.filter(c => c.status === 'CONNECTED' || c.status === 'ACTIVE').length === 0 && (
                    <span className="text-xs text-[#9ca3af]/50">No accounts connected</span>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-[#9ca3af]/60 mb-3">
                  <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3" />{brand._count?.mediaUploads ?? 0} media</span>
                  <span>{brand._count?.posts ?? 0} posts</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <CopyButton text={brand.link} />
                  <a href={brand.link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-xs text-[#9ca3af] hover:text-[#e5e5e5] px-2 py-1 rounded hover:bg-white/5 transition-colors">
                    <ExternalLink className="w-3 h-3" /> Preview
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
