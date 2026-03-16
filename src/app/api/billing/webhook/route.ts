import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';
import { emitServerEvent } from '@/lib/learning';

/**
 * LemonSqueezy webhook handler for PostPilot.
 * Events: subscription_created, subscription_updated, subscription_cancelled, subscription_expired
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV !== 'production') console.error('Webhook secret not configured');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const sigHeader = req.headers.get('x-signature');
  if (!sigHeader) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  // HMAC-SHA256 with LEMONSQUEEZY_WEBHOOK_SECRET; reject invalid signature with 400
  const expectedHex = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const expectedBuf = Buffer.from(expectedHex, 'hex');
  const sigBuf = Buffer.from(sigHeader, 'hex');
  if (expectedBuf.length !== sigBuf.length || !crypto.timingSafeEqual(expectedBuf, sigBuf)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventName = payload.meta?.event_name;
  const customData = payload.meta?.custom_data;
  const userId = customData?.user_id;
  const attrs = payload.data?.attributes;

  if (!userId || !attrs) {
    return NextResponse.json({ received: true });
  }

  try {
    switch (eventName) {
      case 'subscription_created': {
        const plan = customData?.plan || 'PRO';

        // Determine previous plan for learning hook
        const existingUser = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });
        const fromPlan = existingUser?.plan || 'FREE';

        await prisma.user.update({
          where: { id: userId },
          data: {
            plan,
            lsSubscriptionId: String(payload.data.id),
            lsCustomerId: String(attrs.customer_id),
            subscriptionStatus: 'ACTIVE',
            currentPeriodEnd: attrs.renews_at ? new Date(attrs.renews_at) : null,
          },
        });

        // Learning hook: planUpgraded
        emitServerEvent('plan_upgraded', 'billing', undefined, { fromPlan, toPlan: plan });
        break;
      }

      case 'subscription_updated': {
        const newStatus = attrs.status === 'active' ? 'ACTIVE'
          : attrs.status === 'on_trial' ? 'ACTIVE'
          : attrs.status === 'past_due' ? 'PAST_DUE'
          : attrs.status === 'cancelled' ? 'CANCELED'
          : attrs.status === 'paused' ? 'PAUSED'
          : null;

        // Never overwrite ACTIVE with a lesser status
        const updateData: Record<string, unknown> = {
          currentPeriodEnd: attrs.renews_at ? new Date(attrs.renews_at) : null,
        };
        if (newStatus) {
          const current = await prisma.user.findUnique({ where: { id: userId }, select: { subscriptionStatus: true } });
          if (!(current?.subscriptionStatus === 'ACTIVE' && newStatus !== 'ACTIVE')) {
            updateData.subscriptionStatus = newStatus;
          }
        }

        await prisma.user.update({ where: { id: userId }, data: updateData });
        break;
      }

      case 'subscription_cancelled':
      case 'subscription_expired': {
        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: 'FREE',
            subscriptionStatus: 'CANCELED',
            lsSubscriptionId: null,
          },
        });
        break;
      }
    }
  } catch {
    const eventId = payload?.data?.id;
    const eventType = eventName ?? 'unknown';
    if (process.env.NODE_ENV !== 'production') console.error(`Webhook handler failed: event=${eventType} id=${eventId ?? 'n/a'}`);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
