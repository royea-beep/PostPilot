'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@royea/shared-utils/auth-context';
import { PlatformConnect } from '@/components/PlatformConnect';
import { VerificationStatus } from '@/components/VerificationStatus';
import { Rocket, ArrowLeft, Plug, ChevronDown } from 'lucide-react';

interface BrandOption {
  id: string;
  name: string;
}

function PlatformsContent() {
  const { user, loading, authFetch } = useAuth();
  const router = useRouter();

  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [loadingBrands, setLoadingBrands] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await authFetch('/api/brands');
        if (res.ok) {
          const data = await res.json();
          const mapped = data.map((b: { id: string; name: string }) => ({
            id: b.id,
            name: b.name,
          }));
          setBrands(mapped);
          if (mapped.length > 0 && !selectedBrandId) {
            setSelectedBrandId(mapped[0].id);
          }
        }
      } catch {
        // ignore
      }
      setLoadingBrands(false);
    })();
  }, [user, authFetch, selectedBrandId]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-[#111] border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-[#9ca3af] hover:text-[#e5e5e5] p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-blue-400" />
              <span className="font-bold text-[#e5e5e5]">PostPilot</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Plug className="w-5 h-5 text-blue-400" />
            <h1 className="text-2xl font-bold text-[#e5e5e5]">Platform Connections</h1>
          </div>
          <p className="text-[#9ca3af] text-sm">
            Connect your social media accounts to publish content directly from PostPilot.
          </p>
        </div>

        {/* Meta Verification Status */}
        <VerificationStatus />

        {/* Brand selector */}
        {loadingBrands ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : brands.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[#9ca3af] mb-4">Create a brand first to connect platforms.</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <>
            {brands.length > 1 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">
                  Select Brand
                </label>
                <div className="relative">
                  <select
                    value={selectedBrandId || ''}
                    onChange={(e) => setSelectedBrandId(e.target.value)}
                    className="w-full appearance-none bg-[#111] border border-white/10 rounded-lg px-4 py-3 pr-10 text-sm font-medium text-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
                </div>
              </div>
            )}

            {selectedBrandId && <PlatformConnect brandId={selectedBrandId} />}
          </>
        )}
      </main>
    </div>
  );
}

export default function PlatformsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PlatformsContent />
    </Suspense>
  );
}
