'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@royea/shared-utils/auth-context';
import { Rocket, ArrowLeft, BarChart3, TrendingUp, Clock, Wifi, Users, Layers, CheckCircle, XCircle } from 'lucide-react';

interface AnalyticsData {
  totalPosts: number;
  thisMonth: number;
  brandsCount: number;
  platformsConnected: number;
  successRate: { rate: number; succeeded: number; total: number };
  platformBreakdown: Array<{ platform: string; count: number }>;
  weeklyPosts: Array<{ date: string; day: string; count: number }>;
  scheduled: Array<{
    id: string;
    caption: string;
    platform: string;
    scheduledFor: string;
    brandName: string;
  }>;
  statusBreakdown: Array<{ status: string; count: number }>;
}

const PLATFORM_STYLES: Record<string, { bg: string; bar: string; label: string }> = {
  instagram: { bg: 'bg-pink-500/10', bar: 'bg-gradient-to-r from-pink-500 to-purple-500', label: 'Instagram' },
  facebook: { bg: 'bg-blue-500/10', bar: 'bg-gradient-to-r from-blue-500 to-blue-600', label: 'Facebook' },
  tiktok: { bg: 'bg-white/10', bar: 'bg-gradient-to-r from-gray-300 to-white', label: 'TikTok' },
};

const STATUS_COLORS: Record<string, string> = {
  SUCCESS: 'text-[#22c55e]',
  FAILED: 'text-[#ef4444]',
  QUEUED: 'text-blue-400',
  PROCESSING: 'text-[#f59e0b]',
};

