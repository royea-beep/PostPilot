import { NextResponse } from 'next/server';
import { getPlanDisplay } from '@/lib/payments';

/**
 * GET /api/billing/plans — public plan display for billing page (SecretSauce: no client-side hardcoding).
 * Returns names, prices, and feature copy only. No variant IDs or server-only data.
 */
export async function GET() {
  const plans = getPlanDisplay();
  return NextResponse.json(plans);
}
