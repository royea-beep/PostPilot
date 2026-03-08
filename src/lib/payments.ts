/**
 * Payment provider for PostPilot.
 * Uses LemonSqueezy (works from Israel, acts as Merchant of Record).
 */

import {
  lemonSqueezySetup,
  createCheckout,
  getSubscription,
  cancelSubscription,
} from '@lemonsqueezy/lemonsqueezy.js';

function initLS() {
  const key = process.env.LEMONSQUEEZY_API_KEY;
  if (!key) throw new Error('LEMONSQUEEZY_API_KEY not set');
  lemonSqueezySetup({ apiKey: key });
}

export const PLANS = {
  FREE: {
    name: 'Free',
    brandsLimit: 2,
    postsPerMonth: 10,
    price: 0,
  },
  PRO: {
    name: 'Pro',
    brandsLimit: 10,
    postsPerMonth: 100,
    price: 29,
    variantId: process.env.LEMONSQUEEZY_PRO_VARIANT_ID || '',
  },
  AGENCY: {
    name: 'Agency',
    brandsLimit: -1, // unlimited
    postsPerMonth: -1,
    price: 79,
    variantId: process.env.LEMONSQUEEZY_AGENCY_VARIANT_ID || '',
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export function getPlanLimits(plan: string) {
  return PLANS[plan as PlanKey] || PLANS.FREE;
}

/** Public plan display for billing UI (SecretSauce: single source of truth, no variant IDs). */
export function getPlanDisplay(): { key: string; name: string; price: number; features: string[]; popular?: boolean }[] {
  return [
    { key: 'FREE', name: PLANS.FREE.name, price: PLANS.FREE.price, features: ['2 brands', '10 posts/month', 'AI captions', '3 platforms'] },
    { key: 'PRO', name: PLANS.PRO.name, price: PLANS.PRO.price, popular: true, features: ['10 brands', '100 posts/month', 'AI captions', 'Style DNA', 'Priority support'] },
    { key: 'AGENCY', name: PLANS.AGENCY.name, price: PLANS.AGENCY.price, features: ['Unlimited brands', 'Unlimited posts', 'All Pro features', 'Team members (soon)', 'White-label (soon)'] },
  ];
}

/** Create a LemonSqueezy checkout URL for a plan */
export async function createCheckoutUrl(opts: {
  plan: 'PRO' | 'AGENCY';
  userId: string;
  email: string;
  name: string;
  successUrl: string;
}): Promise<string> {
  initLS();

  const planConfig = PLANS[opts.plan];
  if (!('variantId' in planConfig) || !planConfig.variantId) {
    throw new Error(`No variant ID configured for plan ${opts.plan}`);
  }

  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  if (!storeId) throw new Error('LEMONSQUEEZY_STORE_ID not set');

  const { data, error } = await createCheckout(storeId, planConfig.variantId, {
    checkoutData: {
      email: opts.email,
      name: opts.name,
      custom: {
        user_id: opts.userId,
        plan: opts.plan,
      },
    },
    productOptions: {
      redirectUrl: opts.successUrl,
    },
  });

  if (error || !data) {
    throw new Error(error?.message || 'Failed to create checkout');
  }

  return (data as { data: { attributes: { url: string } } }).data.attributes.url;
}

/** Get subscription details */
export async function getSubscriptionDetails(subscriptionId: string) {
  initLS();
  const { data, error } = await getSubscription(subscriptionId);
  if (error) throw new Error(error.message);
  return data;
}

/** Cancel a subscription */
export async function cancelSub(subscriptionId: string) {
  initLS();
  const { error } = await cancelSubscription(subscriptionId);
  if (error) throw new Error(error.message);
}
