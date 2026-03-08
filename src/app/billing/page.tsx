'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@royea/shared-utils/auth-context';
import { useRouter } from 'next/navigation';
import { Shield, Check, Zap, Crown, ArrowLeft, Loader2 } from 'lucide-react';

interface BillingData {
  plan: string;
  subscriptionStatus: string;
  postsThisMonth: number;
  brandsCount: number;
  currentPeriodEnd: string | null;
  limits: {
    brandsLimit: number;
    postsPerMonth: number;
    price: number;
  };
}

const PLAN_ICONS: Record<string, typeof Shield> = { FREE: Shield, PRO: Zap, AGENCY: Crown };

type PlanDisplay = { key: string; name: string; price: number; features: string[]; popular?: boolean };

export default function BillingPage() {
  const { user, authFetch, loading: authLoading } = useAuth();
  const router = useRouter();
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [plans, setPlans] = useState<PlanDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      Promise.all([
        authFetch('/api/billing').then((r) => (r.ok ? r.json() : null)).then(setBilling).catch(() => {}),
        fetch('/api/billing/plans').then((r) => (r.ok ? r.json() : [])).then(setPlans).catch(() => setPlans([])),
      ]).finally(() => setLoading(false));
    } else setLoading(false);
  }, [user, authLoading]);

  const fetchBilling = async () => {
    try {
      const res = await authFetch('/api/billing');
      if (res.ok) setBilling(await res.json());
    } catch {}
    setLoading(false);
  };

  const handleCheckout = async (plan: string) => {
    setCheckoutLoading(plan);
    try {
      const res = await authFetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to start checkout');
      }
    } catch {
      alert('Failed to start checkout');
    }
    setCheckoutLoading(null);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentPlan = billing?.plan || 'FREE';
  const postsUsed = billing?.postsThisMonth || 0;
  const postsLimit = billing?.limits?.postsPerMonth || 10;
  const usagePercent = postsLimit > 0 ? Math.min((postsUsed / postsLimit) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-4">
          <a href="/dashboard" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </a>
          <Shield className="w-5 h-5 text-violet-600" />
          <span className="font-bold text-gray-900">Billing</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Usage */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Usage</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-gray-500 mb-1">Posts this month</div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">{postsUsed}</span>
                <span className="text-gray-500">/ {postsLimit > 0 ? postsLimit : '\u221E'}</span>
              </div>
              {postsLimit > 0 && (
                <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full transition-all ${usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 70 ? 'bg-amber-500' : 'bg-violet-500'}`}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
              )}
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Active brands</div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">{billing?.brandsCount || 0}</span>
                <span className="text-gray-500">/ {billing?.limits?.brandsLimit && billing.limits.brandsLimit > 0 ? billing.limits.brandsLimit : '\u221E'}</span>
              </div>
            </div>
          </div>
          {billing?.currentPeriodEnd && (
            <p className="text-xs text-gray-400 mt-4">
              Renews {new Date(billing.currentPeriodEnd).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Plans (fetched from /api/billing/plans — SecretSauce: no client-side pricing) */}
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose Your Plan</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {(plans.length ? plans : [{ key: 'FREE', name: 'Free', price: 0, features: [] }, { key: 'PRO', name: 'Pro', price: 29, popular: true, features: [] }, { key: 'AGENCY', name: 'Agency', price: 79, features: [] }]).map((plan) => {
            const isCurrent = plan.key === currentPlan;
            const Icon = PLAN_ICONS[plan.key] ?? Shield;

            return (
              <div
                key={plan.key}
                className={`relative bg-white rounded-xl border-2 p-6 transition-shadow ${
                  plan.popular ? 'border-violet-500 shadow-lg' : isCurrent ? 'border-green-500' : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}

                <div className="flex items-center gap-2 mb-4">
                  <Icon className={`w-5 h-5 ${plan.popular ? 'text-violet-600' : 'text-gray-400'}`} />
                  <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                </div>

                <div className="mb-6">
                  <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                  {plan.price > 0 && <span className="text-gray-500">/mo</span>}
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-lg text-sm font-medium bg-green-50 text-green-700 border border-green-200"
                  >
                    Current Plan
                  </button>
                ) : plan.key === 'FREE' ? (
                  <div />
                ) : (
                  <button
                    onClick={() => handleCheckout(plan.key)}
                    disabled={!!checkoutLoading}
                    className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      plan.popular
                        ? 'bg-violet-600 hover:bg-violet-700 text-white'
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                    } disabled:opacity-50`}
                  >
                    {checkoutLoading === plan.key ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : currentPlan !== 'FREE' ? 'Switch Plan' : 'Upgrade'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
