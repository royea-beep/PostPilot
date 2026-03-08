'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@royea/shared-utils/auth-context';
import { PlatformConnect } from '@/components/PlatformConnect';
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-violet-600" />
              <span className="font-bold text-gray-900">PostPilot</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Plug className="w-5 h-5 text-violet-600" />
            <h1 className="text-2xl font-bold text-gray-900">Platform Connections</h1>
          </div>
          <p className="text-gray-500 text-sm">
            Connect your social media accounts to publish content directly from PostPilot.
          </p>
        </div>

        {/* Brand selector */}
        {loadingBrands ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : brands.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-4">Create a brand first to connect platforms.</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-medium px-6 py-3 rounded-xl transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <>
            {brands.length > 1 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Select Brand
                </label>
                <div className="relative">
                  <select
                    value={selectedBrandId || ''}
                    onChange={(e) => setSelectedBrandId(e.target.value)}
                    className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
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
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PlatformsContent />
    </Suspense>
  );
}
