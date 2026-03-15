'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@royea/shared-utils/auth-context';
import {
  ArrowLeft, Copy, Check, ExternalLink, Trash2, Sparkles, Loader2,
  ImageIcon, Video, Calendar, Hash, Globe,
} from 'lucide-react';

interface StyleProfile {
  tone?: string | null;
  emojiStyle?: string | null;
  hashtagStyle?: string | null;
  captionLength?: string | null;
  analyzedPostCount: number;
  lastAnalyzedAt?: string | null;
  favoriteEmojis?: string | null;
  favoriteHashtags?: string | null;
}

interface PostRecord {
  id: string;
  caption: string;
  hashtags: string;
  format: string;
  platform: string;
  status: string;
  errorCode?: string | null;
  errorMessage?: string | null;
  platformPostId?: string | null;
  platformUrl?: string | null;
  retryCount?: number;
  publishedAt?: string | null;
  createdAt: string;
  media: { id: string; filename: string; mediaType: string };
}

interface MediaRecord {
  id: string;
  filename: string;
  mediaType: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

interface BrandDetail {
  id: string;
  name: string;
  description?: string;
  industry?: string;
  language: string;
  token: string;
  link: string;
  createdAt: string;
  socialConnections: Array<{ id: string; platform: string; accountName?: string; status: string }>;
  styleProfile?: StyleProfile | null;
  _count: { posts: number; mediaUploads: number; postDrafts: number };
  posts: PostRecord[];
  media: MediaRecord[];
}

type Tab = 'posts' | 'media' | 'style';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-500/10 transition-colors"
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      {copied ? 'Copied!' : 'Copy Client Link'}
    </button>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'bg-pink-500/10 text-pink-400',
  facebook: 'bg-blue-500/10 text-blue-400',
  tiktok: 'bg-white/10 text-white',
};