export default function AnalyticsPage() {
  const { user, loading, authFetch } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await authFetch('/api/analytics');
        if (res.ok) {
          setData(await res.json());
        } else {
          setError('Failed to load analytics');
        }
      } catch {
        setError('Network error');
      }
      setFetching(false);
    })();
  }, [user, authFetch]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const maxWeekly = data ? Math.max(...data.weeklyPosts.map((d) => d.count), 1) : 1;
  const totalPlatformPosts = data ? data.platformBreakdown.reduce((s, p) => s + p.count, 0) : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-[#111] border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-[#9ca3af] hover:text-[#e5e5e5] p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-blue-400" />
              <span className="font-bold text-[#e5e5e5]">PostPilot</span>
            </div>
            <span className="text-[#9ca3af]/50 text-sm">/</span>
            <div className="flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-[#e5e5e5]">Analytics</span>
            </div>
          </div>
          <span className="text-sm text-[#9ca3af] hidden sm:inline">{user.name}</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 animate-fade-in">
        {fetching ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-[#ef4444]">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-4 text-sm text-blue-400 hover:text-blue-300">
              Retry
            </button>
          </div>
        ) : data ? (
          <>
            {/* Quick Stats — Top Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <StatCard icon={<Layers className="w-5 h-5 text-blue-400" />} value={data.totalPosts} label="Total Posts" />
              <StatCard icon={<TrendingUp className="w-5 h-5 text-[#22c55e]" />} value={data.thisMonth} label="This Month" />
              <StatCard icon={<Users className="w-5 h-5 text-purple-400" />} value={data.brandsCount} label="Brands" />
              <StatCard icon={<Wifi className="w-5 h-5 text-pink-400" />} value={data.platformsConnected} label="Platforms" />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Posts This Week — Bar Chart */}
              <div className="bg-[#111] rounded-xl border border-white/10 p-5">
                <h3 className="text-sm font-semibold text-[#e5e5e5] mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-400" /> Posts This Week
                </h3>
                <div className="flex items-end gap-2 h-40">
                  {data.weeklyPosts.map((d) => (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs text-[#9ca3af] tabular-nums">{d.count}</span>
                      <div className="w-full relative rounded-t-md overflow-hidden bg-white/5" style={{ height: '120px' }}>
                        <div
                          className="absolute bottom-0 w-full rounded-t-md bg-gradient-to-t from-blue-600 to-blue-400 transition-all duration-500"
                          style={{ height: `${(d.count / maxWeekly) * 100}%`, minHeight: d.count > 0 ? '4px' : '0px' }}
                        />
                      </div>
                      <span className="text-[10px] text-[#9ca3af]/60 font-medium">{d.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Platform Breakdown */}
              <div className="bg-[#111] rounded-xl border border-white/10 p-5">
                <h3 className="text-sm font-semibold text-[#e5e5e5] mb-4 flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-pink-400" /> Platform Breakdown
                </h3>
                {data.platformBreakdown.length === 0 ? (
                  <p className="text-sm text-[#9ca3af]/50 text-center py-8">No posts yet</p>
                ) : (
                  <div className="space-y-4">
                    {data.platformBreakdown.map((p) => {
                      const style = PLATFORM_STYLES[p.platform] || { bg: 'bg-white/5', bar: 'bg-gray-500', label: p.platform };
                      const pct = totalPlatformPosts > 0 ? Math.round((p.count / totalPlatformPosts) * 100) : 0;
                      return (
                        <div key={p.platform}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-medium text-[#e5e5e5]">{style.label}</span>
                            <span className="text-xs text-[#9ca3af] tabular-nums">{p.count} posts ({pct}%)</span>
                          </div>
                          <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${style.bar} transition-all duration-500`}
                              style={{ width: `${pct}%`, minWidth: p.count > 0 ? '8px' : '0px' }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Success Rate */}
              <div className="bg-[#111] rounded-xl border border-white/10 p-5">
                <h3 className="text-sm font-semibold text-[#e5e5e5] mb-4 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#22c55e]" /> Success Rate
                </h3>
                <div className="text-center py-4">
                  <p className={`text-5xl font-bold tabular-nums ${
                    data.successRate.rate >= 90 ? 'text-[#22c55e]' : data.successRate.rate >= 70 ? 'text-[#f59e0b]' : 'text-[#ef4444]'
                  }`}>
                    {data.successRate.total > 0 ? `${data.successRate.rate}%` : '--'}
                  </p>
                  <p className="text-sm text-[#9ca3af] mt-2">
                    {data.successRate.total > 0
                      ? `${data.successRate.succeeded}/${data.successRate.total} posts published successfully`
                      : 'No completed posts yet'}
                  </p>
                </div>
                {/* Status chips */}
                {data.statusBreakdown.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 justify-center">
                    {data.statusBreakdown.map((s) => (
                      <span
                        key={s.status}
                        className={`text-xs font-medium px-2.5 py-1 rounded-full bg-white/5 ${STATUS_COLORS[s.status] || 'text-[#9ca3af]'}`}
                      >
                        {s.status}: {s.count}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Scheduled Queue */}
              <div className="bg-[#111] rounded-xl border border-white/10 p-5">
                <h3 className="text-sm font-semibold text-[#e5e5e5] mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#f59e0b]" /> Scheduled Queue
                </h3>
                {data.scheduled.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-8 h-8 text-[#9ca3af]/20 mx-auto mb-2" />
                    <p className="text-sm text-[#9ca3af]/50">No scheduled posts</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.scheduled.map((s) => {
                      const style = PLATFORM_STYLES[s.platform] || { bg: 'bg-white/5', bar: '', label: s.platform };
                      const time = new Date(s.scheduledFor).toLocaleString('en-IL', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      return (
                        <div key={s.id} className="bg-[#0a0a0a] rounded-lg p-3 border border-white/5">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${style.bg} ${
                              s.platform === 'instagram' ? 'text-pink-400' : s.platform === 'facebook' ? 'text-blue-400' : 'text-white'
                            }`}>
                              {style.label}
                            </span>
                            <span className="text-xs text-[#9ca3af]/60">{time}</span>
                          </div>
                          <p className="text-xs text-[#9ca3af] leading-relaxed">{s.caption}</p>
                          <p className="text-[10px] text-[#9ca3af]/40 mt-1">{s.brandName}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="bg-[#111] rounded-xl border border-white/10 p-4 flex flex-col items-center text-center">
      {icon}
      <p className="text-2xl font-bold text-[#e5e5e5] mt-2 tabular-nums">{value}</p>
      <p className="text-xs text-[#9ca3af] mt-1">{label}</p>
    </div>
  );
}
