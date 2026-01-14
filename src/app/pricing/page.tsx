'use client';

import { Suspense, useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useSearchParams } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Link from 'next/link';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Get started with essential transit updates',
    features: [
      'View rider reports & official alerts',
      'Report issues anonymously',
      'Save 1 commute',
      'Major disruption alerts only',
    ],
    limitations: ['Limited alert categories', 'No confidence breakdown'],
    cta: 'Current Plan',
    plan: 'free' as const,
  },
  {
    name: 'Plus',
    price: '$4.99',
    period: '/month',
    description: 'More commutes and detailed insights',
    features: [
      'Everything in Free',
      'Save up to 5 commutes',
      'All alert categories',
      'Confidence breakdown',
    ],
    limitations: [],
    cta: 'Upgrade to Plus',
    plan: 'plus' as const,
    popular: true,
  },
  {
    name: 'Pro',
    price: '$9.99',
    period: '/month',
    description: 'Power user features for serious commuters',
    features: [
      'Everything in Plus',
      'Early warning alerts',
      'Lower confidence threshold',
      'Reliability history (coming soon)',
    ],
    limitations: [],
    cta: 'Upgrade to Pro',
    plan: 'pro' as const,
  },
];

function PricingContent() {
  const { user, session, entitlements, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const [stripeConfigured, setStripeConfigured] = useState<boolean | null>(null);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const checkoutResult = searchParams.get('checkout');

  useEffect(() => {
    // Check if Stripe price IDs are configured
    const plusPriceId = process.env.NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID;
    const proPriceId = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID;
    setStripeConfigured(Boolean(plusPriceId && proPriceId));
  }, []);

  const handleUpgrade = async (plan: 'plus' | 'pro') => {
    if (!session?.access_token) {
      // Redirect to login
      window.location.href = '/account?redirect=/pricing';
      return;
    }

    setUpgrading(plan);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Failed to start upgrade process');
    } finally {
      setUpgrading(null);
    }
  };

  const currentPlan = entitlements?.plan || 'free';

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Start free and upgrade as you need more features.
          All plans include unlimited report submissions.
        </p>
      </div>

      {checkoutResult === 'success' && (
        <div className="mb-8 p-4 bg-green-50 text-green-700 rounded-lg text-center">
          Thank you for upgrading! Your new plan is now active.
        </div>
      )}

      {checkoutResult === 'canceled' && (
        <div className="mb-8 p-4 bg-yellow-50 text-yellow-700 rounded-lg text-center">
          Checkout was canceled. No charges were made.
        </div>
      )}

      {stripeConfigured === false && (
        <div className="mb-8 p-4 bg-blue-50 text-blue-700 rounded-lg text-center">
          Subscriptions are not currently configured. Contact support for more information.
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlan === plan.plan;
          const canUpgrade = !isCurrentPlan && plan.plan !== 'free';
          const showUpgradeButton = stripeConfigured && canUpgrade;

          return (
            <Card
              key={plan.name}
              variant="bordered"
              className={`p-6 relative ${
                plan.popular ? 'border-blue-500 border-2' : ''
              }`}
            >
              {plan.popular && (
                <Badge
                  variant="info"
                  className="absolute -top-3 left-1/2 -translate-x-1/2"
                >
                  Most Popular
                </Badge>
              )}

              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h2>
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  <span className="text-gray-500 ml-1">{plan.period}</span>
                </div>
                <p className="text-gray-600 mt-2 text-sm">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <span className="text-green-500 mr-2">&#10003;</span>
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </li>
                ))}
                {plan.limitations.map((limitation) => (
                  <li key={limitation} className="flex items-start text-gray-400">
                    <span className="mr-2">&#10005;</span>
                    <span className="text-sm">{limitation}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                {isCurrentPlan ? (
                  <Button variant="secondary" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : showUpgradeButton ? (
                  <Button
                    variant={plan.popular ? 'primary' : 'outline'}
                    className="w-full"
                    onClick={() => handleUpgrade(plan.plan as 'plus' | 'pro')}
                    disabled={upgrading !== null || authLoading}
                  >
                    {upgrading === plan.plan ? 'Processing...' : plan.cta}
                  </Button>
                ) : plan.plan === 'free' ? (
                  <Link href="/app">
                    <Button variant="outline" className="w-full">
                      Get Started
                    </Button>
                  </Link>
                ) : (
                  <Button variant="outline" className="w-full" disabled>
                    {user ? 'Not Available' : 'Sign in to Upgrade'}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-12 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Frequently Asked Questions
        </h3>
        <div className="max-w-2xl mx-auto space-y-4 text-left">
          <div>
            <h4 className="font-medium text-gray-900">Can I cancel anytime?</h4>
            <p className="text-gray-600 text-sm">
              Yes, you can cancel your subscription at any time. You will keep
              access to your plan features until the end of your billing period.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">
              What happens to my data if I downgrade?
            </h4>
            <p className="text-gray-600 text-sm">
              Your data is preserved. If you exceed the free tier limits
              (e.g., more than 1 commute), you will not be able to add new items
              but existing ones remain accessible.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">
              Do I need to sign up to use TransitPulse?
            </h4>
            <p className="text-gray-600 text-sm">
              No! You can use the core features without signing up. Create an
              account when you want to save your commutes and get personalized alerts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-gray-200 rounded w-1/3 mx-auto"></div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      }
    >
      <PricingContent />
    </Suspense>
  );
}
