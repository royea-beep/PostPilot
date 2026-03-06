'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
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
      className="flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-700 font-medium px-3 py-1.5 rounded-lg hover:bg-violet-50 transition-colors"
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
  instagram: 'bg-pink-100 text-pink-700',
  facebook: 'bg-blue-100 text-blue-700',
  tiktok: 'bg-gray-900 text-white',
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
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-violet-600" /></div>;
  }

  if (!brand) return null;

  const sp = brand.styleProfile;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Dashboard</span>
          </button>
          <div className="flex items-center gap-2">
            <CopyButton text={brand.link} />
            <a href={brand.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
              <ExternalLink className="w-4 h-4" /> Open
            </a>
            <button onClick={handleDelete} disabled={deleting} className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
              <Trash2 className="w-4 h-4" /> {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 animate-fade-in">
        {/* Brand Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{brand.name}</h1>
              <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                {brand.industry && <span>{brand.industry}</span>}
                <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" />{brand.language === 'he' ? 'Hebrew' : 'English'}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Created {formatDate(brand.createdAt)}</span>
              </div>
            </div>
            <div className="flex gap-6 text-center">
              <div>
                <p className="text-2xl font-bold text-violet-600">{brand._count.posts}</p>
                <p className="text-xs text-gray-500">Posts</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-violet-600">{brand._count.mediaUploads}</p>
                <p className="text-xs text-gray-500">Media</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-violet-600">{brand._count.postDrafts}</p>
                <p className="text-xs text-gray-500">Drafts</p>
              </div>
            </div>
          </div>

          {/* Connected platforms */}
          <div className="flex flex-wrap gap-2 mt-4">
            {brand.socialConnections.filter(c => c.status === 'CONNECTED').map((conn) => (
              <span key={conn.id} className={`text-xs font-medium px-3 py-1 rounded-full ${PLATFORM_COLORS[conn.platform] || 'bg-gray-100 text-gray-600'}`}>
                {conn.accountName || conn.platform}
              </span>
            ))}
            {brand.socialConnections.filter(c => c.status === 'CONNECTED').length === 0 && (
              <span className="text-sm text-gray-400">No social accounts connected yet</span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-white rounded-lg border border-gray-200 p-1 w-fit">
          {(['posts', 'media', 'style'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === t ? 'bg-violet-100 text-violet-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
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
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <p className="text-gray-400">No posts published yet</p>
              </div>
            ) : (
              brand.posts.map((post) => {
                let hashtags: string[] = [];
                try { hashtags = JSON.parse(post.hashtags); } catch { /* ignore */ }
                return (
                  <div key={post.id} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PLATFORM_COLORS[post.platform] || 'bg-gray-100 text-gray-600'}`}>
                          {post.platform}
                        </span>
                        <span className="text-xs text-gray-400">{post.format}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          post.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {post.status.toLowerCase()}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {post.publishedAt ? formatDate(post.publishedAt) : formatDate(post.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed mb-2">{post.caption}</p>
                    {hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {hashtags.map((tag, i) => (
                          <span key={i} className="text-xs text-violet-500">#{tag}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
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
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <p className="text-gray-400">No media uploaded yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {brand.media.map((m) => (
                  <div key={m.id} className="bg-white rounded-xl border border-gray-200 p-3">
                    <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                      {m.mediaType === 'video' ? (
                        <Video className="w-8 h-8 text-gray-400" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`/api/media/${m.id}`} alt={m.filename} className="w-full h-full object-cover rounded-lg" />
                      )}
                    </div>
                    <p className="text-xs text-gray-700 truncate">{m.filename}</p>
                    <p className="text-xs text-gray-400">{formatBytes(m.sizeBytes)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Style DNA Tab */}
        {tab === 'style' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-violet-600" /> Style DNA
                </h2>
                {sp?.lastAnalyzedAt && (
                  <p className="text-xs text-gray-400 mt-1">Last analyzed {formatDate(sp.lastAnalyzedAt)} ({sp.analyzedPostCount} posts)</p>
                )}
              </div>
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white text-sm font-medium transition-colors"
              >
                {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {analyzing ? 'Analyzing...' : 'Analyze Now'}
              </button>
            </div>

            {!sp || sp.analyzedPostCount === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-2">No style data yet</p>
                <p className="text-sm text-gray-500">Publish posts first, then analyze to learn the brand&apos;s voice.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Tone</p>
                  <p className="font-semibold text-gray-900 capitalize">{sp.tone || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Emoji Usage</p>
                  <p className="font-semibold text-gray-900 capitalize">{sp.emojiStyle || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Hashtag Style</p>
                  <p className="font-semibold text-gray-900 capitalize">{sp.hashtagStyle || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Caption Length</p>
                  <p className="font-semibold text-gray-900 capitalize">{sp.captionLength || '—'}</p>
                </div>

                {sp.favoriteEmojis && (() => {
                  try {
                    const emojis = JSON.parse(sp.favoriteEmojis) as string[];
                    if (emojis.length === 0) return null;
                    return (
                      <div className="bg-gray-50 rounded-lg p-4 col-span-2">
                        <p className="text-xs text-gray-500 mb-1">Favorite Emojis</p>
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
                      <div className="bg-gray-50 rounded-lg p-4 col-span-2">
                        <p className="text-xs text-gray-500 mb-2">Top Hashtags</p>
                        <div className="flex flex-wrap gap-1.5">
                          {tags.map((tag, i) => (
                            <span key={i} className="flex items-center gap-0.5 text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded-full">
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
