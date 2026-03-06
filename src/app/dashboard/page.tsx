'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Rocket, Plus, Copy, Check, ExternalLink, LogOut, Users, ImageIcon, BarChart3, Sparkles } from 'lucide-react';

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
  instagram: 'bg-pink-100 text-pink-700',
  facebook: 'bg-blue-100 text-blue-700',
  tiktok: 'bg-gray-900 text-white',
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium px-2 py-1 rounded hover:bg-violet-50 transition-colors"
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

  const createBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
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
      }
    } catch { /* ignore */ }
    setCreating(false);
  };

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-violet-600" />
            <span className="font-bold text-gray-900">PostPilot</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              <Plus className="w-4 h-4" /> New Brand
            </button>
            <span className="text-sm text-gray-500 hidden sm:inline">{user.name}</span>
            <button onClick={() => { logout(); router.push('/login'); }} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100" title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 animate-fade-in">
        {/* Create Brand Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-bold text-gray-900 mb-4">New Brand</h2>
              <form onSubmit={createBrand} className="space-y-3">
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Brand / Client name" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" required autoFocus />
                <input type="text" value={newIndustry} onChange={(e) => setNewIndustry(e.target.value)} placeholder="Industry (optional)" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors">Cancel</button>
                  <button type="submit" disabled={creating} className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium transition-colors">{creating ? 'Creating...' : 'Create'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Stats Bar */}
        {stats && stats.totalBrands > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-violet-600">{stats.totalBrands}</p>
              <p className="text-xs text-gray-500 mt-1">Brands</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-violet-600">{stats.totalPosts}</p>
              <p className="text-xs text-gray-500 mt-1">Posts Published</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-violet-600">{stats.totalMedia}</p>
              <p className="text-xs text-gray-500 mt-1">Media Uploads</p>
            </div>
          </div>
        )}

        {loadingBrands ? (
          <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : brands.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No brands yet</h2>
            <p className="text-gray-500 mb-6">Create a brand for your client and send them the link.</p>
            <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-medium px-6 py-3 rounded-xl transition-colors">
              <Plus className="w-5 h-5" /> New Brand
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {brands.map((brand) => (
              <div key={brand.id} onClick={() => router.push(`/dashboard/${brand.id}`)} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow animate-slide-up cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{brand.name}</h3>
                    {brand.industry && <p className="text-xs text-gray-400 mt-0.5">{brand.industry}</p>}
                  </div>
                  {brand.styleProfile && brand.styleProfile.analyzedPostCount > 0 ? (
                    <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                      <Sparkles className="w-3 h-3" /> Style Learned
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">No Style Yet</span>
                  )}
                </div>

                {/* Connected platforms */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {brand.socialConnections.filter(c => c.status === 'CONNECTED').map((conn) => (
                    <span key={conn.id} className={`text-xs font-medium px-2 py-0.5 rounded-full ${PLATFORM_COLORS[conn.platform] || 'bg-gray-100 text-gray-600'}`}>
                      {conn.accountName || conn.platform}
                    </span>
                  ))}
                  {brand.socialConnections.filter(c => c.status === 'CONNECTED').length === 0 && (
                    <span className="text-xs text-gray-400">No accounts connected</span>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                  <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3" />{brand._count.mediaUploads} media</span>
                  <span>{brand._count.posts} posts</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <CopyButton text={brand.link} />
                  <a href={brand.link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-50 transition-colors">
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
