import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe, isStripeConfigured } from '@/lib/stripe';
import { getServiceSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { SubscriptionPlan, SubscriptionStatus } from '@/types';

// Helper to extract subscription data safely
function extractSubData(sub: Stripe.Subscription) {
  // Access properties that may have different names in different Stripe SDK versions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subAny = sub as any;
  return {
    id: sub.id,
    status: sub.status,
    items: sub.items,
    metadata: sub.metadata,
    cancel_at_period_end: sub.cancel_at_period_end,
    // current_period_end may be at root or nested
    current_period_end: (subAny.current_period_end ?? subAny.currentPeriodEnd ?? Date.now() / 1000) as number,
  };
}

export async function POST(request: NextRequest) {
  if (!isStripeConfigured() || !isSupabaseConfigured()) {
    // Always return 200 for webhook endpoints
    return NextResponse.json({ received: true });
  }

  try {
    const stripe = getStripe()!;
    const supabase = getServiceSupabase();
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    let event: Stripe.Event;

    // Verify signature if webhook secret is configured
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        console.error('Webhook signature verification failed:', err);
        // Return 200 anyway to prevent Stripe retries
        return NextResponse.json({ received: true, error: 'signature_failed' });
      }
    } else {
      // No signature verification (development mode)
      event = JSON.parse(body);
    }

    // Process events
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // Check if this is for our app
        if (session.metadata?.app_name !== 'transit-chat') {
          break;
        }

        const userId = session.metadata?.user_id;
        if (!userId || !session.subscription) {
          break;
        }

        // Get subscription details
        const subResponse = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        const subData = extractSubData(subResponse);

        // Determine plan from price
        const priceId = subData.items.data[0]?.price?.id;
        let plan: SubscriptionPlan = 'free';
        if (priceId === process.env.NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID) {
          plan = 'plus';
        } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID) {
          plan = 'pro';
        }

        await supabase.from('subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subData.id,
          plan,
          status: subData.status as SubscriptionStatus,
          current_period_end: new Date(
            subData.current_period_end * 1000
          ).toISOString(),
          cancel_at_period_end: subData.cancel_at_period_end,
        });
        break;
      }

      case 'customer.subscription.updated': {
        const updatedSubRaw = event.data.object as Stripe.Subscription;
        const updatedSub = extractSubData(updatedSubRaw);

        // Check if this is for our app
        if (updatedSub.metadata?.app_name !== 'transit-chat') {
          break;
        }

        const updatedUserId = updatedSub.metadata?.user_id;
        if (!updatedUserId) {
          break;
        }

        // Determine plan from price
        const updatedPriceId = updatedSub.items.data[0]?.price?.id;
        let updatedPlan: SubscriptionPlan = 'free';
        if (updatedPriceId === process.env.NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID) {
          updatedPlan = 'plus';
        } else if (updatedPriceId === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID) {
          updatedPlan = 'pro';
        }

        await supabase.from('subscriptions').upsert({
          user_id: updatedUserId,
          stripe_subscription_id: updatedSub.id,
          plan: updatedPlan,
          status: updatedSub.status as SubscriptionStatus,
          current_period_end: new Date(
            updatedSub.current_period_end * 1000
          ).toISOString(),
          cancel_at_period_end: updatedSub.cancel_at_period_end,
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const deletedSubRaw = event.data.object as Stripe.Subscription;

        if (deletedSubRaw.metadata?.app_name !== 'transit-chat') {
          break;
        }

        const deletedUserId = deletedSubRaw.metadata?.user_id;
        if (!deletedUserId) {
          break;
        }

        await supabase
          .from('subscriptions')
          .update({
            plan: 'free',
            status: 'canceled',
            stripe_subscription_id: null,
          })
          .eq('user_id', deletedUserId);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error in webhook:', error);
    // Always return 200 for webhooks
    return NextResponse.json({ received: true, error: 'processing_failed' });
  }
}

// Disable body parsing for webhooks
export const runtime = 'nodejs';
