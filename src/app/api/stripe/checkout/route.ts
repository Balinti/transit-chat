import { NextRequest, NextResponse } from 'next/server';
import { getStripe, isStripeConfigured, getPriceIds } from '@/lib/stripe';
import { getServiceSupabase, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: 'Stripe not configured' },
      { status: 503 }
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    );
  }

  try {
    const stripe = getStripe()!;
    const supabase = getServiceSupabase();

    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { plan } = body;

    if (!plan || !['plus', 'pro'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    const priceIds = getPriceIds();
    const priceId = plan === 'plus' ? priceIds.plus : priceIds.pro;

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID not configured for this plan' },
        { status: 503 }
      );
    }

    // Get or create Stripe customer
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    let customerId = existingSub?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
          app_name: 'transit-chat',
        },
      });
      customerId = customer.id;

      // Save customer ID
      await supabase
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          stripe_customer_id: customerId,
        });
    }

    // Create checkout session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/account?checkout=success`,
      cancel_url: `${appUrl}/pricing?checkout=canceled`,
      metadata: {
        user_id: user.id,
        app_name: 'transit-chat',
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          app_name: 'transit-chat',
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error in POST /api/stripe/checkout:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