export default function BrandDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, loading: authLoading, authFetch } = useAuth();
  const router = useRouter();
  const [brand, setBrand] = useState<BrandDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('posts');
  const [analyzing, setAnalyzing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await authFetch(`/api/brands/${id}`);
        if (res.ok) setBrand(await res.json());
        else router.push('/dashboard');
      } catch { router.push('/dashboard'); }
      setLoading(false);
    })();
  }, [user, id, authFetch, router]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await authFetch(`/api/brands/${id}/analyze`, { method: 'POST' });
      if (res.ok && brand) {
        const profile = await res.json();
        setBrand({ ...brand, styleProfile: profile });
      }
    } catch { /* ignore */ }
    setAnalyzing(false);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this brand and all its data? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const res = await authFetch(`/api/brands/${id}`, { method: 'DELETE' });
      if (res.ok) router.push('/dashboard');
    } catch { /* ignore */ }
    setDeleting(false);
  };

  if (authLoading || loading || !user) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>;
  }

  if (!brand) return null;

  const sp = brand.styleProfile;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-[#111] border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-[#9ca3af] hover:text-[#e5e5e5] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Dashboard</span>
          </button>
          <div className="flex items-center gap-2">
            <CopyButton text={brand.link} />
            <a href={brand.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-[#9ca3af] hover:text-[#e5e5e5] px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
              <ExternalLink className="w-4 h-4" /> Open
            </a>
            <button onClick={handleDelete} disabled={deleting} className="flex items-center gap-1.5 text-sm text-[#ef4444] hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
              <Trash2 className="w-4 h-4" /> {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 animate-fade-in">
        {/* Brand Info */}
        <div className="bg-[#111] rounded-xl border border-white/10 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#e5e5e5]">{brand.name}</h1>
              <div className="flex items-center gap-3 mt-2 text-sm text-[#9ca3af]">
                {brand.industry && <span>{brand.industry}</span>}
                <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" />{brand.language === 'he' ? 'Hebrew' : 'English'}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Created {formatDate(brand.createdAt)}</span>
              </div>
            </div>
            <div className="flex gap-6 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-400">{brand._count?.posts ?? 0}</p>
                <p className="text-xs text-[#9ca3af]">Posts</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-400">{brand._count?.mediaUploads ?? 0}</p>
                <p className="text-xs text-[#9ca3af]">Media</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-400">{brand._count?.postDrafts ?? 0}</p>
                <p className="text-xs text-[#9ca3af]">Drafts</p>
              </div>
            </div>
          </div>

          {/* Connected platforms */}
          <div className="flex flex-wrap gap-2 mt-4">
            {brand.socialConnections.filter(c => c.status === 'ACTIVE' || c.status === 'CONNECTED').map((conn) => (
              <span key={conn.id} className={`text-xs font-medium px-3 py-1 rounded-full ${PLATFORM_COLORS[conn.platform] || 'bg-white/5 text-[#9ca3af]'}`}>
                {conn.accountName || conn.platform}
              </span>
            ))}
            {brand.socialConnections.filter(c => c.status === 'ACTIVE' || c.status === 'CONNECTED').length === 0 && (
              <span className="text-sm text-[#9ca3af]/50">העתק את הפוסט והדבק ישירות לפייסבוק, אינסטגרם או טיקטוק</span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-[#111] rounded-lg border border-white/10 p-1 w-fit">
          {(['posts', 'media', 'style'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === t ? 'bg-blue-600/20 text-blue-400' : 'text-[#9ca3af] hover:text-[#e5e5e5] hover:bg-white/5'
              }`}
            >
              {t === 'posts' ? 'Posts' : t === 'media' ? 'Media' : 'Style DNA'}
            </button>
          ))}
        </div>

        {/* Posts Tab */}
        {tab === 'posts' && (
          <div className="space-y-3">
            {brand.posts.length === 0 ? (
              <div className="bg-[#111] rounded-xl border border-white/10 p-12 text-center">
                <p className="text-[#9ca3af]/50">No posts published yet</p>
              </div>
            ) : (
              brand.posts.map((post) => {
                let hashtags: string[] = [];
                try { hashtags = JSON.parse(post.hashtags); } catch { /* ignore */ }
                const statusColor = post.status === 'SUCCESS' || post.status === 'PUBLISHED'
                  ? 'bg-[#22c55e]/10 text-[#22c55e]'
                  : post.status === 'FAILED'
                  ? 'bg-[#ef4444]/10 text-[#ef4444]'
                  : post.status === 'PROCESSING'
                  ? 'bg-blue-500/10 text-blue-400'
                  : 'bg-[#f59e0b]/10 text-[#f59e0b]';
                return (
                  <div key={post.id} className={`bg-[#111] rounded-xl border p-4 ${post.status === 'FAILED' ? 'border-[#ef4444]/30' : 'border-white/10'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PLATFORM_COLORS[post.platform] || 'bg-white/5 text-[#9ca3af]'}`}>
                          {post.platform}
                        </span>
                        <span className="text-xs text-[#9ca3af]/60">{post.format}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor}`}>
                          {post.status.toLowerCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {post.platformUrl && (
                          <a href={post.platformUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" /> View
                          </a>
                        )}
                        <span className="text-xs text-[#9ca3af]/50">
                          {post.publishedAt ? formatDate(post.publishedAt) : formatDate(post.createdAt)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-[#e5e5e5]/80 leading-relaxed mb-2">{post.caption}</p>
                    {post.status === 'FAILED' && post.errorMessage && (
                      <div className="bg-[#ef4444]/10 rounded-lg p-2 mb-2 text-xs text-[#ef4444]">
                        <span className="font-medium">{post.errorCode || 'Error'}:</span> {post.errorMessage}
                        {(post.retryCount ?? 0) > 0 && <span className="text-[#ef4444]/60 ml-2">({post.retryCount} retries)</span>}
                      </div>
                    )}
                    {hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {hashtags.map((tag, i) => (
                          <span key={i} className="text-xs text-blue-400/70">#{tag}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-[#9ca3af]/50">
                      {post.media.mediaType === 'video' ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                      {post.media.filename}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Media Tab */}
        {tab === 'media' && (
          <div className="space-y-3">
            {brand.media.length === 0 ? (
              <div className="bg-[#111] rounded-xl border border-white/10 p-12 text-center">
                <p className="text-[#9ca3af]/50">No media uploaded yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {brand.media.map((m) => (
                  <div key={m.id} className="bg-[#111] rounded-xl border border-white/10 p-3">
                    <div className="w-full aspect-square bg-[#0a0a0a] rounded-lg flex items-center justify-center mb-2">
                      {m.mediaType === 'video' ? (
                        <Video className="w-8 h-8 text-[#9ca3af]/30" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`/api/media/${m.id}`} alt={m.filename} className="w-full h-full object-cover rounded-lg" />
                      )}
                    </div>
                    <p className="text-xs text-[#e5e5e5]/70 truncate">{m.filename}</p>
                    <p className="text-xs text-[#9ca3af]/50">{formatBytes(m.sizeBytes)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Style DNA Tab */}
        {tab === 'style' && (
          <div className="bg-[#111] rounded-xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-[#e5e5e5] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-400" /> Style DNA
                </h2>
                {sp?.lastAnalyzedAt && (
                  <p className="text-xs text-[#9ca3af]/60 mt-1">Last analyzed {formatDate(sp.lastAnalyzedAt)} ({sp.analyzedPostCount} posts)</p>
                )}
              </div>
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white text-sm font-medium transition-colors"
              >
                {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {analyzing ? 'Analyzing...' : 'Analyze Now'}
              </button>
            </div>

            {!sp || sp.analyzedPostCount === 0 ? (
              <div className="text-center py-8">
                <p className="text-[#9ca3af]/50 mb-2">No style data yet</p>
                <p className="text-sm text-[#9ca3af]">Publish posts first, then analyze to learn the brand&apos;s voice.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-[#0a0a0a] rounded-lg p-4 border border-white/5">
                  <p className="text-xs text-[#9ca3af] mb-1">Tone</p>
                  <p className="font-semibold text-[#e5e5e5] capitalize">{sp.tone || '—'}</p>
                </div>
                <div className="bg-[#0a0a0a] rounded-lg p-4 border border-white/5">
                  <p className="text-xs text-[#9ca3af] mb-1">Emoji Usage</p>
                  <p className="font-semibold text-[#e5e5e5] capitalize">{sp.emojiStyle || '—'}</p>
                </div>
                <div className="bg-[#0a0a0a] rounded-lg p-4 border border-white/5">
                  <p className="text-xs text-[#9ca3af] mb-1">Hashtag Style</p>
                  <p className="font-semibold text-[#e5e5e5] capitalize">{sp.hashtagStyle || '—'}</p>
                </div>
                <div className="bg-[#0a0a0a] rounded-lg p-4 border border-white/5">
                  <p className="text-xs text-[#9ca3af] mb-1">Caption Length</p>
                  <p className="font-semibold text-[#e5e5e5] capitalize">{sp.captionLength || '—'}</p>
                </div>

                {sp.favoriteEmojis && (() => {
                  try {
                    const emojis = JSON.parse(sp.favoriteEmojis) as string[];
                    if (emojis.length === 0) return null;
                    return (
                      <div className="bg-[#0a0a0a] rounded-lg p-4 col-span-2 border border-white/5">
                        <p className="text-xs text-[#9ca3af] mb-1">Favorite Emojis</p>
                        <p className="text-2xl">{emojis.join(' ')}</p>
                      </div>
                    );
                  } catch { return null; }
                })()}

                {sp.favoriteHashtags && (() => {
                  try {
                    const tags = JSON.parse(sp.favoriteHashtags) as string[];
                    if (tags.length === 0) return null;
                    return (
                      <div className="bg-[#0a0a0a] rounded-lg p-4 col-span-2 border border-white/5">
                        <p className="text-xs text-[#9ca3af] mb-2">Top Hashtags</p>
                        <div className="flex flex-wrap gap-1.5">
                          {tags.map((tag, i) => (
                            <span key={i} className="flex items-center gap-0.5 text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded-full">
                              <Hash className="w-3 h-3" />{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  } catch { return null; }
                })()}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
