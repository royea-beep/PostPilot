import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

/**
 * LemonSqueezy webhook handler for PostPilot.
 * Events: subscription_created, subscription_updated, subscription_cancelled, subscription_expired
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

  if (!secret) {
    console.error('LEMONSQUEEZY_WEBHOOK_SECRET not set');
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
        break;
      }

      case 'subscription_updated': {
        const status = attrs.status === 'active' ? 'ACTIVE'
          : attrs.status === 'past_due' ? 'PAST_DUE'
          : attrs.status === 'cancelled' ? 'CANCELED'
          : attrs.status === 'paused' ? 'PAUSED'
          : 'INACTIVE';

        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: status,
            currentPeriodEnd: attrs.renews_at ? new Date(attrs.renews_at) : null,
          },
        });
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
  } catch (err) {
    console.error('Webhook handler error:', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
