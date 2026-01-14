import Stripe from 'stripe';

// Server-side Stripe client
export function getStripe(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return null;
  }
  return new Stripe(secretKey, {
    apiVersion: '2025-12-15.clover',
  });
}

// Check if Stripe is configured
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

// Check if price IDs are configured
export function arePriceIdsConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID &&
      process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID
  );
}

// Get price IDs
export function getPriceIds() {
  return {
    plus: process.env.NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID || null,
    pro: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || null,
  };
}
