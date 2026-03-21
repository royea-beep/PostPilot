/**
 * @royea/billing-provider
 * Unified billing for Israeli merchants (Payplus) + LemonSqueezy support
 *
 * IRON RULE: Israeli merchant = Payplus ONLY
 * LemonSqueezy support kept for international SaaS / migration period only
 *
 * Usage:
 *   import { createCheckout, verifyWebhook } from '@royea/shared-utils/billing-provider'
 */

export type BillingProvider = 'payplus' | 'lemonsqueezy';

export interface CheckoutOptions {
  productId: string;
  userId: string;
  userEmail: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface CheckoutResult {
  checkoutUrl: string;
  sessionId: string;
  provider: BillingProvider;
}

export interface Subscription {
  id: string;
  userId: string;
  status: 'active' | 'cancelled' | 'past_due' | 'trialing' | 'paused';
  planId: string;
  currentPeriodEnd: Date;
  provider: BillingProvider;
}

// ── PAYPLUS (Israeli merchant — primary) ──────────────────────────────────────
export async function createPayplusCheckout(opts: CheckoutOptions): Promise<CheckoutResult> {
  const apiKey = process.env.PAYPLUS_API_KEY;
  const secret = process.env.PAYPLUS_SECRET;
  if (!apiKey || !secret) throw new Error('Payplus credentials not configured');

  const response = await fetch('https://restapi.payplus.co.il/api/v1.0/PaymentPages/generateLink', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `${apiKey}.${secret}`,
    },
    body: JSON.stringify({
      payment_page_uid: opts.productId,
      refURL_success: opts.successUrl,
      refURL_failure: opts.cancelUrl,
      customer: { email: opts.userEmail },
      more_info: JSON.stringify({ userId: opts.userId, ...opts.metadata }),
    }),
  });

  if (!response.ok) throw new Error(`Payplus error: ${response.statusText}`);
  const data = await response.json() as { results?: { status: string; message?: string }; data?: { payment_page_link: string; page_request_uid: string } };
  if (data.results?.status !== '1') throw new Error(`Payplus: ${data.results?.message}`);

  return {
    checkoutUrl: data.data?.payment_page_link ?? '',
    sessionId: data.data?.page_request_uid ?? '',
    provider: 'payplus',
  };
}

export function verifyPayplusWebhook(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require('crypto') as typeof import('crypto');
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

// ── LEMONSQUEEZY (international SaaS — primary for non-Israeli products) ──────
export async function createLemonSqueezyCheckout(opts: CheckoutOptions): Promise<CheckoutResult> {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (!apiKey) throw new Error('LemonSqueezy API key not configured');

  const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/vnd.api+json',
      'Accept': 'application/vnd.api+json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            email: opts.userEmail,
            custom: { user_id: opts.userId, ...opts.metadata },
          },
          product_options: { redirect_url: opts.successUrl },
        },
        relationships: {
          store: { data: { type: 'stores', id: process.env.LEMONSQUEEZY_STORE_ID } },
          variant: { data: { type: 'variants', id: opts.productId } },
        },
      },
    }),
  });

  if (!response.ok) throw new Error(`LemonSqueezy error: ${response.statusText}`);
  const data = await response.json() as { data?: { id: string; attributes?: { url: string } } };

  return {
    checkoutUrl: data.data?.attributes?.url ?? '',
    sessionId: data.data?.id ?? '',
    provider: 'lemonsqueezy',
  };
}

export function verifyLemonSqueezyWebhook(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require('crypto') as typeof import('crypto');
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return expected === signature;
}

// ── UNIFIED INTERFACE ─────────────────────────────────────────────────────────
export async function createCheckout(
  opts: CheckoutOptions,
  provider: BillingProvider = 'lemonsqueezy'
): Promise<CheckoutResult> {
  if (provider === 'payplus') return createPayplusCheckout(opts);
  return createLemonSqueezyCheckout(opts);
}

export function verifyWebhook(
  payload: string,
  signature: string,
  secret: string,
  provider: BillingProvider = 'lemonsqueezy'
): boolean {
  if (provider === 'payplus') return verifyPayplusWebhook(payload, signature, secret);
  return verifyLemonSqueezyWebhook(payload, signature, secret);
}

// ── LEMONSQUEEZY PLAN HELPERS ─────────────────────────────────────────────────
export interface LSPlan {
  name: string;
  variantId: string;
  price: number;
  currency: string;
  limit?: number;
}

export function getLSPlanByVariant(variantId: string, plans: LSPlan[]): LSPlan | undefined {
  return plans.find(p => p.variantId === variantId);
}

export function parseLSWebhookEvent(body: Record<string, unknown>): {
  event: string;
  userId: string | null;
  variantId: string;
  orderId: string;
} {
  const meta = body.meta as Record<string, unknown> | undefined;
  const data = body.data as Record<string, unknown> | undefined;
  const attrs = data?.attributes as Record<string, unknown> | undefined;
  const customData = (meta?.custom_data ?? attrs?.custom_data ?? {}) as Record<string, string>;

  return {
    event: (meta?.event_name ?? '') as string,
    userId: customData.user_id ?? null,
    variantId: String(attrs?.variant_id ?? ''),
    orderId: String(data?.id ?? ''),
  };
}
